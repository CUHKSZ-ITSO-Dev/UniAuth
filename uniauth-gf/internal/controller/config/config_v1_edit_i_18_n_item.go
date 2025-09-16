package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) EditI18nItem(ctx context.Context, req *v1.EditI18nItemReq) (res *v1.EditI18nItemRes, err error) {
	// 直接执行更新操作，然后检查受影响的行数
	result, err := dao.ConfigInternationalization.Ctx(ctx).
		Where("lang_code = ? AND key = ?", req.Lang, req.Key).
		Data(map[string]any{
			"value":      req.Value,
			"updated_at": gtime.Now(),
		}).Update()

	if err != nil {
		return &v1.EditI18nItemRes{OK: false}, gerror.Wrap(err, "更新国际化配置失败")
	}

	// 检查受影响的行数，如果为0则说明记录不存在
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return &v1.EditI18nItemRes{OK: false}, gerror.Wrap(err, "获取更新结果失败")
	}

	if rowsAffected == 0 {
		return &v1.EditI18nItemRes{OK: false}, gerror.Newf("国际化配置不存在: lang=%s, key=%s", req.Lang, req.Key)
	}

	return &v1.EditI18nItemRes{OK: true}, nil
}
