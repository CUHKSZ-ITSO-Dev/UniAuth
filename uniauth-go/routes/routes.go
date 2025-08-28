package routes

import (
	"uniauth/internal/app"
	rbacHandler "uniauth/internal/modules/rbac/handler"
	rbacService "uniauth/internal/modules/rbac/service"
	billingHandler "uniauth/internal/modules/billing/handler"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine, app *app.App) {
	// 创建处理器
	authHandler := rbacHandler.NewAuthHandler(app.AuthService)
	adminHandler := rbacHandler.NewAdminHandler(app.AuthService, app.UserInfoService)
	auditHandler := rbacHandler.NewAuditHandler(app.AuthService)
	ruleManagementHandler := rbacHandler.NewRuleManagementHandler(app.AuthService, auditHandler)
	documentService := rbacService.NewDocumentService(app.AuthService)
	abstractGroupHandler := rbacHandler.NewAbstractGroupHandler(app.AbstractGroupService)

	// 创建对话计费服务和处理器
	chatHandler := billingHandler.NewChatHandler(app.ChatService)

	// 初始化审计日志表
	auditHandler.InitAuditTable()

	// 权限检查
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/check", authHandler.CheckPermission)
		auth.GET("/user/:upn/accessible-docs", documentService.GetUserAccessibleDocs)
		auth.GET("/user/:upn/groups", authHandler.GetUserGroups)
	}

	// 管理接口
	admin := r.Group("/api/v1/admin")
	{
		admin.POST("/toggle-permission", authHandler.TogglePermission)
		admin.POST("/permission/toggle", authHandler.TogglePermission)
		admin.GET("/user/:upn/permissions", adminHandler.GetUserPermissionTree)
		admin.GET("/user/:upn/cost-records", adminHandler.GetUserCostRecords)
		admin.POST("/batch/permissions", adminHandler.BatchModifyPermissions)
		admin.GET("/stats", adminHandler.GetStats)
		admin.GET("/users", adminHandler.GetUsers)
		admin.POST("/group/add-user", adminHandler.AddUserToGroup)
		admin.POST("/group/remove-user", adminHandler.RemoveUserFromGroup)
		admin.GET("/rules", ruleManagementHandler.GetAllRules)
		admin.GET("/rules/subject/:subject", ruleManagementHandler.GetRulesForSubject)
		admin.POST("/rules", ruleManagementHandler.AddRule)
		admin.PUT("/rules/:id", ruleManagementHandler.UpdateRule)
		admin.POST("/rules/delete", ruleManagementHandler.DeleteRule)
		admin.POST("/rules/batch", ruleManagementHandler.BatchOperation)
		admin.POST("/rules/import", ruleManagementHandler.ImportRules)
		admin.GET("/export/all-rules", adminHandler.ExportAllRules)
		admin.GET("/audit/logs", auditHandler.GetAuditHistory)
		admin.GET("/audit/stats", auditHandler.GetAuditStats)
		admin.POST("/explain-permission", adminHandler.ExplainPermission)
	}

	// 抽象组管理接口
	abstractGroups := r.Group("/api/v1/admin/abstract-groups")
	{
		abstractGroups.POST("", abstractGroupHandler.CreateAbstractGroup)
		abstractGroups.GET("", abstractGroupHandler.GetAllAbstractGroups)
		abstractGroups.GET("/:id", abstractGroupHandler.GetAbstractGroup)
		abstractGroups.PUT("/:id", abstractGroupHandler.UpdateAbstractGroup)
		abstractGroups.DELETE("/:id", abstractGroupHandler.DeleteAbstractGroup)
		abstractGroups.POST("/:id/sync", abstractGroupHandler.SyncAbstractGroup)
	}

	// 用户组（对话类别）管理接口
	chatCategories := r.Group("/api/v1/admin/chat-categories")
	{
		chatCategories.PUT("/:id", chatHandler.UpdateChatCategory)
	}

	// 对话服务接口
	chat := r.Group("/api/v1/chat")
	{
		chat.POST("/bill", chatHandler.Bill)
		chat.POST("/reset-balance", chatHandler.ResetBalance)
		chat.POST("/ensure-account", chatHandler.EnsureChatAccountExists)
	}
}
