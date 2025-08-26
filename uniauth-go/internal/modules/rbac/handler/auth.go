package handler

import (
	"strings"

	"uniauth/internal/modules/rbac/model"
	"uniauth/internal/modules/rbac/service"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	Service *service.AuthService
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{
		Service: service,
	}
}

// ========== 基础权限检查 ==========

// 权限检查（支持API Key和智能权限继承）
func (h *AuthHandler) CheckPermission(c *gin.Context) {
	var req struct {
		// 资源定义： r = sub, resType, resName, act
		Subject    string `json:"subject"`    // UPN或api:key
		Resource   string `json:"resource"`   // models/kb/doc/api等
		ResourceID string `json:"resourceId"` // 具体资源ID
		Action     string `json:"action"`     // use/read/write等
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// 解析真实用户（如果是API Key）
	realUPN := h.Service.ResolveRealUPN(req.Subject)

	// 智能权限检查
	allowed, grantedLevel, grantedPermValue := h.Service.SmartPermissionCheck(realUPN, req.Resource, req.ResourceID, req.Action)

	response := gin.H{
		"allowed":  allowed,
		"subject":  req.Subject,
		"realUPN":  realUPN,
		"resource": req.ResourceID,
		"action":   req.Action,
		"isAPIKey": strings.HasPrefix(req.Subject, "api:"),
	}

	// 为文档权限检查添加额外信息
	if req.Resource == "doc" && strings.Contains(req.ResourceID, "/") {
		response["grantedLevel"] = grantedLevel
		response["grantedPermValue"] = grantedPermValue
		response["requiredLevel"] = req.Action
	}

	c.JSON(200, response)
}

// ========== 临时权限管理 ==========

// 临时禁用/启用权限
func (h *AuthHandler) TogglePermission(c *gin.Context) {
	var req struct {
		UPN        string `json:"upn"`
		Resource   string `json:"resource"`
		ResourceID string `json:"resourceId"`
		Action     string `json:"action"`
		Disable    bool   `json:"disable"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	if req.Disable {
		// 添加deny规则
		ok, _ := h.Service.Enforcer.AddPolicy(req.UPN, req.Resource, req.ResourceID, req.Action, "deny")
		if ok {
			h.Service.Enforcer.SavePolicy()
			c.JSON(200, gin.H{
				"success": true,
				"message": "Permission disabled",
				"rule":    []string{req.UPN, req.Resource, req.ResourceID, req.Action, "deny"},
			})
		} else {
			c.JSON(400, gin.H{"error": "Failed to add deny rule"})
		}
	} else {
		// 移除deny规则
		ok, _ := h.Service.Enforcer.RemovePolicy(req.UPN, req.Resource, req.ResourceID, req.Action, "deny")
		if ok {
			h.Service.Enforcer.SavePolicy()
			c.JSON(200, gin.H{
				"success": true,
				"message": "Permission enabled (deny rule removed)",
			})
		} else {
			c.JSON(400, gin.H{"error": "No deny rule found"})
		}
	}
}

// 获取用户组信息
func (h *AuthHandler) GetUserGroups(c *gin.Context) {
	upn := c.Param("upn")

	// 获取用户在Casbin中的所有角色
	allGroups, _ := h.Service.Enforcer.GetRolesForUser(upn)

	// 分离抽象组和内部权限
	var abstractGroups []string
	var internalPermissions []string

	for _, group := range allGroups {
		// 检查是否为抽象组（通过查询数据库）
		var abstractGroup model.AbstractGroup
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
		var categories []*model.ChatUserCategory
		if err := h.Service.DB.Preload("QuotaPool").Where("name IN ?", abstractGroups).Find(&categories).Error; err == nil {
			// 使用getPrimaryCategory函数获取主要组
			primaryCategory := h.getPrimaryCategory(categories)
			if primaryCategory != nil {
				primaryGroup = primaryCategory.Name
			}
		}
	}

	c.JSON(200, gin.H{
		"groups":              abstractGroups,      // 抽象组
		"primaryGroup":        primaryGroup,        // 主要组
		"internalPermissions": internalPermissions, // 内部权限
	})
}

// 获取用户的主要组
func (h *AuthHandler) getPrimaryCategory(categories []*model.ChatUserCategory) *model.ChatUserCategory {
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
	var primaryCategory *model.ChatUserCategory
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
