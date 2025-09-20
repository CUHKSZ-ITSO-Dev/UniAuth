package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) DeleteModelConfig(ctx context.Context, req *v1.DeleteModelConfigReq) (res *v1.DeleteModelConfigRes, err error) {
	res = &v1.DeleteModelConfigRes{}

	err = dao.ConfigSingleModelApproach.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var configSingleModelApproach *entity.ConfigSingleModelApproach
		err = dao.ConfigSingleModelApproach.Ctx(ctx).Where("approach_name = ?", req.ApproachName).LockUpdate().Scan(&configSingleModelApproach)
		if err != nil {
			return gerror.Wrap(err, "查询模型配置信息失败")
		}
		if configSingleModelApproach == nil {
			return gerror.Newf("该模型配置不存在，请重新检查：%v", req.ApproachName)
		}

		if _, err := dao.ConfigSingleModelApproach.Ctx(ctx).
			Where("approach_name = ?", req.ApproachName).
			Delete(); err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "删除模型配置失败")
		}
		return nil
	})
	if err != nil {
		return
	}
	res.OK = true
	return
}
