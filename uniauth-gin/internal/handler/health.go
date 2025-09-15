package handler

import (
	"net/http"

	"uniauth-gin/internal/service"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	healthService *service.HealthService
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{
		healthService: service.NewHealthService(),
	}
}

// HandleHealth 处理健康检查请求
func (hh *HealthHandler) HandleHealth(c *gin.Context) {
	healthStatus := hh.healthService.CheckHealth(c.Request.Context())

	// 根据服务状态设置HTTP状态码
	statusCode := http.StatusOK
	if healthStatus.Status == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	} else if healthStatus.Status == "degraded" {
		statusCode = http.StatusPartialContent
	}

	c.JSON(statusCode, healthStatus)
}

// HandleReadiness 处理就绪检查（Kubernetes readiness probe）
func (hh *HealthHandler) HandleReadiness(c *gin.Context) {
	healthStatus := hh.healthService.CheckHealth(c.Request.Context())

	if healthStatus.Status == "healthy" || healthStatus.Status == "degraded" {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ready",
			"timestamp": healthStatus.Timestamp,
		})
	} else {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "not ready",
			"timestamp": healthStatus.Timestamp,
		})
	}
}

// HandleLiveness 处理存活检查（Kubernetes liveness probe）
func (hh *HealthHandler) HandleLiveness(c *gin.Context) {
	// 简单的存活检查，只要服务在运行就返回OK
	c.JSON(http.StatusOK, gin.H{
		"status":  "alive",
		"service": "uniauth-gateway",
	})
}
