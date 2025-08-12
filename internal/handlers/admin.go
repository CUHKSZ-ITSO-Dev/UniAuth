package handlers

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"uniauth/internal/models"
	"uniauth/internal/services"

	"math"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// AdminHandler 管理员处理器
type AdminHandler struct {
	Service         *services.AuthService
	UserInfoService *services.UserInfoService
}

// NewAdminHandler 创建管理员处理器
func NewAdminHandler(service *services.AuthService, userInfoService *services.UserInfoService) *AdminHandler {
	return &AdminHandler{
		Service:         service,
		UserInfoService: userInfoService,
	}
}

// ========== 用户权限视图和批量操作 ==========

// 获取用户权限树
func (h *AdminHandler) GetUserPermissionTree(c *gin.Context) {
	upn := c.Param("upn")

	// 获取用户基本信息
	allGroups, _ := h.Service.Enforcer.GetRolesForUser(upn)

	// 分离抽象组和内部权限
	var abstractGroups []string
	var internalPermissions []string

	for _, group := range allGroups {
		// 检查是否为抽象组（通过查询数据库）
		var abstractGroup models.AbstractGroup
		if err := h.Service.DB.Where("name = ?", group).First(&abstractGroup).Error; err == nil {
			// 找到对应的抽象组，这是抽象组
			abstractGroups = append(abstractGroups, group)
		} else {
			// 没有找到对应的抽象组，这是内部权限
			internalPermissions = append(internalPermissions, group)
		}
	}

	// 获取主要组（通过ChatUserCategory的优先级判断）
	var primaryGroup string
	if len(abstractGroups) > 0 {
		// 获取对应的ChatUserCategory
		var categories []*models.ChatUserCategory
		if err := h.Service.DB.Preload("QuotaPool").Where("name IN ?", abstractGroups).Find(&categories).Error; err == nil {
			// 使用getPrimaryCategory函数获取主要组
			primaryCategory := h.getPrimaryCategory(categories)
			if primaryCategory != nil {
				primaryGroup = primaryCategory.Name
			}
		}
	}

	// 构建权限树
	tree := []gin.H{
		{
			"type":     "module",
			"name":     "AI模型",
			"id":       "models",
			"children": h.buildModelPermissions(upn),
		},
		{
			"type":     "module",
			"name":     "知识库",
			"id":       "knowledgebase",
			"children": h.buildKnowledgeBasePermissions(upn),
		},
		{
			"type":     "module",
			"name":     "API接口",
			"id":       "api",
			"children": h.buildAPIPermissions(upn),
		},
		{
			"type":     "module",
			"name":     "平台功能",
			"id":       "features",
			"children": h.buildFeaturePermissions(upn),
		},
	}

	c.JSON(200, gin.H{
		"upn":                 upn,
		"displayName":         upn, // TODO: 从用户数据库获取
		"email":               upn,
		"groups":              abstractGroups,      // 抽象组
		"primaryGroup":        primaryGroup,        // 主要组
		"roles":               []string{},          // 保持空数组以兼容前端
		"internalPermissions": internalPermissions, // 内部权限
		"lastSync":            time.Now(),
		"permissionTree":      tree,
		"totalPermissions":    h.Service.CountUserPermissions(upn),
	})
}

// 构建模型权限
func (h *AdminHandler) buildModelPermissions(upn string) []gin.H {
	models := []string{"gpt-4o", "gpt-4.1", "o1-mini", "o3-mini", "o3-mini-high", "o4-mini", "o4-mini-high", "o1", "o3", "deepseek-v3-ark", "deepseek-r1-671b-plus-ark", "qwen3-235b-a22b"}

	permissions := []gin.H{}
	for _, model := range models {
		allowed, _ := h.Service.Enforcer.Enforce(upn, "models", model, "access")

		item := gin.H{
			"type":      "resource",
			"name":      model,
			"id":        model,
			"canModify": true,
		}

		if allowed {
			item["permission"] = "access"
			item["denyReason"] = "拥有访问权限" // 简化权限来源显示
		} else {
			// 模型被拒绝
			item["permission"] = "none"
			item["isDenied"] = true
			item["denyReason"] = "无访问权限" // 简化权限来源显示
		}
		permissions = append(permissions, item)
	}

	return permissions
}

