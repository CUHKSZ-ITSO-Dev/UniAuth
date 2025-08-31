package app

import (
	adminAuthService "uniauth/internal/modules/admin/service"
	billingService "uniauth/internal/modules/billing/service"
	rbacService "uniauth/internal/modules/rbac/service"
	userService "uniauth/internal/modules/user/service"
)

type App struct {
	AuthService          *rbacService.AuthService
	AbstractGroupService *rbacService.AbstractGroupService
	ChatService          *billingService.ChatService
	UserInfoService      *userService.UserInfoService
	AdminAuthService     *adminAuthService.AdminAuthService
}

func NewApp(
	authService *rbacService.AuthService,
	abstractGroupService *rbacService.AbstractGroupService,
	chatService *billingService.ChatService,
	userInfoService *userService.UserInfoService,
	adminAuthService *adminAuthService.AdminAuthService) *App {
	return &App{
		AuthService:          authService,
		AbstractGroupService: abstractGroupService,
		ChatService:          chatService,
		UserInfoService:      userInfoService,
		AdminAuthService:     adminAuthService,
	}
}
