package ssoJwt

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
)

// 给定需要签名的 JWT，使用私钥签名后返回 token string
func Signature(ctx context.Context, issueClaims jwt.Claims) (string, error) {
	// 获取私钥
	privateKey, err := getPrivateKey(ctx)
	if err != nil {
		return "", gerror.Wrap(err, "获取私钥失败")
	}

	// 创建JWT token
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodES256, issueClaims)

	// 使用私钥签名
	tokenString, err := jwtToken.SignedString(privateKey)
	if err != nil {
		return "", gerror.Wrap(err, "使用私钥签名失败")
	}

	return tokenString, nil
}
