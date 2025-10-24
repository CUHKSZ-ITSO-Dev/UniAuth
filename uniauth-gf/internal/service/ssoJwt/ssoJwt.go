package ssoJwt

import (
	"context"
	"crypto/ecdsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/gogf/gf/v2/errors/gerror"
)

const (
	serviceAccountNamespaceFile = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
	configMapName               = "jwt-public-keys"
	secretName                  = "jwt-private-keys"
)

var clientset *kubernetes.Clientset
var namespace string = ""

func init() {
	// 创建集群内部的 Kubernetes 客户端
	config, err := rest.InClusterConfig()
	if err != nil {
		panic(fmt.Sprintf("无法获取集群内部配置: %v", err))
	}

	clientset, err = kubernetes.NewForConfig(config)
	if err != nil {
		panic(fmt.Sprintf("无法创建 Kubernetes 客户端: %v", err))
	}

	// 获取当前命名空间，从ServiceAccount文件读取
	if nsBytes, err := os.ReadFile(serviceAccountNamespaceFile); err == nil {
		namespace = strings.TrimSpace(string(nsBytes))
	}
	if namespace == "" {
		panic(fmt.Sprintf("从 ServiceAccount 文件获取 namespace 失败: %v", err))
	}
}

func getPrivateKey(ctx context.Context) (*ecdsa.PrivateKey, error) {
	// 获取 secret
	secret, err := clientset.CoreV1().Secrets(namespace).Get(ctx, secretName, metav1.GetOptions{})
	if err != nil {
		return nil, gerror.Wrapf(err, "无法获取 %s secret", secretName)
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

func getPublicKey(ctx context.Context) (*ecdsa.PublicKey, error) {
	// 获取 configmap
	configMap, err := clientset.CoreV1().ConfigMaps(namespace).Get(ctx, configMapName, metav1.GetOptions{})
	if err != nil {
		return nil, gerror.Wrapf(err, "无法获取 %s configmap", configMapName)
	}

	// 获取 current-key-id
	currentKeyIdBytes, exists := configMap.Data["current-key-id"]
	if !exists {
		return nil, gerror.New("configmap 中不存在 current-key-id 字段")
	}
	currentKeyId := string(currentKeyIdBytes)

	// 根据 current-key-id 获取公钥
	publicKeyBytes, exists := configMap.Data[currentKeyId]
	if !exists {
		return nil, gerror.Newf("configmap 中不存在键为 %s 的公钥", currentKeyId)
	}

	// 解析 PEM 格式的公钥
	block, _ := pem.Decode([]byte(publicKeyBytes))
	if block == nil {
		return nil, gerror.New("无法解码 PEM 格式的公钥")
	}

	// 解析 EC 公钥
	publicKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, gerror.Wrap(err, "无法解析 EC 公钥")
	}

	ecdsaPublicKey, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, gerror.New("公钥不是 ECDSA 类型")
	}
	return ecdsaPublicKey, nil
}
