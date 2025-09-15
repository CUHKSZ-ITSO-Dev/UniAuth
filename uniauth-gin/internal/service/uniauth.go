package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"uniauth-gin/internal/config"
	"uniauth-gin/internal/model"

	"github.com/go-resty/resty/v2"
)

type UniAuthService struct {
	client *resty.Client
}

func NewUniAuthService() *UniAuthService {
	client := resty.New()
	client.SetBaseURL(config.AppConfig.UniAuth.BaseURL)
	client.SetTimeout(time.Duration(config.AppConfig.UniAuth.Timeout) * time.Second)

	return &UniAuthService{client: client}
}

// GetUserInfo 根据UPN获取用户信息
func (u *UniAuthService) GetUserInfo(ctx context.Context, upn string) (*model.User, error) {
	resp, err := u.client.R().
		SetContext(ctx).
		SetPathParam("upn", upn).
		Get("/userinfos/getOne/{upn}")

	if err != nil {
		return nil, fmt.Errorf("请求用户信息失败: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("获取用户信息失败，状态码: %d, 响应: %s", resp.StatusCode(), string(resp.Body()))
	}

	var result struct {
		Code int         `json:"code"`
		Data *model.User `json:"data"`
		Msg  string      `json:"msg"`
	}

	err = json.Unmarshal(resp.Body(), &result)
	if err != nil {
		return nil, fmt.Errorf("解析用户信息响应失败: %w", err)
	}

	if result.Code != 0 {
		return nil, fmt.Errorf("获取用户信息失败: %s", result.Msg)
	}

	return result.Data, nil
}

// CheckUserPermission 检查用户权限
func (u *UniAuthService) CheckUserPermission(ctx context.Context, upn, quotaPool, dom, svc, product, act string) (bool, error) {
	resp, err := u.client.R().
		SetContext(ctx).
		SetBody(map[string]string{
			"upn":       upn,
			"quotaPool": quotaPool,
			"dom":       dom,
			"svc":       svc,
			"product":   product,
			"act":       act,
		}).
		Post("/auth/chatPreCheckOneStop")

	if err != nil {
		return false, fmt.Errorf("权限检查请求失败: %w", err)
	}

	if resp.StatusCode() != 200 {
		return false, fmt.Errorf("权限检查失败，状态码: %d", resp.StatusCode())
	}

	var result struct {
		Code int `json:"code"`
		Data struct {
			Ok bool `json:"ok"`
		} `json:"data"`
		Msg string `json:"msg"`
	}

	err = json.Unmarshal(resp.Body(), &result)
	if err != nil {
		return false, fmt.Errorf("解析权限检查响应失败: %w", err)
	}

	if result.Code != 0 {
		return false, fmt.Errorf("权限检查失败: %s", result.Msg)
	}

	return result.Data.Ok, nil
}
