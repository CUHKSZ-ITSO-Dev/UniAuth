package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) EditModelConfig(ctx context.Context, req *v1.EditModelConfigReq) (res *v1.EditModelConfigRes, err error) {
	res = &v1.EditModelConfigRes{}

	err = dao.ConfigSingleModelApproach.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var configSingleModelApproach *entity.ConfigSingleModelApproach
		err = dao.ConfigSingleModelApproach.Ctx(ctx).Where("approach_name = ?", req.ApproachName).LockUpdate().Scan(&configSingleModelApproach)
		if err != nil {
			return gerror.Wrap(err, "查询模型配置信息失败")
		}
		if configSingleModelApproach == nil {
			return gerror.Newf("该模型配置不存在，请重新检查：%v", req.ApproachName)
		}

		data := &entity.ConfigSingleModelApproach{
			ApproachName: req.ApproachName,
			Pricing:      req.Pricing,
			ClientArgs:   req.ClientArgs,
			RequestArgs:  req.RequestArgs,
			Servicewares: req.Servicewares,
		}

		// 安全地处理可能为 nil 的指针字段
		// 请求检查映射才可以判断是否有该字段
		if _, ok := g.RequestFromCtx(ctx).GetRequestMap()["discount"]; ok {
			data.Discount = *req.Discount
		}
		if _, ok := g.RequestFromCtx(ctx).GetRequestMap()["clientType"]; ok {
			data.ClientType = *req.ClientType
		}

		if _, err := dao.ConfigSingleModelApproach.Ctx(ctx).
			Where("approach_name = ?", req.ApproachName).
			Data(data).Update(); err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "更新模型配置失败")
		}
		return nil
	})
	if err != nil {
		err = gerror.Wrap(err, "更新模型配置失败")
		return
	}
	res.OK = true
	return
}
