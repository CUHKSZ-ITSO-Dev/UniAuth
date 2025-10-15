package ssoJwt

import (
	"context"
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"os"
	"strings"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

const serviceAccountNamespaceFile = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"

// getPrivateKeyFromK8sSecret 从 Kubernetes Secret 中获取私钥
func getPrivateKeyFromK8sSecret(ctx context.Context) (*ecdsa.PrivateKey, error) {
	// 创建集群内部的 Kubernetes 客户端
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, gerror.Wrap(err, "无法获取集群内部配置")
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, gerror.Wrap(err, "无法创建 Kubernetes 客户端")
	}

	// 获取当前命名空间，从ServiceAccount文件读取
	namespace := ""
	if nsBytes, err := os.ReadFile(serviceAccountNamespaceFile); err == nil {
		namespace = strings.TrimSpace(string(nsBytes))
	}
	if namespace == "" {
		g.Log().Errorf(ctx, "从 ServiceAccount 文件获取 namespace 失败，使用 default")
		namespace = "default"
	}

	// 获取 secret
	secret, err := clientset.CoreV1().Secrets(namespace).Get(ctx, "jwt-private-keys", metav1.GetOptions{})
	if err != nil {
		return nil, gerror.Wrap(err, "无法获取 jwt-private-keys secret")
	}

	// 获取 current-key-id
	currentKeyIdBytes, exists := secret.Data["current-key-id"]
	if !exists {
		return nil, gerror.New("secret 中不存在 current-key-id 字段")
	}
	currentKeyId := string(currentKeyIdBytes)

	// 根据 current-key-id 获取对应的私钥
	privateKeyBytes, exists := secret.Data[currentKeyId]
	if !exists {
		return nil, gerror.Newf("secret 中不存在键为 %s 的私钥", currentKeyId)
	}

	// 解析 PEM 格式的私钥
	block, _ := pem.Decode(privateKeyBytes)
	if block == nil {
		return nil, gerror.New("无法解码 PEM 格式的私钥")
	}

	// 解析 EC 私钥
	privateKey, err := x509.ParseECPrivateKey(block.Bytes)
	if err != nil {
		return nil, gerror.Wrap(err, "无法解析 EC 私钥")
	}

	return privateKey, nil
}

func GetJwt(ctx context.Context, code string) (string, error) {
	response := g.Client().ContentJson().PostVar(
		ctx,
		g.Cfg().MustGet(ctx, "sso.token_url").String(),
		g.Map{
			"Content-Type":  "application/x-www-form-urlencoded",
			"client_id":     g.Cfg().MustGet(ctx, "sso.client_id").String(),
			"code":          code,
			"redirect_uri":  g.Cfg().MustGet(ctx, "sso.redirect_url").String(),
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

	parser := jwt.NewParser()
	token, _, err := parser.ParseUnverified(accessToken.(string), &jwt.MapClaims{})
	if err != nil {
		return "", gerror.Wrap(err, "JWT 解析失败")
	}
	upn, ok := token.Claims.(jwt.MapClaims)["upn"]
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
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24 * 7)),
		NotBefore: jwt.NewNumericDate(time.Now()),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ID:        uuid.New().String(),
	}
	issueClaims := &UniAuthClaims{
		*userinfo,
		registeredClaims,
	}

	// 获取私钥
	privateKey, err := getPrivateKeyFromK8sSecret(ctx)
	if err != nil {
		return "", gerror.Wrap(err, "获取私钥失败")
	}

	// 创建JWT token
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodES256, issueClaims)

	// 使用私钥签名
	tokenString, err := jwtToken.SignedString(privateKey)
	if err != nil {
		return "", gerror.Wrap(err, "JWT签名失败")
	}

	return tokenString, nil
}
