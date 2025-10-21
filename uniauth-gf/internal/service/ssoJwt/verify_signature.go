package ssoJwt

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
)

// VerifyAndParseClaims 验证JWT签名并解析claims（一步完成）
func VerifyAndParseClaims(ctx context.Context, jwtStr string) (*jwt.RegisteredClaims, error) {
	publicKey, err := getPublicKey(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "获取公钥失败")
	}

	claims := &jwt.RegisteredClaims{}
	token, err := jwt.ParseWithClaims(jwtStr, claims, func(token *jwt.Token) (interface{}, error) {
		return publicKey, nil
	})
	if err != nil {
		return nil, gerror.Wrap(err, "解析或验证 JWT 失败")
	}
	if !token.Valid {
		return nil, gerror.New("JWT 无效")
	}

	return claims, nil
}
