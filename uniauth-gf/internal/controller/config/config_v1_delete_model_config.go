package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DeleteModelConfig(ctx context.Context, req *v1.DeleteModelConfigReq) (res *v1.DeleteModelConfigRes, err error) {
	res = &v1.DeleteModelConfigRes{}

	// 支持 query 或 body 传参
	r := g.RequestFromCtx(ctx)
	approachName := r.GetQuery("approachName").String()
	if approachName == "" {
		approachName = req.ApproachName
	}
	if approachName == "" {
		err = gerror.NewCodef(gcode.CodeMissingParameter, "approachName 必填")
		return
	}

	err = dao.ConfigSingleModelApproach.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		cnt, err := dao.ConfigSingleModelApproach.Ctx(ctx).
			Where("approach_name = ?", approachName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "检查是否存在失败")
		}
		if cnt == 0 {
			return gerror.NewCodef(gcode.CodeNotFound, "模型不存在: %s", approachName)
		}

		if _, err := dao.ConfigSingleModelApproach.Ctx(ctx).
			Where("approach_name = ?", approachName).
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
