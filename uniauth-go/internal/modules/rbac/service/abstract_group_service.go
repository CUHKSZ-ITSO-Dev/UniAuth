package service

import (
	"fmt"
	"log"
	"uniauth/internal/modules/rbac/model"
	billingModel "uniauth/internal/modules/billing/model"
	userService "uniauth/internal/modules/user/service"

	"gorm.io/gorm"
)

// AbstractGroupWithCategory 结合了抽象组和其关联的用户组信息。
type AbstractGroupWithCategory struct {
	model.AbstractGroup
	ChatCategory *billingModel.ChatUserCategory `json:"chatCategory"`
}

// AbstractGroupService 提供了管理抽象组的服务。
type AbstractGroupService struct {
	DB              *gorm.DB
	AuthService     *AuthService
	UserInfoService *userService.UserInfoService
}

// NewAbstractGroupService 创建一个新的 AbstractGroupService 实例。
func NewAbstractGroupService(db *gorm.DB, authService *AuthService, userInfoService *userService.UserInfoService) *AbstractGroupService {
	return &AbstractGroupService{
		DB:              db,
		AuthService:     authService,
		UserInfoService: userInfoService,
	}
}

// CreateAbstractGroup 创建一个新的抽象组及其关联的资源。
func (s *AbstractGroupService) CreateAbstractGroup(newGroup *model.AbstractGroup, creatorUPN string) error {
	// 使用事务确保操作的原子性
	if err := s.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 保存到数据库
		if result := tx.Create(newGroup); result.Error != nil {
			return fmt.Errorf("创建抽象组失败: %w", result.Error)
		}

		// 2. 同步创建 ChatUserCategory
		chatCategory := billingModel.ChatUserCategory{
			Name: newGroup.Name,
		}
		if result := tx.Create(&chatCategory); result.Error != nil {
			return fmt.Errorf("创建聊天用户分类失败: %w", result.Error)
		}
		return nil
	}); err != nil {
		return err // 直接返回事务错误
	}

	// 3. 创建关联的权限
	// 注意：SetupPermissionsForNewAbstractGroup 内部的 Casbin 操作不是事务性的。
	// 如果这里失败，数据库事务已经提交。这需要在设计上考虑补偿逻辑。
	if err := s.SetupPermissionsForNewAbstractGroup(newGroup, creatorUPN); err != nil {
		// 尝试回滚（删除已创建的组和分类），但这可能不是最佳实践
		s.DB.Delete(newGroup)
		s.DB.Where("name = ?", newGroup.Name).Delete(&billingModel.ChatUserCategory{})
		return fmt.Errorf("权限设置失败，已回滚初始创建: %w", err)
	}

	return nil
}

// SetupPermissionsForNewAbstractGroup 为新的抽象组设置权限
func (s *AbstractGroupService) SetupPermissionsForNewAbstractGroup(group *model.AbstractGroup, creatorUpn string) error {
	// 1. 定义管理员角色名称
	adminRole := "role:abstract-group:" + group.Name + ":admin"

	// 2. 创建权限策略: p, adminRole, "abstract-group", group.Name, "edit", "allow"
	_, err := s.AuthService.Enforcer.AddPolicy(adminRole, "abstract-group", group.Name, "edit", "allow")
	if err != nil {
		return err
	}

	// 3. 将创建者赋予该管理员角色: g, creatorUpn, adminRole
	_, err = s.AuthService.Enforcer.AddRoleForUser(creatorUpn, adminRole)
	if err != nil {
		return err
	}

	// 保存所有更改
	return s.AuthService.Enforcer.SavePolicy()
}

// CleanupCasbinForAbstractGroup 清理与抽象组相关的所有Casbin规则
func (s *AbstractGroupService) CleanupCasbinForAbstractGroup(group *model.AbstractGroup) error {
	// 1. 移除所有属于该组的用户成员 (e.g., g, user1, my-group-name)
	// group.Name 是casbin中的角色/组名
	_, err := s.AuthService.Enforcer.RemoveFilteredGroupingPolicy(1, group.Name)
	if err != nil {
		return fmt.Errorf("清理组成员失败: %w", err)
	}

	// 2. 定义并移除该组的管理角色及其权限
	adminRole := "role:abstract-group:" + group.Name + ":admin"

	// 移除权限策略 (e.g., p, a-group-admin-role, abstract-group, group-id, edit)
	_, err = s.AuthService.Enforcer.RemoveFilteredPolicy(0, adminRole)
	if err != nil {
		return fmt.Errorf("清理管理权限策略失败: %w", err)
	}

	// 移除赋予管理员的角色 (e.g., g, some_admin, a-group-admin-role)
	_, err = s.AuthService.Enforcer.RemoveFilteredGroupingPolicy(1, adminRole)
	if err != nil {
		return fmt.Errorf("清理管理角色分配失败: %w", err)
	}

	// 3. 保存所有更改
	return s.AuthService.Enforcer.SavePolicy()
}

