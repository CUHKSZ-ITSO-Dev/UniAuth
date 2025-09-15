package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Server  ServerConfig  `mapstructure:"server"`
	Session SessionConfig `mapstructure:"session"`
	SSO     SSOConfig     `mapstructure:"sso"`
	Redis   RedisConfig   `mapstructure:"redis"`
	UniAuth UniAuthConfig `mapstructure:"uniauth"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

type SessionConfig struct {
	SecretKey    string `mapstructure:"secret_key"`
	CookieName   string `mapstructure:"cookie_name"`
	CookieDomain string `mapstructure:"cookie_domain"`
	CookieMaxAge int    `mapstructure:"cookie_max_age"`
	CookieSecure bool   `mapstructure:"cookie_secure"`
}

type SSOConfig struct {
	LoginURL     string `mapstructure:"login_url"`
	CallbackURL  string `mapstructure:"callback_url"`
	ClientID     string `mapstructure:"client_id"`
	ClientSecret string `mapstructure:"client_secret"`
}

type RedisConfig struct {
	Addr     string `mapstructure:"addr"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type UniAuthConfig struct {
	BaseURL string `mapstructure:"base_url"`
	Timeout int    `mapstructure:"timeout"`
}

var AppConfig *Config

func InitConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// 设置环境变量前缀
	viper.SetEnvPrefix("UNIAUTH_GIN")
	viper.AutomaticEnv()

	// 设置默认值
	setDefaults()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("配置文件读取失败: %v，将使用默认配置", err)
	}

	AppConfig = &Config{}
	if err := viper.Unmarshal(AppConfig); err != nil {
		log.Fatalf("配置解析失败: %v", err)
	}

	log.Printf("配置加载成功: %+v", AppConfig)
}

func setDefaults() {
	// 服务器默认配置
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.mode", "debug")

	// Session默认配置
	viper.SetDefault("session.secret_key", "your-secret-key")
	viper.SetDefault("session.cookie_name", "uniauth_session")
	viper.SetDefault("session.cookie_domain", "")
	viper.SetDefault("session.cookie_max_age", 3600)
	viper.SetDefault("session.cookie_secure", false)

	// SSO默认配置
	viper.SetDefault("sso.login_url", "https://sso.example.com/login")
	viper.SetDefault("sso.callback_url", "/auth/callback")
	viper.SetDefault("sso.client_id", "your-client-id")
	viper.SetDefault("sso.client_secret", "your-client-secret")

	// Redis默认配置
	viper.SetDefault("redis.addr", "localhost:6379")
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.db", 0)

	// UniAuth默认配置
	viper.SetDefault("uniauth.base_url", "http://localhost:8000")
	viper.SetDefault("uniauth.timeout", 30)
}
