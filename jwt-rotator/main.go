package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"log/slog"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

const (
	defaultNamespace            = "default"
	configMapName               = "jwt-public-keys"
	secretName                  = "jwt-private-keys"
	keyPrefix                   = "key-"
	maxKeysToKeep               = 5 // 最多保留的密钥数量
	serviceAccountNamespaceFile = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
)

var curve = elliptic.P256()

type KeyRotator struct {
	clientset *kubernetes.Clientset
	namespace string
	ctx       context.Context
}

// JWTKeyPair JWT密钥对
type JWTKeyPair struct {
	KeyID      string
	PrivateKey *ecdsa.PrivateKey
	PublicKey  *ecdsa.PublicKey
	CreatedAt  time.Time
}

// 获取当前Pod的namespace
func getCurrentNamespace() string {
	// 从ServiceAccount文件读取（K8s原生方式）
	if nsBytes, err := os.ReadFile(serviceAccountNamespaceFile); err == nil {
		if ns := strings.TrimSpace(string(nsBytes)); ns != "" {
			log.Printf("从ServiceAccount文件获取namespace: %s", ns)
			return ns
		}
	}
	// 获取失败回退配置的默认ns
	log.Printf("使用默认namespace: %s", defaultNamespace)
	return defaultNamespace
}

// NewKeyRotator 创建新的密钥轮换器
func NewKeyRotator() (*KeyRotator, error) {
	// 获取Kubernetes配置
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("无法获取Kubernetes配置: %v", err)
	}

	// 创建Kubernetes客户端
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("无法创建Kubernetes客户端: %v", err)
	}

	namespace := getCurrentNamespace()

	return &KeyRotator{
		clientset: clientset,
		namespace: namespace,
		ctx:       context.Background(),
	}, nil
}

// GenerateECCKeyPair 生成ECC密钥对
func (kr *KeyRotator) GenerateECCKeyPair() (*JWTKeyPair, error) {
	// 使用P-256椭圆曲线生成密钥对
	privateKey, err := ecdsa.GenerateKey(curve, rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("生成ECC密钥对失败: %v", err)
	}

	// 生成密钥ID（基于时间戳）
	now := time.Now()
	keyID := fmt.Sprintf("%s%d", keyPrefix, now.Unix())

	return &JWTKeyPair{
		KeyID:      keyID,
		PrivateKey: privateKey,
		PublicKey:  &privateKey.PublicKey,
		CreatedAt:  now,
	}, nil
}

// EncodePrivateKeyToPEM 将私钥编码为PEM格式
func (kr *KeyRotator) EncodePrivateKeyToPEM(privateKey *ecdsa.PrivateKey) ([]byte, error) {
	privateKeyBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		return nil, fmt.Errorf("编码私钥失败: %v", err)
	}

	privateKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: privateKeyBytes,
	})

	return privateKeyPEM, nil
}

// EncodePublicKeyToPEM 将公钥编码为PEM格式
func (kr *KeyRotator) EncodePublicKeyToPEM(publicKey *ecdsa.PublicKey) ([]byte, error) {
	publicKeyBytes, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return nil, fmt.Errorf("编码公钥失败: %v", err)
	}

	publicKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicKeyBytes,
	})

	return publicKeyPEM, nil
}

// UpdateConfigMap 更新ConfigMap中的公钥
func (kr *KeyRotator) UpdateConfigMap(keyPair *JWTKeyPair) error {
	publicKeyPEM, err := kr.EncodePublicKeyToPEM(keyPair.PublicKey)
	if err != nil {
		return fmt.Errorf("编码公钥失败: %v", err)
	}

	configMapsClient := kr.clientset.CoreV1().ConfigMaps(kr.namespace)

	// 获取现有ConfigMap
	configMap, err := configMapsClient.Get(kr.ctx, configMapName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// 如果ConfigMap不存在，创建新的
			configMap = &corev1.ConfigMap{
				ObjectMeta: metav1.ObjectMeta{
					Name:      configMapName,
					Namespace: kr.namespace,
					Labels: map[string]string{
						"app":       "jwt-rotator",
						"component": "public-keys",
					},
				},
				Data: make(map[string]string),
			}
		} else {
			// 其他错误，直接返回
			return fmt.Errorf("获取ConfigMap失败: %v", err)
		}

	}

	// 添加新的公钥
	configMap.Data[keyPair.KeyID] = string(publicKeyPEM)
	configMap.Data["current-key-id"] = keyPair.KeyID
	configMap.Data["last-rotation"] = keyPair.CreatedAt.Format(time.RFC3339)

	// 更新或创建ConfigMap
	if configMap.ResourceVersion == "" {
		_, err = configMapsClient.Create(kr.ctx, configMap, metav1.CreateOptions{})
	} else {
		_, err = configMapsClient.Update(kr.ctx, configMap, metav1.UpdateOptions{})
	}

	if err != nil {
		return fmt.Errorf("更新ConfigMap失败: %v", err)
	}

	log.Printf("成功更新ConfigMap，新公钥ID: %s", keyPair.KeyID)
	return nil
}

