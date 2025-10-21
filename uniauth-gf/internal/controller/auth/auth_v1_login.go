package auth

import (
	"context"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gres"
	"github.com/gogf/gf/v2/util/grand"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	v1 "uniauth-gf/api/auth/v1"
	"uniauth-gf/internal/service/ssoJwt"
)

func (c *ControllerV1) Login(ctx context.Context, req *v1.LoginReq) (res *v1.LoginRes, err error) {
	// 来一个随机state
	state := grand.S(32)

	// 签发包含 State 的 JWT
	jwtC := jwt.RegisteredClaims{
		Issuer:    "UniAuth Automated System",
		Subject:   state,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute * 3)),
		NotBefore: jwt.NewNumericDate(time.Now()),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ID:        uuid.New().String(),
	}
	tokenString, err := ssoJwt.Signature(ctx, jwtC)
	if err != nil {
		return nil, gerror.Wrap(err, "JWT签名失败")
	}

	g.RequestFromCtx(ctx).Cookie.SetCookie("jwt-login", tokenString, "localhost:8000", "/", time.Minute*3)

	// 从 gres 打包资源中读取模板内容
	tplContent := gres.GetContent("resource/template/login.html")
	if len(tplContent) == 0 {
		return nil, gerror.New("无法从资源中读取登录页面模板")
	}
	if err = g.RequestFromCtx(ctx).Response.WriteTplContent(string(tplContent),
		g.Map{
			"client_id":    g.Cfg().MustGet(ctx, "sso.client_id").String(),
			"redirect_uri": g.Cfg().MustGet(ctx, "sso.redirect_uri").String(),
			"resource":     g.Cfg().MustGet(ctx, "sso.resource").String(),
			"state":        state,
		}); err != nil {
		return nil, gerror.Wrap(err, "写入登录页面失败")
	}
	return nil, nil
}