// GetUserAbstractGroups 获取一个用户所属的所有抽象组
func (s *AbstractGroupService) GetUserAbstractGroups(upn string) ([]*model.AbstractGroup, error) {
	// 1. 获取用户在Casbin中的所有角色
	userRoles, err := s.AuthService.Enforcer.GetRolesForUser(upn)
	if err != nil {
		return nil, fmt.Errorf("从Casbin获取用户角色失败: %w", err)
	}
	if len(userRoles) == 0 {
		return []*model.AbstractGroup{}, nil // 用户不属于任何角色
	}

	// 2. 将角色列表转换为map以便快速查找
	userRolesMap := make(map[string]struct{})
	for _, role := range userRoles {
		userRolesMap[role] = struct{}{}
	}

	// 3. 从数据库获取所有抽象组的定义
	var allAbstractGroups []*model.AbstractGroup
	if err := s.DB.Find(&allAbstractGroups).Error; err != nil {
		return nil, fmt.Errorf("从数据库获取所有抽象组失败: %w", err)
	}

	// 4. 找出交集
	var userAbstractGroups []*model.AbstractGroup
	for _, group := range allAbstractGroups {
		// 抽象组的Name字段对应Casbin中的role名
		if _, ok := userRolesMap[group.Name]; ok {
			userAbstractGroups = append(userAbstractGroups, group)
		}
	}

	return userAbstractGroups, nil
}

// GetAbstractGroupByID 通过ID获取单个抽象组。
func (s *AbstractGroupService) GetAbstractGroupByID(id string) (*model.AbstractGroup, error) {
	var group model.AbstractGroup
	if result := s.DB.First(&group, "id = ?", id); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("找不到抽象组")
		}
		return nil, result.Error
	}
	return &group, nil
}

// GetAllAbstractGroups 获取所有抽象组，并附带其关联的 UserCategory 信息。
func (s *AbstractGroupService) GetAllAbstractGroups() ([]AbstractGroupWithCategory, error) {
	var groups []model.AbstractGroup
	if result := s.DB.Order("name").Find(&groups); result.Error != nil {
		return nil, fmt.Errorf("获取抽象组列表失败: %w", result.Error)
	}

	var categories []billingModel.ChatUserCategory
	if result := s.DB.Preload("QuotaPool").Find(&categories); result.Error != nil {
		return nil, fmt.Errorf("获取聊天分类列表失败: %w", result.Error)
	}

	// 为了高效查找，将 categories 转换为 map
	categoryMap := make(map[string]*billingModel.ChatUserCategory)
	for i := range categories {
		categoryMap[categories[i].Name] = &categories[i]
	}

	// 组合数据
	var result []AbstractGroupWithCategory
	for _, group := range groups {
		result = append(result, AbstractGroupWithCategory{
			AbstractGroup: group,
			ChatCategory:  categoryMap[group.Name], // 如果找不到，则为 nil
		})
	}

	if result == nil {
		return make([]AbstractGroupWithCategory, 0), nil
	}

	return result, nil
}

