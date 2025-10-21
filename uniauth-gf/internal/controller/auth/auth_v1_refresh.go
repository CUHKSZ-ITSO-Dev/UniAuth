package auth

import (
	"context"
	"time"
	"net/http"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"

	"uniauth-gf/api/auth/v1"
	"uniauth-gf/internal/service/ssoJwt"
)

func (c *ControllerV1) Refresh(ctx context.Context, req *v1.RefreshReq) (res *v1.RefreshRes, err error) {
	r := g.RequestFromCtx(ctx)
	refreshToken := r.Cookie.Get("refresh-token")
	if refreshToken.IsEmpty() {
		r.Response.WriteStatus(http.StatusUnauthorized)
		return nil, gerror.New("找不到 Refresh Token。必须重新登录。")
	}
	jwtStr, err := ssoJwt.Callback(ctx, refreshToken.String())
	if err != nil {
		r.Response.WriteStatus(http.StatusUnauthorized)
		return nil, gerror.Wrapf(err, "刷新令牌失败。必须重新登录。")
	}
	// 重新签发新的 JWT
	r.Cookie.Remove("jwt")
	r.Cookie.SetCookie(
		"jwt",
		jwtStr,
		".cuhk.edu.cn",
		"/",
		time.Hour,
		ghttp.CookieOptions{
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteNoneMode,
		},
	)
	return nil, nil
}
