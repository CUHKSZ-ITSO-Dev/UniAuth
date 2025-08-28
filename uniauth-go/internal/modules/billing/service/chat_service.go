package service

import (
	"errors"
	"fmt"
	"time"
	"uniauth/internal/modules/billing/model"
	rbacService "uniauth/internal/modules/rbac/service"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// ChatService 封装了与聊天计费相关的业务逻辑
type ChatService struct {
	DB      *gorm.DB
	Service *rbacService.AbstractGroupService
}

// NewChatService 创建一个新的 ChatService 实例
func NewChatService(db *gorm.DB, service *rbacService.AbstractGroupService) *ChatService {
	return &ChatService{
		DB:      db,
		Service: service,
	}
}

// ========== 服务接口 ==========

// Bill 对指定用户进行扣费
func (s *ChatService) Bill(upn string, cost decimal.Decimal, modelName string, tokens int64) error {
	// 1. 获取计费上下文
	userAccount, categories, err := s.getBillingContext(upn)
	if err != nil {
		return err
	}

	// 2. 在事务中执行扣款和创建消费记录
	return s.DB.Transaction(func(tx *gorm.DB) error {
		// 步骤一：调用模型方法扣款
		source, kind, err := userAccount.DeductBalance(tx, categories, cost)
		if err != nil {
			return fmt.Errorf("[计费] 执行扣款失败: %w", err)
		}

		// 步骤二：创建消费记录
		record := model.ChatUserCostRecord{
			UPN:    userAccount.UPN,
			Cost:   cost,
			Model:  modelName,
			Source: source,
			Tokens: tokens,
			Kind:   kind,
		}
		if err := tx.Create(&record).Error; err != nil {
			return fmt.Errorf("[计费] 创建消费记录失败: %w", err)
		}

		return nil
	})
}

// ResetBalance 重置用户余额
func (s *ChatService) ResetBalance(upn string, resetAnyway bool) error {
	userAccount, categories, err := s.getBillingContext(upn)
	if err != nil {
		return err
	}
	return userAccount.ResetBalance(s.DB, categories, resetAnyway)
}

// EnsureChatAccountExists 确保用户的聊天账户存在，如果不存在则创建
func (s *ChatService) EnsureChatAccountExists(upn string) error {
	// 检查UPN是否有效，防止创建空账户
	if upn == "" {
		return fmt.Errorf("[对话] 用户UPN不能为空。")
	}

	var userAccount model.ChatUserAccount
	err := s.DB.Where("upn = ?", upn).First(&userAccount).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 账户不存在，创建新账户
			if createErr := s.DB.Create(&model.ChatUserAccount{
				UPN:           upn,
				Balance:       decimal.Zero,
				TokenPackage:  decimal.Zero,
				LastResetTime: time.Now(),
			}).Error; createErr != nil {
				return fmt.Errorf("[对话] 创建对话用户账户失败: upn = %s: %w", upn, createErr)
			}
			// 强制重置账户
			if resetErr := s.ResetBalance(upn, true); resetErr != nil {
				return fmt.Errorf("[对话] 重置对话用户账户失败: upn = %s: %w", upn, resetErr)
			}
			// 账户创建成功
			return nil
		}
		// 其他数据库错误
		return fmt.Errorf("[对话] 获取对话用户账户失败: upn = %s: %w", upn, err)
	}

	// 账户已存在
	return nil
}

// ========== 辅助函数 ==========

// getBillingContext 权限系统用户的抽象组 -> 用户系统的用户的对话用户组
func (s *ChatService) getBillingContext(upn string) (*model.ChatUserAccount, []*model.ChatUserCategory, error) {
	// 1. 获取用户所属的抽象组
	userAbstractGroups, err := s.Service.GetUserAbstractGroups(upn)
	if err != nil {
		return nil, nil, fmt.Errorf("[权限] 获取用户抽象组失败: %w", err)
	}
	if len(userAbstractGroups) == 0 {
		return nil, nil, fmt.Errorf("[权限] 用户 %s 未分配任何抽象组。请检查用户权限配置", upn)
	}

	// 2. 提取组名，并查询对应的ChatUserCategory
	var groupNames []string
	for _, group := range userAbstractGroups {
		groupNames = append(groupNames, group.Name)
	}
	var categories []*model.ChatUserCategory
	if err := s.DB.Preload("QuotaPool").Where("name IN ?", groupNames).Find(&categories).Error; err != nil {
		return nil, nil, fmt.Errorf("[计费] 查询用户计费组信息失败: %w", err)
	}
	if len(categories) == 0 {
		return nil, nil, fmt.Errorf("[计费] 用户 %s 所属的抽象组均未在计费系统中配置", upn)
	}

	// 3. 获取用户计费账户
	var userAccount model.ChatUserAccount
	if err := s.DB.Where("upn = ?", upn).First(&userAccount).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, fmt.Errorf("[计费] 找不到UPN为 '%s' 的计费账户，请检查UPN是否传递错误或联系管理员初始化", upn)
		}
		return nil, nil, fmt.Errorf("[计费] 获取用户账户失败: %w", err)
	}

	return &userAccount, categories, nil
}

// UpdateChatCategory 更新一个 ChatUserCategory 的信息，包括其关联的预算池
func (s *ChatService) UpdateChatCategory(id string, input *model.ChatUserCategory) (*model.ChatUserCategory, error) {
	var category model.ChatUserCategory

	// 在一个事务中完成所有操作
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 首先，找到要更新的用户组，并预加载当前的预算池信息
		if err := tx.Preload("QuotaPool").First(&category, id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("找不到 ID 为 %s 的用户组", id)
			}
			return err
		}

		// 2. 在内存中准备对 category 对象的修改
		// 首先更新基础信息
		category.Name = input.Name
		category.DefaultQuota = input.DefaultQuota
		category.ResetCircle = input.ResetCircle
		category.Priority = input.Priority

		var oldPoolIDToDelete *uint

		// 2.1 处理解绑旧的预算池
		if input.ChatQuotaPoolID != nil && *input.ChatQuotaPoolID == 0 {
			if category.ChatQuotaPoolID != nil && *category.ChatQuotaPoolID != 0 {
				// 记录需要删除的旧预算池ID
				oldPoolIDToDelete = category.ChatQuotaPoolID
				// 在内存中清除外键关系
				category.ChatQuotaPoolID = nil
			}
		} else if input.QuotaPool != nil {
			// 2.2 创建或更新预算池
			// Save 会根据 QuotaPool.ID 是否为0来决定是创建还是更新
			if err := tx.Save(input.QuotaPool).Error; err != nil {
				return fmt.Errorf("保存预算池失败: %w", err)
			}
			// 将新的预算池ID关联到用户组
			category.ChatQuotaPoolID = &input.QuotaPool.ID
		}

		// 3. 将对 category 的所有修改一次性保存
		if err := tx.Save(&category).Error; err != nil {
			return fmt.Errorf("保存用户组信息失败: %w", err)
		}

		// 4. 如果有需要，删除旧的预算池
		if oldPoolIDToDelete != nil {
			if err := tx.Unscoped().Delete(&model.ChatQuotaPool{}, *oldPoolIDToDelete).Error; err != nil {
				return fmt.Errorf("删除旧的预算池失败: %w", err)
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 重新加载以返回最新的数据，包括关联的预算池
	if err := s.DB.Preload("QuotaPool").First(&category, id).Error; err != nil {
		return nil, err
	}

	return &category, nil
}
