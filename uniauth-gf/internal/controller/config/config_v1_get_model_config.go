package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetModelConfig(ctx context.Context, req *v1.GetModelConfigReq) (res *v1.GetModelConfigRes, err error) {
	res = &v1.GetModelConfigRes{}
	var items []v1.ModelConfigItem
	if err = dao.ConfigSingleModelApproach.Ctx(ctx).Scan(&items); err != nil {
		err = gerror.WrapCode(gcode.CodeDbOperationError, err, "查询模型配置失败")
		return
	}
	res.Items = items
	return
}
