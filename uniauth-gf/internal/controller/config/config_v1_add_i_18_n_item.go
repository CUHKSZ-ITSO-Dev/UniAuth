package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) AddI18nItem(ctx context.Context, req *v1.AddI18nItemReq) (res *v1.AddI18nItemRes, err error) {
	// 检查是否已存在相同的 lang_code 和 key 组合
	count, err := dao.ConfigInternationalization.Ctx(ctx).
		Where("lang_code = ? AND key = ?", req.Lang, req.Key).Count()
	if err != nil {
		return &v1.AddI18nItemRes{OK: false}, gerror.Wrap(err, "查询国际化配置失败")
	}

	if count > 0 {
		return &v1.AddI18nItemRes{OK: false}, gerror.Newf("国际化配置已存在: lang=%s, key=%s", req.Lang, req.Key)
	}

	// 插入新的国际化配置
	_, err = dao.ConfigInternationalization.Ctx(ctx).Data(&entity.ConfigInternationalization{
		LangCode:  req.Lang,
		Key:       req.Key,
		Value:     req.Value,
		CreatedAt: gtime.Now(),
		UpdatedAt: gtime.Now(),
	}).Insert()

	if err != nil {
		return &v1.AddI18nItemRes{OK: false}, gerror.Wrap(err, "插入国际化配置失败")
	}
	return &v1.AddI18nItemRes{OK: true}, nil
}
