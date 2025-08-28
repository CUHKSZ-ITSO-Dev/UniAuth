package handler

import (
	"net/http"
	"uniauth/internal/modules/billing/service"

	"uniauth/internal/modules/billing/model"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// ChatHandler 封装了与聊天计费相关的HTTP处理器
type ChatHandler struct {
	ChatService *service.ChatService
}

// NewChatHandler 创建一个新的 ChatHandler 实例
func NewChatHandler(chatService *service.ChatService) *ChatHandler {
	return &ChatHandler{ChatService: chatService}
}

// ========== Bill ==========
// BillRequest 定义计费请求的JSON结构
type BillRequest struct {
	UPN    string `json:"upn" binding:"required"`
	Cost   string `json:"cost" binding:"required"`
	Model  string `json:"model" binding:"required"`
	Tokens int64  `json:"tokens" binding:"required"`
}

// Bill 处理计费请求
func (h *ChatHandler) Bill(c *gin.Context) {
	var req BillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "无效的请求参数", "details": err.Error()})
		return
	}

	decimalCost, err := decimal.NewFromString(req.Cost)
	if err != nil {
		c.JSON(400, gin.H{"error": "无效的费用", "details": err.Error()})
		return
	}

	if err := h.ChatService.Bill(req.UPN, decimalCost, req.Model, req.Tokens); err != nil {
		c.JSON(500, gin.H{"error": "处理计费失败", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "计费成功"})
}

// ========== ResetBalance ==========
// ResetBalanceRequest 定义了重置余额请求的JSON结构
type ResetBalanceRequest struct {
	UPN         string `json:"upn" binding:"required"`
	ResetAnyway bool   `json:"reset_anyway"`
}

// ResetBalance 处理重置余额的请求
func (h *ChatHandler) ResetBalance(c *gin.Context) {
	var req ResetBalanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "无效的请求参数", "details": err.Error()})
		return
	}

	if err := h.ChatService.ResetBalance(req.UPN, req.ResetAnyway); err != nil {
		c.JSON(500, gin.H{"error": "重置余额失败", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "余额重置成功"})
}

// ========== EnsureChatAccountExists ==========
type EnsureChatAccountExistsRequest struct {
	UPN string `json:"upn" binding:"required"`
}

// EnsureChatAccountExists 处理确保聊天账户存在的请求
func (h *ChatHandler) EnsureChatAccountExists(c *gin.Context) {
	var body struct {
		UPN string `json:"upn"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求体"})
		return
	}
	if err := h.ChatService.EnsureChatAccountExists(body.UPN); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建或重置对话账户失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "账户已存在或创建成功"})
}

// UpdateChatCategory 更新用户组（对话类别）信息
func (h *ChatHandler) UpdateChatCategory(c *gin.Context) {
	id := c.Param("id")
	var category model.ChatUserCategory

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求体: " + err.Error()})
		return
	}

	updatedCategory, err := h.ChatService.UpdateChatCategory(id, &category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户组失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedCategory)
}
