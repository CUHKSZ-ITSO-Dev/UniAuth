package main

import (
	"log"

	"uniauth-gin/internal/config"
	"uniauth-gin/internal/handler"
	"uniauth-gin/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化配置
	config.InitConfig()

	// 设置Gin模式
	gin.SetMode(config.AppConfig.Server.Mode)

	// 创建Gin实例
	r := gin.Default()

	// 加载HTML模板
	r.LoadHTMLGlob("templates/*")

	// 静态文件服务
	r.Static("/static", "./static")

	// 创建处理器实例
	authHandler := handler.NewAuthHandler()
	authMiddleware := middleware.NewAuthMiddleware()
	healthHandler := handler.NewHealthHandler()

	// 健康检查端点（不需要认证）
	r.GET("/health", healthHandler.HandleHealth)
	r.GET("/ready", healthHandler.HandleReadiness)
	r.GET("/live", healthHandler.HandleLiveness)

	// 认证相关路由（不需要认证）
	authGroup := r.Group("/auth")
	{
		authGroup.GET("/login", authHandler.HandleLogin)
		authGroup.GET("/callback", authHandler.HandleCallback)
		authGroup.POST("/logout", authHandler.HandleLogout)
		authGroup.GET("/status", authHandler.HandleStatus)
	}

	// 网关代理路由组（需要认证）
	proxyGroup := r.Group("/gateway")
	proxyGroup.Use(authMiddleware.RequireAuth())
	{
		// 这里可以添加需要认证的代理路由
		proxyGroup.Any("/*path", func(c *gin.Context) {
			// 代理逻辑将在后续实现
			c.JSON(200, gin.H{
				"message": "这是一个受保护的资源",
				"path":    c.Param("path"),
				"user":    c.GetString("user"),
			})
		})
	}

	// 可选认证的路由组
	conditionalGroup := r.Group("/conditional")
	conditionalGroup.Use(authMiddleware.ConditionalAuth())
	{
		conditionalGroup.GET("/public", func(c *gin.Context) {
			user, exists := c.Get("user")
			c.JSON(200, gin.H{
				"message":       "这是一个公共资源",
				"authenticated": exists,
				"user":          user,
			})
		})
	}

	// 启动服务器
	port := config.AppConfig.Server.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("UniAuth Gateway 启动在端口 %s", port)
	log.Printf("健康检查: http://localhost:%s/health", port)
	log.Printf("登录页面: http://localhost:%s/auth/login", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