// 构建知识库权限
func (h *AdminHandler) buildKnowledgeBasePermissions(upn string) []gin.H {
	// 这里应该从实际的知识库系统获取
	kbs := []struct {
		ID   string
		Name string
	}{
		{ID: "kb-public", Name: "公共知识库"},
		{ID: "kb-course", Name: "课程知识库"},
		{ID: "kb-research", Name: "研究知识库"},
		{ID: "kb-internal", Name: "内部知识库"},
	}

	permissions := []gin.H{}
	for _, kb := range kbs {
		// 检查最高权限级别
		perm := "none"
		for _, action := range []string{"admin", "write", "read", "search"} {
			if allowed, _ := h.Service.Enforcer.Enforce(upn, "kb", kb.ID, action); allowed {
				perm = action
				break
			}
		}

		permissions = append(permissions, gin.H{
			"type":       "resource",
			"name":       kb.Name,
			"id":         kb.ID,
			"permission": perm,
			"canModify":  true,
		})
	}

	return permissions
}

// 构建API权限
func (h *AdminHandler) buildAPIPermissions(upn string) []gin.H {
	permissions := []gin.H{}

	// 获取用户的所有角色/组
	roles, _ := h.Service.Enforcer.GetRolesForUser(upn)

	// 过滤出以 "api:" 开头的角色，这些就是用户的 API key 权限
	for _, role := range roles {
		if strings.HasPrefix(role, "api:") {
			permissions = append(permissions, gin.H{
				"type":       "resource",
				"name":       role, // The role name is the API key
				"id":         role,
				"permission": "access", // The existence of the role implies access
				"canModify":  true,
			})
		}
	}

	return permissions
}

// 构建功能权限
func (h *AdminHandler) buildFeaturePermissions(upn string) []gin.H {
	services := []string{
		"aigc", "aippt",
	}

	permissions := []gin.H{}
	for _, service := range services {
		// 1. 先用 Enforce 检查最终结果
		allowed, _ := h.Service.Enforcer.Enforce(upn, "services", service, "access")

		item := gin.H{
			"type":      "services",
			"name":      service,
			"id":        service,
			"canModify": true,
		}

		if allowed {
			item["permission"] = "access"
			item["denyReason"] = "拥有访问权限" // 简化权限来源显示
		} else {
			item["permission"] = "none"
			item["isDenied"] = true
			item["denyReason"] = "无访问权限" // 简化权限来源显示
		}
		permissions = append(permissions, item)
	}

	return permissions
}

