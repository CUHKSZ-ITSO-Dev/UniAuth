package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DeleteI18Config(ctx context.Context, req *v1.DeleteI18ConfigReq) (res *v1.DeleteI18ConfigRes, err error) {
	// 使用事务来处理删除操作
	err = dao.ConfigInternationalization.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先检查是否存在该Key的配置并加锁，防止并发修改
		count, err := dao.ConfigInternationalization.Ctx(ctx).
			Where("key = ?", req.Key).LockUpdate().Count()
		if err != nil {
			return gerror.Wrap(err, "查询国际化配置失败")
		}

		if count == 0 {
			return gerror.Newf("国际化配置不存在: key=%s", req.Key)
		}

		// 删除指定Key的所有语言配置
		_, err = dao.ConfigInternationalization.Ctx(ctx).
			Where("key = ?", req.Key).Delete()
		if err != nil {
			return gerror.Wrap(err, "删除国际化配置失败")
		}

		return nil
	})

	if err != nil {
		return &v1.DeleteI18ConfigRes{OK: false}, gerror.Wrap(err, "删除国际化配置失败")
	}

	return &v1.DeleteI18ConfigRes{OK: true}, nil
}
