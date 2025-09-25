package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetModelConfig(ctx context.Context, req *v1.GetModelConfigReq) (res *v1.GetModelConfigRes, err error) {
	res = &v1.GetModelConfigRes{
		Items: []v1.ModelConfigItem{},
	}
	if err = dao.ConfigSingleModelApproach.Ctx(ctx).Scan(&res.Items); err != nil {
		err = gerror.Wrap(err, "查询模型配置失败")
		return
	}
	return
}
