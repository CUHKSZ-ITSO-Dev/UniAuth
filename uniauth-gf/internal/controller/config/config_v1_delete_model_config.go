package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DeleteModelConfig(ctx context.Context, req *v1.DeleteModelConfigReq) (res *v1.DeleteModelConfigRes, err error) {
	res = &v1.DeleteModelConfigRes{}
	if sqlRes, err := dao.ConfigSingleModelApproach.Ctx(ctx).Where("approach_name = ?", req.ApproachName).Delete(); err != nil {
		return nil, gerror.WrapCode(gcode.CodeDbOperationError, err, "删除模型配置失败")
	} else if eftRow, err := sqlRes.RowsAffected(); eftRow == 0 {
		return nil, gerror.New("找不到模型配置。数据库影响行数为0。")
	} else if err != nil {
		return nil, gerror.WrapCode(gcode.CodeDbOperationError, err, "检查模型配置删除情况失败")
	}
	res.OK = true
	return
}
