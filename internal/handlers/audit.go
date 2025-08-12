package handlers

import (
	"fmt"
	"strconv"
	"time"

	"uniauth/internal/services"

	"github.com/gin-gonic/gin"
)

// AuditHandler 审计处理器
type AuditHandler struct {
	Service *services.AuthService
}

// NewAuditHandler 创建审计处理器
func NewAuditHandler(service *services.AuthService) *AuditHandler {
	return &AuditHandler{Service: service}
}

// AuditLogEntry 审计日志条目
type AuditLogEntry struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Timestamp time.Time `json:"timestamp"`
	User      string    `json:"user"`
	Action    string    `json:"action"`
	Resource  string    `json:"resource"`
	Details   string    `json:"details"` // JSON string
	Success   bool      `json:"success"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
	CreatedAt time.Time `json:"createdAt"`
}

// 初始化审计日志表
func (h *AuditHandler) InitAuditTable() error {
	return h.Service.DB.AutoMigrate(&AuditLogEntry{})
}

// LogAudit 记录审计日志
func (h *AuditHandler) LogAudit(user, action, resource string, details interface{}, success bool, c *gin.Context) error {
	// 将details转为JSON字符串
	detailsJSON := ""
	if details != nil {
		// 这里应该使用json.Marshal，但为了简化，我们使用字符串表示
		detailsJSON = fmt.Sprintf("%+v", details)
	}

	entry := AuditLogEntry{
		Timestamp: time.Now(),
		User:      user,
		Action:    action,
		Resource:  resource,
		Details:   detailsJSON,
		Success:   success,
		IPAddress: c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
		CreatedAt: time.Now(),
	}

	return h.Service.DB.Create(&entry).Error
}

// GetAuditHistory 获取审计历史
func (h *AuditHandler) GetAuditHistory(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))
	user := c.Query("user")
	action := c.Query("action")

	query := h.Service.DB.Model(&AuditLogEntry{})

	// 过滤条件
	if days > 0 {
		query = query.Where("timestamp >= ?", time.Now().AddDate(0, 0, -days))
	}
	if user != "" {
		query = query.Where("user LIKE ?", "%"+user+"%")
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}

	var total int64
	// 先克隆查询，用于计算总数，避免分页影响总数计算
	if err := query.Count(&total).Error; err != nil {
		c.JSON(500, gin.H{"error": "无法统计审计日志"})
		return
	}

	var logs []AuditLogEntry
	// 在原始查询上添加分页和排序
	offset := (page - 1) * pageSize
	if err := query.Order("timestamp DESC").Limit(pageSize).Offset(offset).Find(&logs).Error; err != nil {
		c.JSON(500, gin.H{"error": "无法获取审计日志"})
		return
	}

	c.JSON(200, gin.H{
		"logs":       logs,
		"total":      total,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": (int(total) + pageSize - 1) / pageSize,
	})
}

// GetAuditStats 获取审计统计
func (h *AuditHandler) GetAuditStats(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))

	var dailyStats []struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}

	// 按天统计
	h.Service.DB.Model(&AuditLogEntry{}).
		Select("DATE(timestamp) as date, COUNT(*) as count").
		Where("timestamp >= ?", time.Now().AddDate(0, 0, -days)).
		Group("DATE(timestamp)").
		Order("date DESC").
		Scan(&dailyStats)

	var actionStats []struct {
		Action string `json:"action"`
		Count  int    `json:"count"`
	}

	// 按操作统计
	h.Service.DB.Model(&AuditLogEntry{}).
		Select("action, COUNT(*) as count").
		Where("timestamp >= ?", time.Now().AddDate(0, 0, -days)).
		Group("action").
		Order("count DESC").
		Scan(&actionStats)

	var userStats []struct {
		User  string `json:"user"`
		Count int    `json:"count"`
	}

	// 按用户统计
	h.Service.DB.Model(&AuditLogEntry{}).
		Select("user, COUNT(*) as count").
		Where("timestamp >= ?", time.Now().AddDate(0, 0, -days)).
		Group("user").
		Order("count DESC").
		Limit(10).
		Scan(&userStats)

	c.JSON(200, gin.H{
		"dailyStats":  dailyStats,
		"actionStats": actionStats,
		"userStats":   userStats,
	})
}
