package app

import (
	"uniauth/internal/services"
)

type App struct {
	AuthService          *services.AuthService
	AbstractGroupService *services.AbstractGroupService
	ChatService          *services.ChatService
	UserInfoService      *services.UserInfoService
}

func NewApp(
	authService *services.AuthService,
	abstractGroupService *services.AbstractGroupService,
	chatService *services.ChatService,
	userInfoService *services.UserInfoService) *App {
	return &App{
		AuthService:          authService,
		AbstractGroupService: abstractGroupService,
		ChatService:          chatService,
		UserInfoService:      userInfoService,
	}
}
