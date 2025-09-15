package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"uniauth-gin/internal/config"
	"uniauth-gin/internal/model"
	"uniauth-gin/internal/service"
	"uniauth-gin/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-resty/resty/v2"
)

type AuthHandler struct {
	sessionService *service.SessionService
	uniAuthService *service.UniAuthService
	httpClient     *resty.Client
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		sessionService: service.NewSessionService(),
		uniAuthService: service.NewUniAuthService(),
		httpClient:     resty.New(),
	}
}

// HandleLogin 处理登录请求
func (ah *AuthHandler) HandleLogin(c *gin.Context) {
	// 生成SSO登录URL
	state := utils.GenerateRandomState()
	redirectURI := utils.GetCallbackURL(c.Request)

	// 将state临时存储（实际应该存储到Redis中）
	// 这里简化实现
	c.SetCookie("sso_state", state, 300, "/", "", false, true) // 5分钟过期

	loginURL := ah.buildSSOLoginURL(redirectURI, state)

	// 重定向到SSO登录页面
	c.Redirect(http.StatusFound, loginURL)
}

// HandleCallback 处理SSO回调
func (ah *AuthHandler) HandleCallback(c *gin.Context) {
	var callbackData model.SSOCallback

	// 获取回调参数
	callbackData.Code = c.Query("code")
	callbackData.State = c.Query("state")
	callbackData.Error = c.Query("error")

	// 处理错误情况
	if callbackData.Error != "" {
		ah.handleCallbackError(c, callbackData.Error)
		return
	}

	// 验证state参数
	storedState, err := c.Cookie("sso_state")
	if err != nil || storedState != callbackData.State {
		ah.handleCallbackError(c, "无效的state参数")
		return
	}

	// 清除state cookie
	c.SetCookie("sso_state", "", -1, "/", "", false, true)

	// 使用code获取访问令牌
	tokenResponse, err := ah.exchangeCodeForToken(callbackData.Code, utils.GetCallbackURL(c.Request))
	if err != nil {
		log.Printf("获取访问令牌失败: %v", err)
		ah.handleCallbackError(c, "获取访问令牌失败")
		return
	}

	// 使用访问令牌获取用户信息
	user, err := ah.getUserFromToken(tokenResponse.AccessToken)
	if err != nil {
		log.Printf("获取用户信息失败: %v", err)
		ah.handleCallbackError(c, "获取用户信息失败")
		return
	}

	// 从UniAuth获取用户详细信息
	userInfo, err := ah.uniAuthService.GetUserInfo(c.Request.Context(), user.UPN)
	if err != nil {
		log.Printf("从UniAuth获取用户信息失败: %v", err)
		// 使用从SSO获取的基本信息
		userInfo = user
	} else {
		// 合并信息
		userInfo.LoginTime = time.Now()
		userInfo.LastAccess = time.Now()
	}

	// 创建session
	clientIP := utils.GetClientIP(c.Request)
	userAgent := c.Request.UserAgent()
	sessionID, err := ah.sessionService.CreateSession(c.Request.Context(), userInfo, clientIP, userAgent)
	if err != nil {
		log.Printf("创建session失败: %v", err)
		ah.handleCallbackError(c, "创建会话失败")
		return
	}

	// 设置session cookie
	c.SetCookie(
		config.AppConfig.Session.CookieName,
		sessionID,
		config.AppConfig.Session.CookieMaxAge,
		"/",
		config.AppConfig.Session.CookieDomain,
		config.AppConfig.Session.CookieSecure,
		true, // HttpOnly
	)

	// 获取重定向URL
	redirectURL := c.Query("redirect")
	redirectURL = utils.SanitizeRedirectURL(redirectURL, c.Request.Host)

	log.Printf("用户 %s 登录成功", userInfo.UPN)

	// 重定向到目标页面或首页
	c.Redirect(http.StatusFound, redirectURL)
}

// HandleLogout 处理登出
func (ah *AuthHandler) HandleLogout(c *gin.Context) {
	// 获取session ID
	sessionID, err := c.Cookie(config.AppConfig.Session.CookieName)
	if err == nil && sessionID != "" {
		// 删除session
		if err := ah.sessionService.DeleteSession(c.Request.Context(), sessionID); err != nil {
			log.Printf("删除session失败: %v", err)
		}
	}

	// 清除session cookie
	c.SetCookie(
		config.AppConfig.Session.CookieName,
		"",
		-1,
		"/",
		config.AppConfig.Session.CookieDomain,
		config.AppConfig.Session.CookieSecure,
		true,
	)

	// 重定向到登录页面或首页
	redirectURL := c.Query("redirect")
	redirectURL = utils.SanitizeRedirectURL(redirectURL, c.Request.Host)
	if redirectURL == "/" {
		redirectURL = "/auth/login"
	}

	c.Redirect(http.StatusFound, redirectURL)
}

