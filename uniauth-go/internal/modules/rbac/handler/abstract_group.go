package handler

import (
	"encoding/json"
	"net/http"
	"uniauth/internal/modules/rbac/model"
	"uniauth/internal/modules/rbac/service"

	"github.com/gin-gonic/gin"
)

// AbstractGroupHandler 抽象组管理处理器
type AbstractGroupHandler struct {
	Service *service.AbstractGroupService
}

// NewAbstractGroupHandler 创建抽象组管理处理器
func NewAbstractGroupHandler(service *service.AbstractGroupService) *AbstractGroupHandler {
	return &AbstractGroupHandler{
		Service: service,
	}
}

// CreateAbstractGroup 创建抽象组
func (h *AbstractGroupHandler) CreateAbstractGroup(c *gin.Context) {
	// 临时结构体，用于接收原始的 rule JSON
	var requestBody struct {
		Name        string          `json:"name"`
		Description string          `json:"description"`
		Type        string          `json:"type"`
		Rule        json.RawMessage `json:"rule"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求体", "details": err.Error()})
		return
	}

	// 基本验证
	if requestBody.Name == "" || (requestBody.Type != "ittools" && requestBody.Type != "manual") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "组名和有效的类型（'ittools' 或 'manual'）是必需的"})
		return
	}

	var newGroup model.AbstractGroup
	newGroup.Name = requestBody.Name
	newGroup.Description = requestBody.Description
	newGroup.Type = requestBody.Type

	// 根据类型处理 Rule 字段
	switch newGroup.Type {
	case "ittools":
		var ittoolsRule model.IttoolsRule
		if err := json.Unmarshal(requestBody.Rule, &ittoolsRule); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ittools 规则格式", "details": err.Error()})
			return
		}
		newGroup.Rule.Ittools = &ittoolsRule
	case "manual":
		// 前端发送的是 { manual: { upns: [...] } } 格式
		var ruleWrapper struct {
			Manual *model.ManualRule `json:"manual"`
		}
		if err := json.Unmarshal(requestBody.Rule, &ruleWrapper); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 manual 规则格式", "details": err.Error()})
			return
		}
		newGroup.Rule.Manual = ruleWrapper.Manual
	}

	// TODO: 从认证中间件获取创建者UPN
	// 暂时硬编码一个用户，后续需要替换为真实的用户信息
	creatorUPN := "admin@example.com"
	newGroup.CreatorUPN = creatorUPN

	if err := h.Service.CreateAbstractGroup(&newGroup, creatorUPN); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "抽象组创建失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, newGroup)
}

// GetAbstractGroup 获取单个抽象组
func (h *AbstractGroupHandler) GetAbstractGroup(c *gin.Context) {
	groupID := c.Param("id")
	group, err := h.Service.GetAbstractGroupByID(groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve abstract group", "details": err.Error()})
	} else {
		c.JSON(http.StatusOK, group)
	}
}

// GetAllAbstractGroups 获取所有抽象组
func (h *AbstractGroupHandler) GetAllAbstractGroups(c *gin.Context) {
	groups, err := h.Service.GetAllAbstractGroups()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取抽象组失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// UpdateAbstractGroup 更新抽象组
func (h *AbstractGroupHandler) UpdateAbstractGroup(c *gin.Context) {
	groupID := c.Param("id")

	var requestBody struct {
		Name        string          `json:"name"`
		Description string          `json:"description"`
		Type        string          `json:"type"`
		Rule        json.RawMessage `json:"rule"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求体", "details": err.Error()})
		return
	}

	var updatedInfo model.AbstractGroup
	updatedInfo.Name = requestBody.Name
	updatedInfo.Description = requestBody.Description
	updatedInfo.Type = requestBody.Type

	// 根据类型处理 Rule 字段
	switch updatedInfo.Type {
	case "ittools":
		var ittoolsRule model.IttoolsRule
		if err := json.Unmarshal(requestBody.Rule, &ittoolsRule); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ittools 规则格式", "details": err.Error()})
			return
		}
		updatedInfo.Rule.Ittools = &ittoolsRule
	case "manual":
		// 前端发送的是 { manual: { upns: [...] } } 格式
		var ruleWrapper struct {
			Manual *model.ManualRule `json:"manual"`
		}
		if err := json.Unmarshal(requestBody.Rule, &ruleWrapper); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 manual 规则格式", "details": err.Error()})
			return
		}
		updatedInfo.Rule.Manual = ruleWrapper.Manual
	}

	group, err := h.Service.UpdateAbstractGroup(groupID, &updatedInfo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新抽象组失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, group)
}

// DeleteAbstractGroup 删除抽象组
func (h *AbstractGroupHandler) DeleteAbstractGroup(c *gin.Context) {
	groupID := c.Param("id")

	err := h.Service.DeleteAbstractGroup(groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除抽象组失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "抽象组和所有关联数据删除成功"})
}

// SyncAbstractGroup 同步单个抽象组
func (h *AbstractGroupHandler) SyncAbstractGroup(c *gin.Context) {
	groupID := c.Param("id")

	// TODO: 权限检查，只有拥有 "edit" 权限的用户才能触发同步

	count, err := h.Service.SyncAbstractGroup(groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "抽象组同步失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "抽象组同步成功",
		"synced_users": count,
	})
}
