package service

import (
	"errors"
	"time"

	adminModel "uniauth/internal/modules/admin/model"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AdminAuthService struct {
	DB        *gorm.DB
	JWTSecret []byte
}

type AdminClaims struct {
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func NewAdminAuthService(db *gorm.DB, jwtSecret string) *AdminAuthService {
	return &AdminAuthService{DB: db, JWTSecret: []byte(jwtSecret)}
}

func (s *AdminAuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (s *AdminAuthService) VerifyPassword(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func (s *AdminAuthService) EnsureDefaultAdmin(username, password string) error {
	var user adminModel.AdminUser
	if err := s.DB.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			hash, err := s.HashPassword(password)
			if err != nil {
				return err
			}
			user = adminModel.AdminUser{Username: username, PasswordHash: hash, Role: "admin"}
			return s.DB.Create(&user).Error
		}
		return err
	}
	return nil
}

func (s *AdminAuthService) Authenticate(username, password string) (*adminModel.AdminUser, error) {
	var user adminModel.AdminUser
	if err := s.DB.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	if err := s.VerifyPassword(user.PasswordHash, password); err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AdminAuthService) GenerateToken(user *adminModel.AdminUser, ttl time.Duration) (string, error) {
	claims := AdminClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.JWTSecret)
}

func (s *AdminAuthService) ParseToken(tokenString string) (*AdminClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		return s.JWTSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*AdminClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("invalid token")
}
