package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"uniauth-gin/internal/config"
)

// GenerateRandomState 生成随机state用于OAuth
func GenerateRandomState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// GetCallbackURL 获取回调URL
func GetCallbackURL(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}

	host := r.Host
	if host == "" {
		host = r.Header.Get("X-Forwarded-Host")
	}
	if host == "" {
		host = "localhost:8080"
	}

	callbackPath := config.AppConfig.SSO.CallbackURL
	return fmt.Sprintf("%s://%s%s", scheme, host, callbackPath)
}

// ValidateState 验证OAuth state参数
func ValidateState(state string) bool {
	// 这里应该从存储中验证state
	// 简化实现，实际应该存储在Redis中并验证
	return len(state) > 0
}

// ExtractBearerToken 从Authorization头中提取Bearer token
func ExtractBearerToken(authHeader string) string {
	const bearerPrefix = "Bearer "
	if strings.HasPrefix(authHeader, bearerPrefix) {
		return strings.TrimPrefix(authHeader, bearerPrefix)
	}
	return ""
}

// IsAjaxRequest 判断是否是Ajax请求
func IsAjaxRequest(r *http.Request) bool {
	return r.Header.Get("X-Requested-With") == "XMLHttpRequest" ||
		strings.Contains(r.Header.Get("Accept"), "application/json")
}

// SanitizeRedirectURL 清理重定向URL，防止开放重定向攻击
func SanitizeRedirectURL(redirectURL, baseURL string) string {
	if redirectURL == "" {
		return "/"
	}

	// 解析URL
	u, err := url.Parse(redirectURL)
	if err != nil {
		return "/"
	}

	// 如果是相对路径，直接返回
	if !u.IsAbs() {
		return redirectURL
	}

	// 如果是绝对路径，检查是否是同域
	baseU, err := url.Parse(baseURL)
	if err != nil {
		return "/"
	}

	if u.Host == baseU.Host {
		return redirectURL
	}

	// 不同域，返回根路径
	return "/"
}

// GetClientIP 获取客户端真实IP
func GetClientIP(r *http.Request) string {
	// 尝试从X-Forwarded-For获取
	xForwardedFor := r.Header.Get("X-Forwarded-For")
	if xForwardedFor != "" {
		// X-Forwarded-For可能包含多个IP，取第一个
		ips := strings.Split(xForwardedFor, ",")
		return strings.TrimSpace(ips[0])
	}

	// 尝试从X-Real-IP获取
	xRealIP := r.Header.Get("X-Real-IP")
	if xRealIP != "" {
		return xRealIP
	}

	// 最后使用RemoteAddr
	return strings.Split(r.RemoteAddr, ":")[0]
}
