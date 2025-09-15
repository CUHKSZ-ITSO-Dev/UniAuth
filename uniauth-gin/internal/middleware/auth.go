package middleware

import (
	"log"
	"net/http"
	"strings"
	"time"

	"uniauth-gin/internal/config"
	"uniauth-gin/internal/model"
	"uniauth-gin/internal/service"
	"uniauth-gin/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	sessionService *service.SessionService
	uniAuthService *service.UniAuthService
}

func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{
		sessionService: service.NewSessionService(),
		uniAuthService: service.NewUniAuthService(),
	}
}

// RequireAuth 身份验证中间件
func (am *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取session cookie
		sessionID, err := c.Cookie(config.AppConfig.Session.CookieName)
		if err != nil {
			// 没有cookie，显示登录页面
			am.showLoginPage(c)
			return
		}

		// 验证session
		sessionData, err := am.sessionService.GetSession(c.Request.Context(), sessionID)
		if err != nil {
			log.Printf("Session验证失败: %v", err)
			// Session无效，清除cookie并显示登录页面
			am.clearSessionCookie(c)
			am.showLoginPage(c)
			return
		}

		// Session有效，刷新过期时间
		if err := am.sessionService.RefreshSession(c.Request.Context(), sessionID); err != nil {
			log.Printf("刷新session失败: %v", err)
		}

		// 将用户信息注入到请求头中
		am.injectUserHeaders(c, sessionData)

		// 继续处理请求
		c.Next()
	}
}

// ConditionalAuth 可选的身份验证中间件（用于部分需要认证的路径）
func (am *AuthMiddleware) ConditionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查是否需要认证
		if !am.shouldRequireAuth(c) {
			c.Next()
			return
		}

		// 执行认证逻辑
		am.RequireAuth()(c)
	}
}

// showLoginPage 显示登录页面
func (am *AuthMiddleware) showLoginPage(c *gin.Context) {
	// 生成SSO登录URL
	loginURL := am.generateSSOLoginURL(c)

	// 渲染登录模板
	c.HTML(http.StatusOK, "login.html", gin.H{
		"Title":    "UniAuth Gateway - 请登录",
		"LoginURL": loginURL,
		"Message":  "请点击下方按钮进行SSO登录",
	})
}

// generateSSOLoginURL 生成SSO登录URL
func (am *AuthMiddleware) generateSSOLoginURL(c *gin.Context) string {
	state := utils.GenerateRandomState()

	// 将state存储到临时存储中（用于验证回调）
	// 这里简化实现，实际应该存储到Redis或其他持久化存储中

	redirectURI := utils.GetCallbackURL(c.Request)

	loginURL := config.AppConfig.SSO.LoginURL
	loginURL += "?client_id=" + config.AppConfig.SSO.ClientID
	loginURL += "&response_type=code"
	loginURL += "&redirect_uri=" + redirectURI
	loginURL += "&state=" + state
	loginURL += "&scope=openid profile email"

	return loginURL
}

// clearSessionCookie 清除session cookie
func (am *AuthMiddleware) clearSessionCookie(c *gin.Context) {
	c.SetCookie(
		config.AppConfig.Session.CookieName,
		"",
		-1, // 设置为过期
		"/",
		config.AppConfig.Session.CookieDomain,
		config.AppConfig.Session.CookieSecure,
		true, // HttpOnly
	)
}

// injectUserHeaders 将用户信息注入到请求头中
func (am *AuthMiddleware) injectUserHeaders(c *gin.Context, sessionData *model.SessionData) {
	if sessionData.User == nil {
		return
	}

	user := sessionData.User

	// 注入标准的用户信息头
	c.Request.Header.Set("X-User-UPN", user.UPN)
	c.Request.Header.Set("X-User-Name", user.Name)
	c.Request.Header.Set("X-User-Email", user.Email)
	c.Request.Header.Set("X-User-Department", user.Department)
	c.Request.Header.Set("X-User-Role", user.Role)
	c.Request.Header.Set("X-User-Login-Time", user.LoginTime.Format(time.RFC3339))

	// 将用户信息存储到gin.Context中，供后续处理使用
	c.Set("user", user)
	c.Set("session", sessionData)

	log.Printf("用户 %s 的请求已注入用户信息", user.UPN)
}

// shouldRequireAuth 判断是否需要认证
func (am *AuthMiddleware) shouldRequireAuth(c *gin.Context) bool {
	path := c.Request.URL.Path

	// 排除不需要认证的路径
	excludePaths := []string{
		"/auth/login",
		"/auth/callback",
		"/health",
		"/metrics",
	}

	for _, excludePath := range excludePaths {
		if strings.HasPrefix(path, excludePath) {
			return false
		}
	}

	// 检查是否有特定的注解或配置要求认证
	// 这里可以根据k8s ingress注解或其他配置来决定
	return true
}
