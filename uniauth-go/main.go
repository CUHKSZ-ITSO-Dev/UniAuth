package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"

	"uniauth/internal/app"
	"uniauth/internal/config"
	"uniauth/internal/middleware"
	adminModel "uniauth/internal/modules/admin/model"
	adminAuthService "uniauth/internal/modules/admin/service"
	billingService "uniauth/internal/modules/billing/service"
	rbacService "uniauth/internal/modules/rbac/service"
	userService "uniauth/internal/modules/user/service"
	"uniauth/internal/storage"
	"uniauth/routes"

	"github.com/gin-gonic/gin"
	"golang.org/x/term"
)

// 显示使用帮助
func showUsage() {
	fmt.Println(`UniAuth 统一认证授权系统
Copyright 2024-2025 The Chinese University of Hong Kong, Shenzhen

用法:
  ./uniauth server [--dev]      启动服务器 (--dev以开发模式启动)
  ./uniauth init <csv_file>     从CSV文件导入权限策略到数据库
  ./uniauth create-admin        交互式创建本地管理员账号
  ./uniauth help                显示此帮助信息

示例:
  ./uniauth init configs/policy_kb_and_deny.csv
  ./uniauth server
  ./uniauth create-admin

环境变量:
  UNIAUTH_PORT                 服务器端口 (默认 9090)
  UNIAUTH_DEV                  开发模式 (true/false)
  UNIAUTH_DB_HOST              数据库主机
  UNIAUTH_DB_NAME              数据库名称
  UNIAUTH_DB_USER              数据库用户
  UNIAUTH_DB_PASSWORD          数据库密码
  UNIAUTH_JWT_SECRET           管理后台JWT密钥 (未设置将使用默认值)
  UNIAUTH_DEFAULT_ADMIN_USER   默认管理员用户名 (server 启动时自动创建)
  UNIAUTH_DEFAULT_ADMIN_PASS   默认管理员密码 (server 启动时自动创建)`)
}

// 初始化策略命令
func initPolicies(csvFile string) error {
	log.Printf("开始从 %s 初始化权限策略到数据库", csvFile)

	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	// 初始化数据库
	db, err := storage.NewDatabaseConnection(cfg.Database.Type, cfg.GetDSN())
	if err != nil {
		return fmt.Errorf("数据库连接失败: %w", err)
	}
	if err := storage.AutoMigrateTables(db); err != nil {
		return fmt.Errorf("数据库迁移失败: %w", err)
	}

	// 创建服务实例
	authService, err := rbacService.NewAuthService(db)
	if err != nil {
		return fmt.Errorf("创建服务实例失败: %w", err)
	}

	// 导入指定的CSV文件
	if err := authService.LoadPoliciesFromCSV(csvFile); err != nil {
		return fmt.Errorf("导入策略失败: %w", err)
	}

	log.Println("策略初始化完成!")
	return nil
}

// 启动服务器
func startServer() error {
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	log.Printf("启动UniAuth服务器，端口: %d, 数据库类型: %s", cfg.Server.Port, cfg.Database.Type)

	// 初始化数据库
	db, err := storage.NewDatabaseConnection(cfg.Database.Type, cfg.GetDSN())
	if err != nil {
		return fmt.Errorf("数据库连接失败: %w", err)
	}
	if err := storage.AutoMigrateTables(db); err != nil {
		return fmt.Errorf("数据库迁移失败: %w", err)
	}

	// 创建服务实例
	authService, err := rbacService.NewAuthService(db)
	if err != nil {
		return fmt.Errorf("创建统一鉴权服务实例失败: %w", err)
	}
	userInfoService := userService.NewUserInfoService(db)
	abstractGroupService := rbacService.NewAbstractGroupService(db, authService, userInfoService)
	chatService := billingService.NewChatService(db, abstractGroupService)

	// 管理后台本地登录服务与初始化
	jwtSecret := os.Getenv("UNIAUTH_JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-this-in-prod"
	}
	adminService := adminAuthService.NewAdminAuthService(db, jwtSecret)
	defaultAdminUser := os.Getenv("UNIAUTH_DEFAULT_ADMIN_USER")
	if defaultAdminUser == "" {
		defaultAdminUser = "admin"
	}
	defaultAdminPass := os.Getenv("UNIAUTH_DEFAULT_ADMIN_PASS")
	if defaultAdminPass == "" {
		defaultAdminPass = "admin123"
	}
	if err := adminService.EnsureDefaultAdmin(defaultAdminUser, defaultAdminPass); err != nil {
		return fmt.Errorf("创建默认管理员失败: %w", err)
	}

	// 创建应用
	app := app.NewApp(authService, abstractGroupService, chatService, userInfoService, adminService)

	// 配置GIN服务器
	gin.SetMode(cfg.Server.Mode)
	r := gin.New()

	// 添加中间件
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// 设置路由
	routes.SetupRoutes(r, app)

	// 启动服务
	log.Printf("UniAuth服务正在%d端口运行", cfg.Server.Port)
	if err := r.Run(fmt.Sprintf(":%d", cfg.Server.Port)); err != nil {
		return fmt.Errorf("启动服务失败: %w", err)
	}

	return nil
}

