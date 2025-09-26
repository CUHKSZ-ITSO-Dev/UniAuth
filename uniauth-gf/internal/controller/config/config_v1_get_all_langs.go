package config

import (
	"context"

	v1 "uniauth-gf/api/config/v1"
)

func (c *ControllerV1) GetAllLangs(ctx context.Context, req *v1.GetAllLangsReq) (res *v1.GetAllLangsRes, err error) {
	// 因为目前仅支持中文和英文两种语言，所以直接返回固定值
	return &v1.GetAllLangsRes{
		Langs: []string{"zh-CN", "en-US"},
	}, nil

}
