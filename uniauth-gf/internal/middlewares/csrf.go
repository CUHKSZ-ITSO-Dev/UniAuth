package middlewares

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"slices"
	"time"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

var (
	csrfTokenCookieName = g.Cfg().MustGet(context.TODO(), "uniauth.csrf_token_cookie_name").String()
	csrfTokenHeaderName = g.Cfg().MustGet(context.TODO(), "uniauth.csrf_token_header_name").String()
	csrfTokenLength     = g.Cfg().MustGet(context.TODO(), "uniauth.csrf_token_length").Int()
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

	// 调试信息
	g.Log().Debug(r.Context(), "CSRF Debug - Cookie Name:", csrfTokenCookieName)
	g.Log().Debug(r.Context(), "CSRF Debug - Cookie Token:", cookieToken)
	g.Log().Debug(r.Context(), "CSRF Debug - All Cookies:", r.Cookie.Map())
	g.Log().Debug(r.Context(), "CSRF Debug - Request URL:", r.URL.String())
	g.Log().Debug(r.Context(), "CSRF Debug - Request Method:", r.Method)

	// 从请求头中获取CSRF token
	headerToken := r.Header.Get(csrfTokenHeaderName)
	g.Log().Debug(r.Context(), "CSRF Debug - Header Token:", headerToken)

	// 如果cookie中没有token，生成一个新的并允许通过
	if cookieToken == "" {
		b := make([]byte, csrfTokenLength)
		if _, err := rand.Read(b); err != nil {
			r.Response.WriteStatus(http.StatusInternalServerError)
			r.Response.WriteJson(ghttp.DefaultHandlerResponse{
				Code:    http.StatusInternalServerError,
				Message: "CSRF token生成失败",
			})
			return
		}
		cookieToken = base64.URLEncoding.EncodeToString(b)
		r.Cookie.SetCookie(
			csrfTokenCookieName,
			cookieToken,
			"",  // domain为空，使用当前域名
			"/", // path为根路径
			24*time.Hour,
			ghttp.CookieOptions{
				HttpOnly: false,                // JavaScript需要读取来设置到请求头
				Secure:   false,                // 开发环境可能需要设为false
				SameSite: http.SameSiteLaxMode, // 改为Lax，更宽松
			},
		)
		g.Log().Debug(r.Context(), "CSRF Debug - Generated new token:", cookieToken)
		// 第一次请求允许通过，客户端需要读取cookie并在后续请求中使用
		r.Middleware.Next()
		return
	}

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
