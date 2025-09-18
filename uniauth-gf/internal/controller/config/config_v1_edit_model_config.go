package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) EditModelConfig(ctx context.Context, req *v1.EditModelConfigReq) (res *v1.EditModelConfigRes, err error) {
	res = &v1.EditModelConfigRes{}

	err = dao.ConfigSingleModelApproach.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		cnt, err := dao.ConfigSingleModelApproach.Ctx(ctx).
			Where("approach_name = ?", req.ApproachName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "检查是否存在失败")
		}
		if cnt == 0 {
			return gerror.NewCodef(gcode.CodeNotFound, "模型不存在: %s", req.ApproachName)
		}

		data := g.Map{
			"updated_at": gtime.Now(),
		}
		if req.Pricing != nil {
			data["pricing"] = req.Pricing
		}
		if !req.Discount.IsZero() {
			data["discount"] = req.Discount
		}
		if req.ClientType != "" {
			data["client_type"] = req.ClientType
		}
		if req.ClientArgs != nil {
			data["client_args"] = req.ClientArgs
		}
		if req.RequestArgs != nil {
			data["request_args"] = req.RequestArgs
		}
		if req.Servicewares != nil {
			data["servicewares"] = req.Servicewares
		}

		if len(data) == 1 { // 只有 updated_at
			return nil
		}

		if _, err := dao.ConfigSingleModelApproach.Ctx(ctx).
			Where("approach_name = ?", req.ApproachName).
			Data(data).Update(); err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "更新模型配置失败")
		}
		return nil
	})
	if err != nil {
		return
	}
	res.OK = true
	return
}
