package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) AddModelConfig(ctx context.Context, req *v1.AddModelConfigReq) (res *v1.AddModelConfigRes, err error) {
	res = &v1.AddModelConfigRes{}

	err = dao.ConfigSingleModelApproach.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 唯一键：approach_name
		_, err := dao.ConfigSingleModelApproach.Ctx(ctx).
			Where("approach_name = ?", req.ApproachName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "检查是否已存在失败")
		}
		now := gtime.Now()
		data := &entity.ConfigSingleModelApproach{
			ApproachName: req.ApproachName,
			Pricing:      req.Pricing,
			Discount:     req.Discount,
			ClientType:   req.ClientType,
			ClientArgs:   req.ClientArgs,
			RequestArgs:  req.RequestArgs,
			Servicewares: req.Servicewares,
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if _, err := dao.ConfigSingleModelApproach.Ctx(ctx).Data(data).Insert(); err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "新增模型配置失败")
		}
		return nil
	})
	if err != nil {
		return
	}
	res.OK = true
	return
}
