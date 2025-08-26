package app

import (
	rbacService "uniauth/internal/modules/rbac/service"
	userService "uniauth/internal/modules/user/service"
	billingService "uniauth/internal/modules/billing/service"
)

type App struct {
	AuthService          *rbacService.AuthService
	AbstractGroupService *rbacService.AbstractGroupService
	ChatService          *billingService.ChatService
	UserInfoService      *userService.UserInfoService
}

func NewApp(
	authService *rbacService.AuthService,
	abstractGroupService *rbacService.AbstractGroupService,
	chatService *billingService.ChatService,
	userInfoService *userService.UserInfoService) *App {
	return &App{
		AuthService:          authService,
		AbstractGroupService: abstractGroupService,
		ChatService:          chatService,
		UserInfoService:      userInfoService,
	}
}
