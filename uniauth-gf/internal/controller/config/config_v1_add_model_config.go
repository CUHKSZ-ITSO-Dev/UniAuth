package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) AddModelConfig(ctx context.Context, req *v1.AddModelConfigReq) (res *v1.AddModelConfigRes, err error) {
	if _, err = dao.ConfigSingleModelApproach.Ctx(ctx).Where("approach_name = ?", req.ApproachName).Data(req).Insert(); err != nil {
		return nil, gerror.Wrap(err, "新增模型配置失败")
	}
	return &v1.AddModelConfigRes{
		OK: true,
	}, nil
}
