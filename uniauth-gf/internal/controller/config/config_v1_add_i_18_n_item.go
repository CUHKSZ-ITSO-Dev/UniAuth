package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) AddI18nItem(ctx context.Context, req *v1.AddI18nItemReq) (res *v1.AddI18nItemRes, err error) {
	err = dao.ConfigInternationalization.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先检查是否已存在相同的 lang_code 和 key 组合
		var existingConfig *entity.ConfigInternationalization
		err := dao.ConfigInternationalization.Ctx(ctx).
			Where("lang_code = ? AND key = ?", req.Lang, req.Key).
			LockUpdate().Scan(&existingConfig)
		if err != nil {
			return gerror.Wrap(err, "查询国际化配置失败")
		}

		if existingConfig != nil {
			return gerror.Newf("国际化配置已存在: lang=%s, key=%s", req.Lang, req.Key)
		}

		// 添加新的国际化配置
		_, err = dao.ConfigInternationalization.Ctx(ctx).Data(&entity.ConfigInternationalization{
			LangCode:    req.Lang,
			Key:         req.Key,
			Value:       req.Value,
			Description: req.Description,
		}).Insert()

		if err != nil {
			return gerror.Wrap(err, "添加国际化配置失败")
		}

		return nil
	})

	if err != nil {
		return nil, gerror.Wrap(err, "添加国际化配置失败")
	}

	return &v1.AddI18nItemRes{OK: true}, nil
}