// UpdateSecret 更新Secret中的私钥
func (kr *KeyRotator) UpdateSecret(keyPair *JWTKeyPair) error {
	privateKeyPEM, err := kr.EncodePrivateKeyToPEM(keyPair.PrivateKey)
	if err != nil {
		return fmt.Errorf("编码私钥失败: %v", err)
	}

	secretsClient := kr.clientset.CoreV1().Secrets(kr.namespace)

	// 获取现有Secret
	secret, err := secretsClient.Get(kr.ctx, secretName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			// 如果Secret不存在，创建新的
			secret = &corev1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      secretName,
					Namespace: kr.namespace,
					Labels: map[string]string{
						"app":       "jwt-rotator",
						"component": "private-keys",
					},
				},
				Type: corev1.SecretTypeOpaque,
				Data: make(map[string][]byte),
			}
		} else {
			return fmt.Errorf("获取Secret失败: %v", err)
		}
	}

	// 添加新的私钥
	secret.Data[keyPair.KeyID] = privateKeyPEM
	secret.Data["current-key-id"] = []byte(keyPair.KeyID)
	secret.Data["last-rotation"] = []byte(keyPair.CreatedAt.Format(time.RFC3339))

	// 更新或创建Secret
	if secret.ResourceVersion == "" {
		_, err = secretsClient.Create(kr.ctx, secret, metav1.CreateOptions{})
	} else {
		_, err = secretsClient.Update(kr.ctx, secret, metav1.UpdateOptions{})
	}

	if err != nil {
		return fmt.Errorf("更新Secret失败: %v", err)
	}

	log.Printf("成功更新Secret，新私钥ID: %s", keyPair.KeyID)
	return nil
}

// cleanupConfigMapKeys 清理ConfigMap中的旧公钥
func (kr *KeyRotator) cleanupConfigMapKeys() error {
	configMapsClient := kr.clientset.CoreV1().ConfigMaps(kr.namespace)

	configMap, err := configMapsClient.Get(kr.ctx, configMapName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("获取ConfigMap失败: %v", err)
	}

	// 收集所有密钥的时间戳
	var timestamps []string
	for key := range configMap.Data {
		if key == "current-key-id" || key == "last-rotation" {
			continue
		}
		// 从密钥ID中提取时间戳
		if len(key) > len(keyPrefix) {
			timestamps = append(timestamps, key[len(keyPrefix):])
		}
	}

	// 如果密钥数量超过最大保留数量，删除最旧的密钥
	if len(timestamps) > maxKeysToKeep {
		// 按时间戳升序排序（最旧的(小的时间戳)在前）
		slices.SortFunc(timestamps, func(a, b string) int {
			ai, err := strconv.ParseInt(a, 10, 64)
			if err != nil {
				slog.Warn("时间戳转换出错：%s。错误：%v", a, err)
			}
			bi, err := strconv.ParseInt(b, 10, 64)
			if err != nil {
				slog.Warn("时间戳转换出错：%s。错误：%v", b, err)
			}
			return int(ai - bi)
		})
		for i := range len(timestamps) - maxKeysToKeep {
			delete(configMap.Data, keyPrefix+timestamps[i])
		}

		// 更新ConfigMap
		_, err = configMapsClient.Update(kr.ctx, configMap, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("更新ConfigMap失败: %v", err)
		}

		log.Printf("从ConfigMap中删除了 %d 个旧密钥", len(timestamps)-maxKeysToKeep)
	}

	return nil
}

