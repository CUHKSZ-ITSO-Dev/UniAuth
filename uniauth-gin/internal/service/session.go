package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"uniauth-gin/internal/config"
	"uniauth-gin/internal/model"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type SessionService struct {
	rdb *redis.Client
}

func NewSessionService() *SessionService {
	rdb := redis.NewClient(&redis.Options{
		Addr:     config.AppConfig.Redis.Addr,
		Password: config.AppConfig.Redis.Password,
		DB:       config.AppConfig.Redis.DB,
	})

	// 测试连接
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		panic(fmt.Sprintf("Redis连接失败: %v", err))
	}

	return &SessionService{rdb: rdb}
}

// CreateSession 创建新的session
func (s *SessionService) CreateSession(ctx context.Context, user *model.User, ipAddress, userAgent string) (string, error) {
	sessionID := uuid.New().String()

	sessionData := &model.SessionData{
		SessionID: sessionID,
		User:      user,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(time.Duration(config.AppConfig.Session.CookieMaxAge) * time.Second),
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	data, err := json.Marshal(sessionData)
	if err != nil {
		return "", fmt.Errorf("序列化session数据失败: %w", err)
	}

	key := s.getSessionKey(sessionID)
	err = s.rdb.Set(ctx, key, data, time.Duration(config.AppConfig.Session.CookieMaxAge)*time.Second).Err()
	if err != nil {
		return "", fmt.Errorf("保存session到Redis失败: %w", err)
	}

	return sessionID, nil
}

// GetSession 获取session数据
func (s *SessionService) GetSession(ctx context.Context, sessionID string) (*model.SessionData, error) {
	if sessionID == "" {
		return nil, fmt.Errorf("session ID为空")
	}

	key := s.getSessionKey(sessionID)
	data, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("session不存在或已过期")
		}
		return nil, fmt.Errorf("从Redis获取session失败: %w", err)
	}

	var sessionData model.SessionData
	err = json.Unmarshal([]byte(data), &sessionData)
	if err != nil {
		return nil, fmt.Errorf("反序列化session数据失败: %w", err)
	}

	// 检查session是否过期
	if time.Now().After(sessionData.ExpiresAt) {
		s.DeleteSession(ctx, sessionID)
		return nil, fmt.Errorf("session已过期")
	}

	return &sessionData, nil
}

// UpdateSession 更新session
func (s *SessionService) UpdateSession(ctx context.Context, sessionID string, user *model.User) error {
	sessionData, err := s.GetSession(ctx, sessionID)
	if err != nil {
		return err
	}

	sessionData.User = user
	sessionData.LastAccess = time.Now()

	data, err := json.Marshal(sessionData)
	if err != nil {
		return fmt.Errorf("序列化session数据失败: %w", err)
	}

	key := s.getSessionKey(sessionID)
	err = s.rdb.Set(ctx, key, data, time.Duration(config.AppConfig.Session.CookieMaxAge)*time.Second).Err()
	if err != nil {
		return fmt.Errorf("更新session到Redis失败: %w", err)
	}

	return nil
}

// DeleteSession 删除session
func (s *SessionService) DeleteSession(ctx context.Context, sessionID string) error {
	key := s.getSessionKey(sessionID)
	return s.rdb.Del(ctx, key).Err()
}

// RefreshSession 刷新session过期时间
func (s *SessionService) RefreshSession(ctx context.Context, sessionID string) error {
	key := s.getSessionKey(sessionID)
	return s.rdb.Expire(ctx, key, time.Duration(config.AppConfig.Session.CookieMaxAge)*time.Second).Err()
}

// getSessionKey 获取Redis中的session key
func (s *SessionService) getSessionKey(sessionID string) string {
	return fmt.Sprintf("uniauth:session:%s", sessionID)
}
