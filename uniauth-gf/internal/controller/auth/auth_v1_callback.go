package auth

import (
	"context"
	// "net/http"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	// "github.com/gogf/gf/v2/net/ghttp"

	v1 "uniauth-gf/api/auth/v1"
	"uniauth-gf/internal/service/ssoJwt"
)

func (c *ControllerV1) Callback(ctx context.Context, req *v1.CallbackReq) (res *v1.CallbackRes, err error) {
	defer g.RequestFromCtx(ctx).Cookie.Remove("jwt-login")
	
	// 校验jwt-login
	jwtLogin := g.RequestFromCtx(ctx).Cookie.Get("jwt-login").String()
	valid, err := ssoJwt.VerifySignature(ctx, jwtLogin)
	if err != nil {
		return nil, gerror.Wrapf(err, "校验jwt-login失败")
	}
	if !valid {
		return nil, gerror.New("jwt-login无效，登录流程终止")
	}

	jwtStr, err := ssoJwt.Callback(ctx, req.Code)
	if err != nil {
		return nil, gerror.Wrapf(err, "登录处理失败")
	}

	r := g.RequestFromCtx(ctx)
	r.Cookie.SetCookie(
		"jwt",
		jwtStr,
		"localhost:8000",
		"/",
		time.Hour*7,
		// ghttp.CookieOptions{
		// 	HttpOnly: true,
		// 	Secure:   true,
		// 	SameSite: http.SameSiteLaxMode,
		// },
	)
	r.Response.RedirectTo("/")
	return nil, nil
}
