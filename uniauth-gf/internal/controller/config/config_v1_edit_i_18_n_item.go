package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) EditI18nItem(ctx context.Context, req *v1.EditI18nItemReq) (res *v1.EditI18nItemRes, err error) {
	// 使用事务来处理编辑操作
	err = dao.ConfigInternationalization.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先检查记录是否存在并加锁，防止并发修改
		var existingConfig *entity.ConfigInternationalization
		err := dao.ConfigInternationalization.Ctx(ctx).
			Where("lang_code = ? AND key = ?", req.Lang, req.Key).
			LockUpdate().Scan(&existingConfig)
		if err != nil {
			return gerror.Wrap(err, "查询国际化配置失败")
		}

		if existingConfig == nil {
			return gerror.Newf("国际化配置不存在: lang=%s, key=%s", req.Lang, req.Key)
		}

		// 执行更新操作
		_, err = dao.ConfigInternationalization.Ctx(ctx).
			Where("lang_code = ? AND key = ?", req.Lang, req.Key).
			Data(g.Map{
				"value":      req.Value,
				"updated_at": gtime.Now(),
			}).Update()

		if err != nil {
			return gerror.Wrap(err, "更新国际化配置失败")
		}

		return nil
	})

	if err != nil {
		return &v1.EditI18nItemRes{OK: false}, err
	}

	return &v1.EditI18nItemRes{OK: true}, nil
}
