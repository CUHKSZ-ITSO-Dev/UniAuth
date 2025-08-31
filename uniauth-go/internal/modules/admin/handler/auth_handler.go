package handler

import (
	"net/http"
	"time"

	adminService "uniauth/internal/modules/admin/service"

	"github.com/gin-gonic/gin"
)

type AdminAuthHandler struct {
	Service *adminService.AdminAuthService
}

func NewAdminAuthHandler(service *adminService.AdminAuthService) *AdminAuthHandler {
	return &AdminAuthHandler{Service: service}
}

func (h *AdminAuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credentials"})
		return
	}
	user, err := h.Service.Authenticate(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	token, err := h.Service.GenerateToken(user, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token})
}

func (h *AdminAuthHandler) Me(c *gin.Context) {
	username, _ := c.Get("adminUsername")
	role, _ := c.Get("adminRole")
	c.JSON(http.StatusOK, gin.H{
		"username": username,
		"role":     role,
	})
}