// UpdateAbstractGroup 更新一个已存在的抽象组。
func (s *AbstractGroupService) UpdateAbstractGroup(id string, updatedInfo *model.AbstractGroup) (*model.AbstractGroup, error) {
	var group model.AbstractGroup
	if result := s.DB.First(&group, "id = ?", id); result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("找不到抽象组")
		}
		return nil, result.Error
	}
	originalName := group.Name

	// 更新字段
	group.Name = updatedInfo.Name
	group.Description = updatedInfo.Description
	group.Type = updatedInfo.Type
	group.Rule = updatedInfo.Rule

	// 开启事务
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 保存抽象组的更新
		if result := tx.Save(&group); result.Error != nil {
			return fmt.Errorf("更新抽象组失败: %w", result.Error)
		}

		// 2. 如果组名发生变化，则同步更新 ChatUserCategory 的名称
		if originalName != group.Name {
			result := tx.Model(&billingModel.ChatUserCategory{}).Where("name = ?", originalName).Update("name", group.Name)
			if result.Error != nil {
				return fmt.Errorf("更新聊天用户组名称失败: %w", result.Error)
			}
			if result.RowsAffected == 0 {
				return fmt.Errorf("找不到对应的聊天用户组: %s", originalName)
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &group, nil
}

// DeleteAbstractGroup 删除一个抽象组及其所有关联数据。
func (s *AbstractGroupService) DeleteAbstractGroup(id string) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 先从数据库找到这个组的定义
		var group model.AbstractGroup
		if result := tx.First(&group, "id = ?", id); result.Error != nil {
			return fmt.Errorf("找不到抽象组: %w", result.Error)
		}

		// 2. 清理所有相关的Casbin规则
		if err := s.CleanupCasbinForAbstractGroup(&group); err != nil {
			return fmt.Errorf("清理Casbin规则失败: %w", err)
		}

		// 3. 从数据库中删除 ChatUserCategory
		if result := tx.Where("name = ?", group.Name).Delete(&billingModel.ChatUserCategory{}); result.Error != nil {
			return fmt.Errorf("删除聊天用户组失败: %w", result.Error)
		}

		// 4. 最后再从数据库中删除抽象组的定义
		if result := tx.Delete(&model.AbstractGroup{}, "id = ?", id); result.Error != nil {
			return fmt.Errorf("删除抽象组失败: %w", result.Error)
		}

		return nil
	})
}

// SyncAbstractGroup 同步单个抽象组的核心逻辑
func (s *AbstractGroupService) SyncAbstractGroup(groupID string) (int, error) {
	// 返回值为（同步了多少个人，错误）

	// 1. 获取组定义
	var group model.AbstractGroup
	if result := s.DB.First(&group, "id = ?", groupID); result.Error != nil {
		return 0, fmt.Errorf("找不到抽象组: %s", groupID)
	}

	log.Printf("开始同步抽象组: %s (ID: %d)", group.Name, group.ID)

	// 2. 清理该组所有旧的Casbin 'g' 规则
	// group.Name 是casbin中的角色/组
	_, err := s.AuthService.Enforcer.RemoveFilteredGroupingPolicy(1, group.Name)
	if err != nil {
		return 0, fmt.Errorf("清理旧组成员失败: %w", err)
	}
	log.Printf("已清理组 '%s' 的旧成员。", group.Name)

	// 3. 获取新成员列表
	var upns []string
	switch group.Type {
	case "ittools":
		upns, err = s.UserInfoService.GetUserUPNsByRule(group.Rule.Ittools)
		if err != nil {
			return 0, fmt.Errorf("从ittools获取用户失败: %w", err)
		}
	case "manual":
		upns, err = s.getUpnsFromManualRule(&group)
		if err != nil {
			return 0, fmt.Errorf("从手动规则获取用户失败: %w", err)
		}
	default:
		return 0, fmt.Errorf("未知的抽象组类型: %s", group.Type)
	}

	log.Printf("为组 '%s' 获取到 %d 个新成员。", group.Name, len(upns))

	// 4. 添加新成员到Casbin
	if len(upns) > 0 {
		rules := make([][]string, len(upns))
		for i, upn := range upns {
			rules[i] = []string{upn, group.Name}
		}
		_, err := s.AuthService.Enforcer.AddGroupingPolicies(rules)
		if err != nil {
			return 0, fmt.Errorf("批量添加组成员失败: %w", err)
		}
	}

	// 5. 保存策略
	if err := s.AuthService.Enforcer.SavePolicy(); err != nil {
		return 0, fmt.Errorf("保存Casbin策略失败: %w", err)
	}

	log.Printf("成功同步抽象组: %s, 共处理 %d 个成员。", group.Name, len(upns))
	return len(upns), nil
}

// 从手动规则中获取UPN
func (s *AbstractGroupService) getUpnsFromManualRule(group *model.AbstractGroup) ([]string, error) {
	if group.Rule.Manual == nil {
		return []string{}, nil
	}
	return group.Rule.Manual.UPNs, nil
}