// HandleStatus 检查登录状态
func (ah *AuthHandler) HandleStatus(c *gin.Context) {
	// 获取session
	sessionID, err := c.Cookie(config.AppConfig.Session.CookieName)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"authenticated": false})
		return
	}

	sessionData, err := ah.sessionService.GetSession(c.Request.Context(), sessionID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"authenticated": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"authenticated": true,
		"user":          sessionData.User,
		"expires_at":    sessionData.ExpiresAt,
	})
}

// buildSSOLoginURL 构建SSO登录URL
func (ah *AuthHandler) buildSSOLoginURL(redirectURI, state string) string {
	loginURL := config.AppConfig.SSO.LoginURL
	loginURL += "?client_id=" + config.AppConfig.SSO.ClientID
	loginURL += "&response_type=code"
	loginURL += "&redirect_uri=" + redirectURI
	loginURL += "&state=" + state
	loginURL += "&scope=openid profile email"
	return loginURL
}

// exchangeCodeForToken 使用授权码换取访问令牌
func (ah *AuthHandler) exchangeCodeForToken(code, redirectURI string) (*model.SSOTokenResponse, error) {
	tokenURL := "https://login.microsoftonline.com/common/oauth2/v2.0/token" // 这应该从配置中获取

	resp, err := ah.httpClient.R().
		SetHeader("Content-Type", "application/x-www-form-urlencoded").
		SetFormData(map[string]string{
			"client_id":     config.AppConfig.SSO.ClientID,
			"client_secret": config.AppConfig.SSO.ClientSecret,
			"code":          code,
			"grant_type":    "authorization_code",
			"redirect_uri":  redirectURI,
		}).
		Post(tokenURL)

	if err != nil {
		return nil, fmt.Errorf("请求令牌失败: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("获取令牌失败，状态码: %d, 响应: %s", resp.StatusCode(), string(resp.Body()))
	}

	var tokenResponse model.SSOTokenResponse
	err = json.Unmarshal(resp.Body(), &tokenResponse)
	if err != nil {
		return nil, fmt.Errorf("解析令牌响应失败: %w", err)
	}

	return &tokenResponse, nil
}

// getUserFromToken 使用访问令牌获取用户信息
func (ah *AuthHandler) getUserFromToken(accessToken string) (*model.User, error) {
	userInfoURL := "https://graph.microsoft.com/v1.0/me" // Microsoft Graph API

	resp, err := ah.httpClient.R().
		SetHeader("Authorization", "Bearer "+accessToken).
		Get(userInfoURL)

	if err != nil {
		return nil, fmt.Errorf("请求用户信息失败: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("获取用户信息失败，状态码: %d", resp.StatusCode())
	}

	var msUser struct {
		ID                string `json:"id"`
		UserPrincipalName string `json:"userPrincipalName"`
		DisplayName       string `json:"displayName"`
		Mail              string `json:"mail"`
		Department        string `json:"department"`
		JobTitle          string `json:"jobTitle"`
	}

	err = json.Unmarshal(resp.Body(), &msUser)
	if err != nil {
		return nil, fmt.Errorf("解析用户信息失败: %w", err)
	}

	// 转换为内部用户模型
	user := &model.User{
		UPN:        msUser.UserPrincipalName,
		Name:       msUser.DisplayName,
		Email:      msUser.Mail,
		Department: msUser.Department,
		Role:       msUser.JobTitle,
		LoginTime:  time.Now(),
		LastAccess: time.Now(),
	}

	return user, nil
}

// handleCallbackError 处理回调错误
func (ah *AuthHandler) handleCallbackError(c *gin.Context, errorMsg string) {
	// 如果是Ajax请求，返回JSON
	if utils.IsAjaxRequest(c.Request) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   errorMsg,
		})
		return
	}

	// 否则显示错误页面
	c.HTML(http.StatusBadRequest, "error.html", gin.H{
		"Title":        "登录失败",
		"ErrorMessage": errorMsg,
		"RetryURL":     "/auth/login",
		"BackURL":      "/",
	})
}
