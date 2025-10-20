package ssoJwt

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
)

func VerifySignature(ctx context.Context, jwtStr string) (bool, error) {
	publicKey, err := getPublicKey(ctx)
	if err != nil {
		return false, gerror.Wrap(err, "获取公钥失败")
	}
	token, err := jwt.Parse(jwtStr, func(token *jwt.Token) (interface{}, error) {
		return publicKey, nil
	})
	if err != nil {
		return false, gerror.Wrap(err, "解析 JWT 失败")
	}
	return token.Valid, nil
}
