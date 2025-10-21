package ssoJwt

import (
	"context"
	"time"
	"net/http"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func Callback(ctx context.Context, code string) (string, error) {
	response := g.Client().ContentType("application/x-www-form-urlencoded; charset=utf-8").PostVar(
		ctx,
		g.Cfg().MustGet(ctx, "sso.token_url").String(),
		g.Map{
			"client_id":     g.Cfg().MustGet(ctx, "sso.client_id").String(),
			"code":          code,
			"redirect_uri":  g.Cfg().MustGet(ctx, "sso.redirect_uri").String(),
			"grant_type":    "authorization_code",
			"client_secret": g.Cfg().MustGet(ctx, "sso.client_secret").String(),
		},
	).Map()

	_, ok := response["error"]
	if ok {
		return "", gerror.Newf(
			"因为以下原因，SSO认证失败，请重试。<br/>SSO authentication failed due to the following reason. Please try again.<br/><br/>错误/Error: %s<br/><br/>错误描述/Error Description: %s",
			response["error"],
			response["error_description"],
		)
	}

	accessToken, ok := response["access_token"]
	if !ok {
		return "", gerror.New(
			"SSO认证信息返回信息中没有Access Token。这通常不是你的问题，请联系管理员检查日志。<br/>Can not get your access token. This is usually not your issue. Please contact the administrator to check the logs.",
		)
	}

	r := g.RequestFromCtx(ctx)
	r.Cookie.Remove("refresh-token")
	r.Cookie.SetCookie(
		"refresh-token", 
		response["refresh_token"].(string), 
		g.Cfg().MustGet(ctx, "sso.resource").String(), 
		"/auth", 
		time.Hour * 7, 
		ghttp.CookieOptions{
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		},
	)

	parser := jwt.NewParser()
	token, _, err := parser.ParseUnverified(accessToken.(string), &jwt.MapClaims{})
	if err != nil {
		return "", gerror.Wrap(err, "JWT 解析失败")
	}
	upn, ok := (*(token.Claims.(*jwt.MapClaims)))["upn"]
	if !ok {
		return "", gerror.New("JWT 中没有 upn 字段")
	}

	var userinfo *entity.UserinfosUserInfos
	if err := dao.UserinfosUserInfos.Ctx(ctx).Where("upn = ?", upn.(string)).Scan(&userinfo); err != nil {
		return "", gerror.Wrap(err, "数据库中获取用户信息失败")
	}
	if userinfo == nil {
		return "", gerror.New("无法查找到你的AD域信息。这通常不是你的问题，请联系管理员检查AD域数据库。<br/>Failed to retrieve your AD domain information. This is usually not your issue; please contact the administrator to check the Active Directory database.")
	}

	// 签发流程
	registeredClaims := jwt.RegisteredClaims{
		Issuer:    "UniAuth Automated System",
		Subject:   upn.(string),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		NotBefore: jwt.NewNumericDate(time.Now()),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ID:        uuid.New().String(),
	}
	issueClaims := &UniAuthClaims{
		*userinfo,
		registeredClaims,
	}

	tokenString, err := Signature(ctx, issueClaims)
	if err != nil {
		return "", gerror.Wrap(err, "签名失败")
	}

	return tokenString, nil
}
