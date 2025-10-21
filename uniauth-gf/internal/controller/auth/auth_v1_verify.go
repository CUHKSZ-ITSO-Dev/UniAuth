package auth

import (
	"context"
	"net/http"

	v1 "uniauth-gf/api/auth/v1"
	"uniauth-gf/internal/service/ssoJwt"

	"github.com/gogf/gf/v2/frame/g"
)

// VerifyJwt 验证JWT token（用于Nginx Ingress外部鉴权）
//
// 该接口用于Nginx Ingress的外部鉴权功能：
// 1. 从cookie中读取jwt
// 2. 验证JWT签名和有效期m
// 3. 验证成功：返回200，设置X-External-Request头为jti
// 4. 验证失败：返回401，Nginx会重定向到登录页
func (c *ControllerV1) VerifyJwt(ctx context.Context, req *v1.VerifyJwtReq) (res *v1.VerifyJwtRes, err error) {
	r := g.RequestFromCtx(ctx)
	res = &v1.VerifyJwtRes{}

	// 从cookie中获取JWT
	jwtCookie := r.Cookie.Get("jwt")
	if jwtCookie.IsEmpty() {
		g.Log().Info(ctx, "JWT验证失败: 未找到JWT cookie")
		r.Response.WriteStatus(http.StatusUnauthorized)
		r.Response.Header().Set("X-Auth-Error", "No JWT cookie")
		return res, nil
	}

	jwtStr := jwtCookie.String()

	// 验证JWT并解析claims
	claims, err := ssoJwt.VerifyAndParseClaims(ctx, jwtStr)
	if err != nil {
		g.Log().Infof(ctx, "JWT验证失败: %v", err)
		r.Response.WriteStatus(http.StatusUnauthorized)
		r.Response.Header().Set("X-Auth-Error", "JWT verification failed")
		return res, nil
	}

	// 验证成功，设置X-External-Request头部为jti
	jti := claims.ID
	if jti == "" {
		g.Log().Warning(ctx, "JWT验证成功但jti为空")
		r.Response.WriteStatus(http.StatusUnauthorized)
		r.Response.Header().Set("X-Auth-Error", "JWT missing jti")
		return res, nil
	}

	// 设置响应头
	r.Response.Header().Set("X-External-Request", jti)
	r.Response.WriteStatus(http.StatusOK)

	g.Log().Infof(ctx, "JWT验证成功 - JTI: %s", jti)

	return res, nil
}
