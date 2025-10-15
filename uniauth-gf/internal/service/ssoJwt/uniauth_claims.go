package ssoJwt

import (
	"github.com/golang-jwt/jwt/v5"
	"uniauth-gf/internal/model/entity"
)

// 集群内部通用 JWT Claims 结构
type UniAuthClaims struct {
	entity.UserinfosUserInfos
	RegisteredClaims jwt.RegisteredClaims
}

func (c *UniAuthClaims) GetExpirationTime() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.ExpiresAt, nil
}

func (c *UniAuthClaims) GetIssuedAt() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.IssuedAt, nil
}

func (c *UniAuthClaims) GetNotBefore() (*jwt.NumericDate, error) {
	return c.RegisteredClaims.NotBefore, nil
}

func (c *UniAuthClaims) GetIssuer() (string, error) {
	return c.RegisteredClaims.Issuer, nil
}

func (c *UniAuthClaims) GetSubject() (string, error) {
	return c.RegisteredClaims.Subject, nil
}

func (c *UniAuthClaims) GetAudience() (jwt.ClaimStrings, error) {
	return c.RegisteredClaims.Audience, nil
}