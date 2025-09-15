package model

import "time"

// User 用户信息模型
type User struct {
	UPN         string    `json:"upn"`         // 用户主体名称
	Name        string    `json:"name"`        // 用户姓名
	Email       string    `json:"email"`       // 邮箱
	Department  string    `json:"department"`  // 部门
	Role        string    `json:"role"`        // 角色
	LoginTime   time.Time `json:"login_time"`  // 登录时间
	LastAccess  time.Time `json:"last_access"` // 最后访问时间
	Permissions []string  `json:"permissions"` // 权限列表
}

// SessionData session数据结构
type SessionData struct {
	SessionID  string    `json:"session_id"`
	User       *User     `json:"user"`
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	LastAccess time.Time `json:"last_access"`
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent"`
}

// SSOCallback SSO回调数据
type SSOCallback struct {
	Code  string `json:"code"`
	State string `json:"state"`
	Error string `json:"error,omitempty"`
}

// SSOTokenResponse SSO令牌响应
type SSOTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	IDToken      string `json:"id_token,omitempty"`
}
