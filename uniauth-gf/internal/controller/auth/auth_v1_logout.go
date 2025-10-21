package auth

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) Logout(ctx context.Context, req *v1.LogoutReq) (res *v1.LogoutRes, err error) {
	r := g.RequestFromCtx(ctx)

	// 清除 JWT
	// 清除 JWT-Login
	// 清除 Refresh Token
	// 跳转到 oauth/logout
	r.Cookie.Remove("jwt")
	r.Cookie.Remove("jwt-login")
	r.Cookie.Remove("refresh_token")
	r.Response.RedirectTo(g.Cfg().MustGetWithEnv(ctx, "sso.logout_url").String())
	return
}