// 交互式创建本地管理员
func createAdminInteractive() error {
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	// 初始化数据库
	db, err := storage.NewDatabaseConnection(cfg.Database.Type, cfg.GetDSN())
	if err != nil {
		return fmt.Errorf("数据库连接失败: %w", err)
	}
	if err := storage.AutoMigrateTables(db); err != nil {
		return fmt.Errorf("数据库迁移失败: %w", err)
	}

	// 初始化AdminAuthService
	jwtSecret := os.Getenv("UNIAUTH_JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-this-in-prod"
	}
	adminService := adminAuthService.NewAdminAuthService(db, jwtSecret)

	reader := bufio.NewReader(os.Stdin)

	// 输入用户名
	var username string
	for {
		fmt.Print("请输入用户名: ")
		u, _ := reader.ReadString('\n')
		username = strings.TrimSpace(u)
		if username == "" {
			fmt.Println("用户名不能为空，请重新输入。")
			continue
		}
		var count int64
		db.Model(&adminModel.AdminUser{}).Where("username = ?", username).Count(&count)
		if count > 0 {
			fmt.Println("该用户名已存在，请更换用户名。")
			continue
		}
		break
	}

	// 输入密码
	var password string
	for {
		fmt.Print("请输入密码: ")
		b1, _ := term.ReadPassword(int(syscall.Stdin))
		fmt.Println()
		fmt.Print("请再次输入密码: ")
		b2, _ := term.ReadPassword(int(syscall.Stdin))
		fmt.Println()
		p1 := strings.TrimSpace(string(b1))
		p2 := strings.TrimSpace(string(b2))
		if p1 == "" {
			fmt.Println("密码不能为空，请重新输入。")
			continue
		}
		if len(p1) < 6 {
			fmt.Println("密码长度不能少于6位，请重新输入。")
			continue
		}
		if p1 != p2 {
			fmt.Println("两次输入的密码不一致，请重新输入。")
			continue
		}
		password = p1
		break
	}

	// 创建用户
	hash, err := adminService.HashPassword(password)
	if err != nil {
		return fmt.Errorf("生成密码哈希失败: %w", err)
	}
	user := adminModel.AdminUser{Username: username, PasswordHash: hash, Role: "admin"}
	if err := db.Create(&user).Error; err != nil {
		return fmt.Errorf("创建管理员失败: %w", err)
	}

	fmt.Printf("本地管理员创建成功: %s\n", username)
	return nil
}

func main() {
	// 定义命令行参数
	var (
		dev  = flag.Bool("dev", false, "开发模式，使用SQLite")
		help = flag.Bool("help", false, "显示帮助信息")
	)

	// 解析命令行参数
	flag.Parse()

	// 处理help参数
	if *help {
		showUsage()
		return
	}

	// 设置开发模式环境变量（必须在配置加载之前设置）
	if *dev {
		os.Setenv("UNIAUTH_MODE", "dev")
	}

	// 获取子命令
	args := flag.Args()

	// 处理子命令
	if len(args) == 0 {
		// 默认显示帮助信息
		showUsage()
		return
	}

	switch args[0] {
	case "server":
		// 启动服务器
		if err := startServer(); err != nil {
			log.Fatal("启动服务器失败:", err)
		}

	case "init":
		// 初始化策略
		if len(args) < 2 {
			log.Fatal("错误: init命令需要指定CSV文件路径\n用法: ./uniauth init <csv_file>")
		}

		csvFile := args[1]
		if err := initPolicies(csvFile); err != nil {
			log.Fatal("初始化策略失败:", err)
		}

	case "create-admin":
		if err := createAdminInteractive(); err != nil {
			log.Fatal("创建管理员失败:", err)
		}

	case "help":
		showUsage()

	default:
		log.Fatalf("未知命令: %s\n使用 './uniauth help' 查看可用命令", args[0])
	}
}