// 批量修改权限
func (h *AdminHandler) BatchModifyPermissions(c *gin.Context) {
	var req struct {
		UPNs       []string `json:"upns"`
		Operation  string   `json:"operation"`
		Resource   string   `json:"resource"`
		ResourceID string   `json:"resourceId"`
		Action     string   `json:"action"`
		Effect     string   `json:"effect"` // "allow" or "deny"
		GroupName  string   `json:"groupName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	effect := "allow"
	if req.Effect == "deny" {
		effect = "deny"
	}

	results := []gin.H{}
	successCount := 0

	for _, upn := range req.UPNs {
		success := false
		message := ""

		switch req.Operation {
		case "add":
			ok, _ := h.Service.Enforcer.AddPolicy(upn, req.Resource, req.ResourceID, req.Action, effect)
			success = ok
			if ok {
				message = "Permission added"
			} else {
				message = "Permission already exists"
			}

		case "remove":
			ok, _ := h.Service.Enforcer.RemovePolicy(upn, req.Resource, req.ResourceID, req.Action, effect)
			success = ok
			if ok {
				message = "Permission removed"
			} else {
				message = "Permission not found"
			}

		case "addToGroup":
			ok, _ := h.Service.Enforcer.AddRoleForUser(upn, req.GroupName)
			success = ok
			if ok {
				message = fmt.Sprintf("Added to group %s", req.GroupName)
			} else {
				message = "Failed to add to group"
			}

		case "removeFromGroup":
			ok, _ := h.Service.Enforcer.DeleteRoleForUser(upn, req.GroupName)
			success = ok
			if ok {
				message = fmt.Sprintf("Removed from group %s", req.GroupName)
			} else {
				message = "Failed to remove from group"
			}
		}

		if success {
			successCount++
		}

		results = append(results, gin.H{
			"upn":     upn,
			"success": success,
			"message": message,
		})
	}

	// 保存策略
	h.Service.Enforcer.SavePolicy()

	c.JSON(200, gin.H{
		"totalCount":   len(req.UPNs),
		"successCount": successCount,
		"results":      results,
	})
}

// ========== 用户管理 ==========

// UserDetailInfo 定义从userinfo数据表获取的用户详细信息结构
type UserDetailInfo struct {
	UPN         string `json:"upn"`
	DisplayName string `json:"displayName"`
	Name        string `json:"name"`
	Department  string `json:"department"`
}

// fetchUserDetailsFromUserInfo 从userinfo数据表批量获取用户详细信息
func (h *AdminHandler) fetchUserDetailsFromUserInfo(upns []string) (map[string]UserDetailInfo, error) {
	if len(upns) == 0 {
		return make(map[string]UserDetailInfo), nil
	}

	// 从数据库查询用户信息
	var userInfos []models.UserInfo
	if err := h.UserInfoService.DB.Where("upn IN ?", upns).Find(&userInfos).Error; err != nil {
		return nil, fmt.Errorf("从数据库获取用户信息失败: %w", err)
	}

	// 将查询结果转换为UserDetailInfo映射
	userDetailsMap := make(map[string]UserDetailInfo)
	for _, userInfo := range userInfos {
		userDetailsMap[userInfo.UPN] = UserDetailInfo{
			UPN:         userInfo.UPN,
			DisplayName: userInfo.DisplayName,
			Name:        userInfo.Name,
			Department:  userInfo.Department,
		}
	}

	return userDetailsMap, nil
}

// GetUsers 获取所有用户
func (h *AdminHandler) GetUsers(c *gin.Context) {
	query := c.Query("q")

	// 1. 从 Casbin 中并发获取所有唯一的用户 UPN
	userSet := make(map[string]struct{})
	var mu sync.Mutex
	var wg sync.WaitGroup

	allRoles, _ := h.Service.Enforcer.GetAllRoles()

	roleChan := make(chan string, len(allRoles))
	for _, role := range allRoles {
		roleChan <- role
	}
	close(roleChan)

	numWorkers := 10 // 根据CPU核心数调整
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for role := range roleChan {
				usersInRole, _ := h.Service.Enforcer.GetUsersForRole(role)
				mu.Lock()
				for _, user := range usersInRole {
					userSet[user] = struct{}{}
				}
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	// 从 'p' 规则中获取所有 subject (补充)
	allSubjects, _ := h.Service.Enforcer.GetAllSubjects()
	for _, subject := range allSubjects {
		userSet[subject] = struct{}{}
	}

	// 提取UPN列表
	var upnsToFetch []string
	for upn := range userSet {
		if strings.Contains(upn, "@") {
			upnsToFetch = append(upnsToFetch, upn)
		}
	}

	// 2. 从 userinfo 数据表批量获取用户详细信息
	userDetailsMap, err := h.fetchUserDetailsFromUserInfo(upnsToFetch)
	if err != nil {
		// 如果从userinfo数据表获取信息失败，记录错误但继续执行，以降级模式提供服务
		log.Printf("警告: 从userinfo数据表获取用户详情失败: %v", err)
		userDetailsMap = make(map[string]UserDetailInfo) // 使用空map继续
	}

	// 3. 过滤和构建最终结果
	users := []gin.H{}
	for subject := range userSet {
		if !strings.Contains(subject, "@") {
			continue
		}

		if query != "" && !strings.Contains(strings.ToLower(subject), strings.ToLower(query)) {
			continue
		}

		groups, _ := h.Service.Enforcer.GetRolesForUser(subject)
		// 组信息
		// 获取主要组
		var primaryGroup string
		if len(groups) > 0 {
			// 分离抽象组和内部权限
			var abstractGroups []string
			for _, group := range groups {
				// 检查是否为抽象组（通过查询数据库）
				var abstractGroup models.AbstractGroup
				if err := h.Service.DB.Where("name = ?", group).First(&abstractGroup).Error; err == nil {
					// 找到对应的抽象组，这是抽象组
					abstractGroups = append(abstractGroups, group)
				}
			}

			// 获取主要组（通过ChatUserCategory的优先级判断）
			if len(abstractGroups) > 0 {
				// 获取对应的ChatUserCategory
				var categories []*models.ChatUserCategory
				if err := h.Service.DB.Preload("QuotaPool").Where("name IN ?", abstractGroups).Find(&categories).Error; err == nil {
					// 使用getPrimaryCategory函数获取主要组
					primaryCategory := h.getPrimaryCategory(categories)
					if primaryCategory != nil {
						primaryGroup = primaryCategory.Name
					}
				}
			}
		}

		displayName := subject
		name := subject
		department := subject
		if detail, ok := userDetailsMap[subject]; ok {
			displayName = detail.DisplayName
			name = detail.Name
			department = detail.Department
		}

		users = append(users, gin.H{
			"upn":          subject,
			"displayName":  displayName,
			"name":         name,
			"department":   department,
			"groups":       groups,       // 只返回所有组
			"primaryGroup": primaryGroup, // 添加主要组
			"isActive":     true,
		})
	}

	c.JSON(200, users)
}

// ========== 用户组管理 ==========

// 添加用户到组
func (h *AdminHandler) AddUserToGroup(c *gin.Context) {
	var req struct {
		UPN   string `json:"upn"`
		Group string `json:"group"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// 添加用户到组
	ok, _ := h.Service.Enforcer.AddRoleForUser(req.UPN, req.Group)
	if !ok {
		c.JSON(400, gin.H{"error": "Failed to add user to group"})
		return
	}

	// 保存策略
	h.Service.Enforcer.SavePolicy()

	c.JSON(200, gin.H{
		"success": true,
		"message": fmt.Sprintf("User %s added to group %s", req.UPN, req.Group),
	})
}

// 从组移除用户
func (h *AdminHandler) RemoveUserFromGroup(c *gin.Context) {
	var req struct {
		UPN   string `json:"upn"`
		Group string `json:"group"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// 从组移除用户
	ok, _ := h.Service.Enforcer.DeleteRoleForUser(req.UPN, req.Group)
	if !ok {
		c.JSON(400, gin.H{"error": "Failed to remove user from group"})
		return
	}

	// 保存策略
	h.Service.Enforcer.SavePolicy()

	c.JSON(200, gin.H{
		"success": true,
		"message": fmt.Sprintf("User %s removed from group %s", req.UPN, req.Group),
	})
}

// ========== 统计数据 ==========

// GetStats 获取系统统计数据
func (h *AdminHandler) GetStats(c *gin.Context) {
	// 1. 从 'g' 规则中获取所有用户
	allRoles, _ := h.Service.Enforcer.GetAllRoles()
	userSet := make(map[string]struct{})
	for _, role := range allRoles {
		usersInRole, _ := h.Service.Enforcer.GetUsersForRole(role)
		for _, user := range usersInRole {
			userSet[user] = struct{}{}
		}
	}

	// 2. 从 'p' 规则中获取所有 subject
	allSubjects, _ := h.Service.Enforcer.GetAllSubjects()
	for _, subject := range allSubjects {
		userSet[subject] = struct{}{}
	}

	totalUsers := 0
	activeUsers := 0
	groupDistribution := make(map[string]int)

	for subject := range userSet {
		if strings.Contains(subject, "@") { // 只统计用户，不包括组和角色
			totalUsers++
			activeUsers++ // 简化处理，假设所有用户都是活跃的

			// 统计用户组分布
			roles, _ := h.Service.Enforcer.GetRolesForUser(subject)
			for _, role := range roles {
				if strings.HasPrefix(role, "group-") {
					groupDistribution[role]++
				}
			}
		}
	}

	// 统计权限策略数量
	allPolicies, _ := h.Service.Enforcer.GetPolicy()
	totalPermissions := len(allPolicies)

	// 统计抽象组数量
	var abstractGroupCount int64
	h.Service.DB.Model(&models.AbstractGroup{}).Count(&abstractGroupCount)

	// 生成模拟的活动趋势数据
	recentActivity := []gin.H{}
	for i := 6; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i)
		recentActivity = append(recentActivity, gin.H{
			"timestamp": date,
			"type":      "permission_change",
			"count":     5 + i*2, // 模拟数据
		})
	}

	stats := gin.H{
		"totalUsers":        totalUsers,
		"activeUsers":       activeUsers,
		"totalPermissions":  totalPermissions,
		"abstractGroups":    abstractGroupCount,
		"groupDistribution": groupDistribution,
		"recentActivity":    recentActivity,
	}

	c.JSON(200, stats)
}

// ========== 审计历史 ==========

// GetAuditHistory a été déplacé vers audit.go
// GenerateAuditReport a été déplacé vers audit.go

// ========== 规则导出 ==========

// ExportAllRules 导出所有规则
func (h *AdminHandler) ExportAllRules(c *gin.Context) {
	csvData, err := h.Service.ExportAllRulesAsCSV()
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to export rules", "details": err.Error()})
		return
	}

	fileName := fmt.Sprintf("uniauth_rules_export_%s.csv", time.Now().Format("20060102150405"))

	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Data(200, "text/csv; charset=utf-8", csvData)
}

// ========== 权限解释 ==========

// ExplainPermission 解释特定权限的来源
func (h *AdminHandler) ExplainPermission(c *gin.Context) {
	var req struct {
		UPN    string `json:"upn" binding:"required"`
		Domain string `json:"domain" binding:"required"`
		Object string `json:"object" binding:"required"`
		Action string `json:"action" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// 使用 EnforceEx 获取权限决策的详细解释
	allowed, explain, err := h.Service.Enforcer.EnforceEx(req.UPN, req.Domain, req.Object, req.Action)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to explain permission", "details": err.Error()})
		return
	}

	// 解析解释信息，构建更友好的响应
	var reason string
	matchedRules := make([]string, 0) // 初始化为空数组，而不是nil

	if allowed {
		if len(explain) >= 4 {
			sub := explain[0]
			dom := explain[1]
			obj := explain[2]
			act := explain[3]

			if sub == req.UPN {
				matchedRules = append(matchedRules, fmt.Sprintf("p, %s, %s, %s, %s, allow", sub, dom, obj, act))
				reason = "用户直接拥有此权限"
			} else {
				matchedRules = append(matchedRules, fmt.Sprintf("p, %s, %s, %s, %s, allow (继承自组: %s)", sub, dom, obj, act, sub))
				if reason == "" {
					reason = fmt.Sprintf("通过组 '%s' 继承此权限", sub)
				}
			}
		}
		if reason == "" {
			reason = "默认允许（未找到具体规则）"
		}
	} else {
		// 权限被拒绝
		reason = "无匹配的允许规则"

		// 尝试查找是否有明确的拒绝规则
		// 注意：标准的 EnforceEx 可能不会返回 deny 规则的详情
		// 这里我们可以选择性地查询一下
		allPolicies, _ := h.Service.Enforcer.GetPolicy()
		for _, p := range allPolicies {
			if len(p) >= 5 && p[4] == "deny" {
				if p[1] == req.Domain && (p[2] == req.Object || p[2] == "*") && p[3] == req.Action {
					// 检查是否匹配用户或其所属的组
					if p[0] == req.UPN {
						matchedRules = append(matchedRules, fmt.Sprintf("p, %s, %s, %s, %s, deny", p[0], p[1], p[2], p[3]))
						reason = "用户被明确拒绝此权限"
						break
					}
					// 检查用户的组
					if hasRole, _ := h.Service.Enforcer.HasRoleForUser(req.UPN, p[0]); hasRole {
						matchedRules = append(matchedRules, fmt.Sprintf("p, %s, %s, %s, %s, deny (继承自组: %s)", p[0], p[1], p[2], p[3], p[0]))
						reason = fmt.Sprintf("通过组 '%s' 被拒绝此权限", p[0])
						break
					}
				}
			}
		}
	}

	c.JSON(200, gin.H{
		"allowed":      allowed,
		"reason":       reason,
		"matchedRules": matchedRules,
		"explain":      explain, // 原始的解释数据，供调试使用
	})
}

// 获取用户的主要组
func (h *AdminHandler) getPrimaryCategory(categories []*models.ChatUserCategory) *models.ChatUserCategory {
	if len(categories) == 0 {
		return nil
	}
	// 先找最小优先级组
	minPriority := categories[0].Priority
	for _, category := range categories {
		if category.Priority < minPriority {
			minPriority = category.Priority
		}
	}
	// 如果有多个相同的最小优先级的组，则挑最大的defaultQuota
	var primaryCategory *models.ChatUserCategory
	var maxQuota decimal.Decimal = decimal.Zero
	for i := range categories {
		if categories[i].Priority == minPriority {
			if primaryCategory == nil || categories[i].DefaultQuota.GreaterThan(maxQuota) {
				primaryCategory = categories[i]
				maxQuota = categories[i].DefaultQuota
			}
		}
	}
	return primaryCategory
}

// GetUserCostRecords 获取用户消费记录
func (h *AdminHandler) GetUserCostRecords(c *gin.Context) {
	upn := c.Param("upn")

	// 分页参数
	page := 1
	pageSize := 20
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if pageSizeStr := c.Query("pageSize"); pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}

	// 查询用户消费记录
	var costRecords []models.ChatUserCostRecord
	var total int64

	// 获取总数
	h.Service.DB.Model(&models.ChatUserCostRecord{}).Where("upn = ?", upn).Count(&total)

	// 获取分页数据
	offset := (page - 1) * pageSize
	if err := h.Service.DB.Where("upn = ?", upn).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&costRecords).Error; err != nil {
		c.JSON(500, gin.H{"error": "获取消费记录失败", "details": err.Error()})
		return
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	c.JSON(200, gin.H{
		"upn":         upn,
		"costRecords": costRecords,
		"total":       total,
		"page":        page,
		"pageSize":    pageSize,
		"totalPages":  totalPages,
		"hasNext":     page < totalPages,
		"hasPrevious": page > 1,
	})
}
