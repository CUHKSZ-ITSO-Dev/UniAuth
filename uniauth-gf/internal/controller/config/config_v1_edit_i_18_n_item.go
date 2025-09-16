package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) EditI18nItem(ctx context.Context, req *v1.EditI18nItemReq) (res *v1.EditI18nItemRes, err error) {
	// 检查是否存在相同的 lang_code 和 key 组合
	count, err := dao.ConfigInternationalization.Ctx(ctx).
		Where("lang_code = ? AND key = ?", req.Lang, req.Key).Count()
	if err != nil {
		return &v1.EditI18nItemRes{OK: false}, gerror.Wrap(err, "查询国际化配置失败")
	}

	if count == 0 {
		return &v1.EditI18nItemRes{OK: false}, gerror.Newf("国际化配置不存在: lang=%s, key=%s", req.Lang, req.Key)
	}

	// 更新国际化配置
	_, err = dao.ConfigInternationalization.Ctx(ctx).
		Where("lang_code = ? AND key = ?", req.Lang, req.Key).
		Data(map[string]any{
			"value":      req.Value,
			"updated_at": gtime.Now(),
		}).Update()

	if err != nil {
		return &v1.EditI18nItemRes{OK: false}, gerror.Wrap(err, "更新国际化配置失败")
	}

	return &v1.EditI18nItemRes{OK: true}, nil
}