// cleanupSecretKeys 清理Secret中的旧私钥
func (kr *KeyRotator) cleanupSecretKeys() error {
	secretsClient := kr.clientset.CoreV1().Secrets(kr.namespace)

	secret, err := secretsClient.Get(kr.ctx, secretName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("获取Secret失败: %v", err)
	}

	// 收集时间戳
	var timestamps []string
	for key := range secret.Data {
		if key == "current-key-id" || key == "last-rotation" {
			continue
		}
		// 从密钥ID中提取时间戳
		if len(key) > len(keyPrefix) {
			timestamps = append(timestamps, key[len(keyPrefix):])
		}
	}

	// 如果密钥数量超过最大保留数量，删除最旧的密钥
	if len(timestamps) > maxKeysToKeep {
		// 按时间戳升序排序（最旧的(小的时间戳)在前）
		slices.SortFunc(timestamps, func(a, b string) int {
			ai, err := strconv.ParseInt(a, 10, 64)
			if err != nil {
				slog.Warn("时间戳转换出错：%s。错误：%v", a, err)
			}
			bi, err := strconv.ParseInt(b, 10, 64)
			if err != nil {
				slog.Warn("时间戳转换出错：%s。错误：%v", b, err)
			}
			return int(ai - bi)
		})
		for i := range len(timestamps) - maxKeysToKeep {
			delete(secret.Data, keyPrefix+timestamps[i])
		}

		// 更新Secret
		_, err = secretsClient.Update(kr.ctx, secret, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("更新Secret失败: %v", err)
		}

		log.Printf("从Secret中删除了 %d 个旧密钥", len(timestamps)-maxKeysToKeep)
	}

	return nil
}

// RotateKeys 执行密钥轮换
func (kr *KeyRotator) RotateKeys() error {
	log.Println("开始JWT密钥轮换...")

	// 生成新的密钥对
	keyPair, err := kr.GenerateECCKeyPair()
	if err != nil {
		return fmt.Errorf("生成密钥对失败: %v", err)
	}
	log.Printf("生成新密钥对，密钥ID: %s", keyPair.KeyID)

	// 更新ConfigMap中的公钥
	if err := kr.UpdateConfigMap(keyPair); err != nil {
		return fmt.Errorf("更新公钥失败: %v", err)
	}
	// 更新Secret中的私钥
	if err := kr.UpdateSecret(keyPair); err != nil {
		return fmt.Errorf("更新私钥失败: %v", err)
	}

	// 清理旧密钥
	// 清理ConfigMap中的旧公钥
	if err := kr.cleanupConfigMapKeys(); err != nil {
		log.Printf("清理ConfigMap旧密钥失败: %v", err)
	}
	// 清理Secret中的旧私钥
	if err := kr.cleanupSecretKeys(); err != nil {
		log.Printf("清理Secret旧密钥失败: %v", err)
	}

	log.Println("JWT密钥轮换完成")
	return nil
}

// GetCurrentKeyInfo 获取当前密钥信息
func (kr *KeyRotator) GetCurrentKeyInfo() error {
	// 获取ConfigMap信息
	configMapsClient := kr.clientset.CoreV1().ConfigMaps(kr.namespace)
	configMap, err := configMapsClient.Get(kr.ctx, configMapName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("获取ConfigMap失败: %v", err)
	}

	currentKeyID, ok := configMap.Data["current-key-id"]
	if !ok {
		return fmt.Errorf("获取当前密钥ID失败")
	}
	lastRotation, ok := configMap.Data["last-rotation"]
	if !ok {
		return fmt.Errorf("获取上次轮换时间失败")
	}

	log.Printf("当前密钥ID: %s", currentKeyID)
	log.Printf("上次轮换时间: %s", lastRotation)

	// 统计密钥数量
	keyCount := 0
	for key := range configMap.Data {
		if key != "current-key-id" && key != "last-rotation" {
			keyCount++
		}
	}
	log.Printf("当前保存的密钥数量: %d", keyCount)

	return nil
}

func main() {
	log.Println("JWT密钥轮换工具启动")

	// 创建密钥轮换器
	rotator, err := NewKeyRotator()
	if err != nil {
		log.Fatalf("创建密钥轮换器失败: %v", err)
	}

	// 检查命令行参数
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "info":
			// 显示当前密钥信息
			if err := rotator.GetCurrentKeyInfo(); err != nil {
				log.Fatalf("获取密钥信息失败: %v", err)
			}
			return
		case "rotate":
			// 强制执行密钥轮换
			if err := rotator.RotateKeys(); err != nil {
				log.Fatalf("密钥轮换失败: %v", err)
			}
			return
		case "cleanup":
			// 仅执行清理操作
			if err := rotator.cleanupConfigMapKeys(); err != nil {
				log.Fatalf("清理ConfigMap旧密钥失败: %v", err)
			}
			if err := rotator.cleanupSecretKeys(); err != nil {
				log.Fatalf("清理Secret旧密钥失败: %v", err)
			}
			return
		default:
			log.Printf("未知命令: %s", os.Args[1])
			log.Println("支持的命令: info, rotate, cleanup")
			os.Exit(1)
		}
	}

	// 默认执行密钥轮换
	if err := rotator.RotateKeys(); err != nil {
		log.Fatalf("密钥轮换失败: %v", err)
	}
}
