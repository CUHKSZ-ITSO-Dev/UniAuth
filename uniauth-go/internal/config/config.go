package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
)

// Config 应用配置结构
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Log      LogConfig      `json:"log"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int    `json:"port"`
	Mode string `json:"mode"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Type     string `json:"type"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Name     string `json:"name"`
	User     string `json:"user"`
	Password string `json:"password"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level string `json:"level"`
	File  string `json:"file"`
}

// LoadConfig 加载配置
func LoadConfig() (*Config, error) {
	// 首先确定运行模式
	mode := getEnv("UNIAUTH_MODE", "dev")

	var config *Config

	if mode == "dev" {
		// 开发模式：使用硬编码的SQLite配置
		config = &Config{
			Server: ServerConfig{
				Port: getEnvAsInt("UNIAUTH_PORT", 9090),
				Mode: "debug",  // 开发模式下使用debug模式，配合GIN_MODE=debug
			},
			Database: DatabaseConfig{
				Type:     "sqlite",
				Host:     "",
				Port:     0,
				Name:     "casbin.db",
				User:     "",
				Password: "",
			},
			Log: LogConfig{
				Level: getEnv("UNIAUTH_LOG_LEVEL", "debug"),
				File:  getEnv("UNIAUTH_LOG_FILE", ""),
			},
		}
	} else {
		// 生产模式：从环境变量加载配置，要求所有数据库配置都必须提供
		config = &Config{
			Server: ServerConfig{
				Port: getEnvAsInt("UNIAUTH_PORT", 8080),
				Mode: "release",
			},
			Database: DatabaseConfig{
				Type:     getEnv("UNIAUTH_DB_TYPE", "postgres"),
				Host:     getEnv("UNIAUTH_DB_HOST", ""),
				Port:     getEnvAsInt("UNIAUTH_DB_PORT", 0),
				Name:     getEnv("UNIAUTH_DB_NAME", ""),
				User:     getEnv("UNIAUTH_DB_USER", ""),
				Password: getEnv("UNIAUTH_DB_PASSWORD", ""),
			},
			Log: LogConfig{
				Level: getEnv("UNIAUTH_LOG_LEVEL", "info"),
				File:  getEnv("UNIAUTH_LOG_FILE", ""),
			},
		}

		// 生产模式环境变量校验
		validateProductionConfig(config)
	}

	return config, nil
}

// =======对外函数=======
// GetDSN 获取数据库连接字符串
func (c *Config) GetDSN() string {
	switch c.Database.Type {
	case "sqlite":
		return c.Database.Name
	case "postgres":
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Shanghai",
			c.Database.Host, c.Database.Port, c.Database.User, c.Database.Password,
			c.Database.Name)
	default:
		return ""
	}
}

// =======辅助函数=======
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnv(key string, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// validateProductionConfig 验证生产模式配置
func validateProductionConfig(config *Config) error {
	// 验证数据库配置
	if config.Database.Host == "" {
		log.Fatal("生产模式下必须配置 UNIAUTH_DB_HOST！程序退出...")
	}
	if config.Database.Port == 0 {
		log.Fatal("生产模式下必须配置 UNIAUTH_DB_PORT！程序退出...")
	}
	if config.Database.Name == "" {
		log.Fatal("生产模式下必须配置 UNIAUTH_DB_NAME！程序退出...")
	}
	if config.Database.User == "" {
		log.Fatal("生产模式下必须配置 UNIAUTH_DB_USER！程序退出...")
	}
	if config.Database.Password == "" {
		log.Fatal("生产模式下必须配置 UNIAUTH_DB_PASSWORD！程序退出...")
	}

	// 验证数据库类型
	if config.Database.Type != "postgres" {
		log.Fatalf("生产模式仅支持 postgres 数据库类型，当前配置: %s！程序退出...", config.Database.Type)
	}

	return nil
}
