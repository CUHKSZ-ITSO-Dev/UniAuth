package middleware

import (
	"net/http"
	"strings"

	adminService "uniauth/internal/modules/admin/service"

	"github.com/gin-gonic/gin"
)

func JWTAdminAuth(auth *adminService.AdminAuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := auth.ParseToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set("adminUserId", claims.UserID)
		c.Set("adminUsername", claims.Username)
		c.Set("adminRole", claims.Role)
		c.Next()
	}
}
