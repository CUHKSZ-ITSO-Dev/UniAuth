package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) DeleteI18Config(ctx context.Context, req *v1.DeleteI18ConfigReq) (res *v1.DeleteI18ConfigRes, err error) {
	// 检查输入参数，确保key和app_id不为空
	if req.Key == "" {
		return nil, gerror.New("key不能为空")
	}

	if req.AppId == "" {
		return nil, gerror.New("app_id不能为空")
	}

	// 使用事务来处理删除操作
	err = dao.ConfigInternationalization.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先检查是否存在该Key和AppId的配置并加锁，防止并发修改
		var existingConfig *entity.ConfigInternationalization
		err := dao.ConfigInternationalization.Ctx(ctx).
			Where("key = ? AND app_id = ?", req.Key, req.AppId).LockUpdate().Scan(&existingConfig)
		if err != nil {
			return gerror.Wrap(err, "查询国际化配置失败")
		}

		if existingConfig == nil {
			return gerror.Newf("国际化配置不存在: key=%s, app_id=%s", req.Key, req.AppId)
		}

		// 删除指定Key和AppId的配置
		_, err = dao.ConfigInternationalization.Ctx(ctx).
			Where("key = ? AND app_id = ?", req.Key, req.AppId).Delete()
		if err != nil {
			return gerror.Wrap(err, "删除国际化配置失败")
		}

		return nil
	})

	if err != nil {
		return nil, gerror.Wrap(err, "删除国际化配置失败")
	}

	return &v1.DeleteI18ConfigRes{OK: true}, nil
}
