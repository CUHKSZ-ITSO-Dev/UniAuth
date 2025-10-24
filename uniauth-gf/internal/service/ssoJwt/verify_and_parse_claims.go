package ssoJwt

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
)

// VerifyAndParseClaims 验证JWT签名并解析claims（一步完成）
// 验证内容包括：
// 1. 签名算法必须是ES256 (ECDSA P-256)
// 2. 签名验证
// 3. 过期时间 (exp)
// 4. 生效时间 (nbf)
// 5. 签发者 (iss)
func VerifyAndParseClaims(ctx context.Context, jwtStr string) (*jwt.RegisteredClaims, error) {
	publicKey, err := getPublicKey(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "获取公钥失败")
	}

	claims := &jwt.RegisteredClaims{}

	// 使用 ParseWithClaims 并配置验证选项
	token, err := jwt.ParseWithClaims(jwtStr, claims, func(token *jwt.Token) (interface{}, error) {
		// 验证签名算法必须是 ECDSA
		if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
			return nil, gerror.Newf("意外的签名方法: %v", token.Header["alg"])
		}
		return publicKey, nil
	},
		// 配置验证选项
		jwt.WithValidMethods([]string{"ES256"}),    // 只允许 ES256 算法
		jwt.WithExpirationRequired(),               // 必须有过期时间
		jwt.WithIssuedAt(),                         // 验证签发时间
		jwt.WithIssuer("UniAuth Automated System"), // 验证签发者
	)

	if err != nil {
		return nil, gerror.Wrap(err, "解析或验证 JWT 失败")
	}

	if !token.Valid {
		return nil, gerror.New("JWT 无效")
	}

	return claims, nil
}
