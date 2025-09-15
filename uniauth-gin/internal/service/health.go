package service

import (
	"context"
	"fmt"
	"time"

	"uniauth-gin/internal/config"

	"github.com/redis/go-redis/v9"
)

// HealthService 健康检查服务
type HealthService struct {
	rdb            *redis.Client
	uniAuthService *UniAuthService
}

func NewHealthService() *HealthService {
	rdb := redis.NewClient(&redis.Options{
		Addr:     config.AppConfig.Redis.Addr,
		Password: config.AppConfig.Redis.Password,
		DB:       config.AppConfig.Redis.DB,
	})

	return &HealthService{
		rdb:            rdb,
		uniAuthService: NewUniAuthService(),
	}
}

// HealthStatus 健康状态
type HealthStatus struct {
	Status      string                 `json:"status"`
	Timestamp   time.Time              `json:"timestamp"`
	Version     string                 `json:"version"`
	Services    map[string]ServiceInfo `json:"services"`
	Uptime      time.Duration          `json:"uptime"`
	RequestInfo RequestInfo            `json:"request_info"`
}

// ServiceInfo 服务信息
type ServiceInfo struct {
	Status       string        `json:"status"`
	ResponseTime time.Duration `json:"response_time,omitempty"`
	Error        string        `json:"error,omitempty"`
	Details      interface{}   `json:"details,omitempty"`
}

// RequestInfo 请求信息
type RequestInfo struct {
	TotalRequests      int64   `json:"total_requests"`
	SuccessfulRequests int64   `json:"successful_requests"`
	FailedRequests     int64   `json:"failed_requests"`
	SuccessRate        float64 `json:"success_rate"`
}

var (
	startTime          = time.Now()
	totalRequests      int64
	successfulRequests int64
	failedRequests     int64
)

// CheckHealth 执行健康检查
func (h *HealthService) CheckHealth(ctx context.Context) *HealthStatus {
	status := &HealthStatus{
		Status:    "healthy",
		Timestamp: time.Now(),
		Version:   "1.0.0", // 这应该从构建时注入
		Services:  make(map[string]ServiceInfo),
		Uptime:    time.Since(startTime),
	}

	// 检查Redis连接
	redisInfo := h.checkRedis(ctx)
	status.Services["redis"] = redisInfo
	if redisInfo.Status == "unhealthy" {
		status.Status = "degraded"
	}

	// 检查UniAuth服务
	uniAuthInfo := h.checkUniAuth(ctx)
	status.Services["uniauth"] = uniAuthInfo
	if uniAuthInfo.Status == "unhealthy" {
		status.Status = "degraded"
	}

	// 添加请求统计信息
	status.RequestInfo = RequestInfo{
		TotalRequests:      totalRequests,
		SuccessfulRequests: successfulRequests,
		FailedRequests:     failedRequests,
		SuccessRate:        calculateSuccessRate(),
	}

	return status
}

// checkRedis 检查Redis连接状态
func (h *HealthService) checkRedis(ctx context.Context) ServiceInfo {
	start := time.Now()

	timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	err := h.rdb.Ping(timeoutCtx).Err()
	responseTime := time.Since(start)

	if err != nil {
		return ServiceInfo{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        err.Error(),
		}
	}

	// 获取Redis信息
	info, err := h.rdb.Info(timeoutCtx, "server").Result()
	var details interface{}
	if err == nil {
		details = map[string]string{
			"info": info[:min(200, len(info))], // 限制信息长度
		}
	}

	return ServiceInfo{
		Status:       "healthy",
		ResponseTime: responseTime,
		Details:      details,
	}
}

// checkUniAuth 检查UniAuth服务状态
func (h *HealthService) checkUniAuth(ctx context.Context) ServiceInfo {
	start := time.Now()

	// 尝试访问UniAuth的健康检查端点
	resp, err := h.uniAuthService.client.R().
		SetContext(ctx).
		Get("/health")

	responseTime := time.Since(start)

	if err != nil {
		return ServiceInfo{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        err.Error(),
		}
	}

	if resp.StatusCode() != 200 {
		return ServiceInfo{
			Status:       "unhealthy",
			ResponseTime: responseTime,
			Error:        fmt.Sprintf("HTTP %d", resp.StatusCode()),
		}
	}

	return ServiceInfo{
		Status:       "healthy",
		ResponseTime: responseTime,
		Details: map[string]interface{}{
			"status_code":   resp.StatusCode(),
			"response_size": len(resp.Body()),
		},
	}
}

// RecordRequest 记录请求统计
func RecordRequest(success bool) {
	totalRequests++
	if success {
		successfulRequests++
	} else {
		failedRequests++
	}
}

// calculateSuccessRate 计算成功率
func calculateSuccessRate() float64 {
	if totalRequests == 0 {
		return 0.0
	}
	return float64(successfulRequests) / float64(totalRequests) * 100
}

// min 获取最小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
