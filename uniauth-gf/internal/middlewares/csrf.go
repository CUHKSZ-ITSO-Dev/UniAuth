package middlewares

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"slices"
	"time"

	"github.com/gogf/gf/v2/net/ghttp"
)

const (
	csrfTokenCookieName = "uniauth-csrf-token"
	csrfTokenHeaderName = "X-Csrf-Token"
	csrfTokenLength     = 32
)

// CSRF豁免路径列表
// 这些路径不需要CSRF验证
var csrfExemptPaths = []string{
	"/auth/callback", // OAuth回调，由第三方SSO重定向，无法携带CSRF token
	"/auth/verify",   // Nginx Ingress外部鉴权调用，不是浏览器请求
}

// CSRFMiddleware CSRF保护中间件
// 用于防止跨站请求伪造攻击
func CSRFMiddleware(r *ghttp.Request) {
	// 检查是否在豁免路径列表中
	if slices.Contains(csrfExemptPaths, r.URL.Path) {
		r.Middleware.Next()
		return
	}

	// 只对修改数据的请求验证CSRF
	if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
		r.Middleware.Next()
		return
	}

	// 从cookie中获取CSRF token
	cookieToken := r.Cookie.Get(csrfTokenCookieName).String()

	// 如果cookie中没有token，生成一个新的
	if cookieToken == "" {
		b := make([]byte, csrfTokenLength)
		if _, err := rand.Read(b); err != nil {
			panic(err)
		}
		cookieToken = base64.URLEncoding.EncodeToString(b)
		r.Cookie.SetCookie(
			csrfTokenCookieName,
			cookieToken,
			"",
			"/",
			24*time.Hour,
			ghttp.CookieOptions{
				HttpOnly: false, // JavaScript需要读取来设置到请求头
				Secure:   true,
				SameSite: http.SameSiteStrictMode,
			},
		)
	}

	// 从请求头中获取CSRF token
	headerToken := r.Header.Get(csrfTokenHeaderName)

	// 验证token是否匹配
	if headerToken == "" || headerToken != cookieToken {
		r.Response.WriteStatus(http.StatusForbidden)
		r.Response.WriteJson(ghttp.DefaultHandlerResponse{
			Code:    http.StatusForbidden,
			Message: "CSRF token验证失败",
		})
		return
	}

	r.Middleware.Next()
}
