package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) EditI18nItem(ctx context.Context, req *v1.EditI18nItemReq) (res *v1.EditI18nItemRes, err error) {
	// 检查输入参数，确保key和app_id不为空
	if req.Key == "" {
		return nil, gerror.New("key不能为空")
	}

	if req.AppId == "" {
		return nil, gerror.New("app_id不能为空")
	}

	err = dao.ConfigInternationalization.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先检查记录是否存在
		var existingConfig *entity.ConfigInternationalization
		err := dao.ConfigInternationalization.Ctx(ctx).
			Where("key = ? AND app_id = ?", req.Key, req.AppId).
			LockUpdate().Scan(&existingConfig)
		if err != nil {
			return gerror.Wrap(err, "查询国际化配置失败")
		}

		if existingConfig == nil {
			return gerror.Newf("国际化配置不存在: key=%s, app_id=%s", req.Key, req.AppId)
		}

		// 执行更新操作
		_, err = dao.ConfigInternationalization.Ctx(ctx).
			Where("key = ? AND app_id = ?", req.Key, req.AppId).
			Data(g.Map{
				"zh_cn":       req.ZhCn,
				"en_us":       req.EnUs,
				"description": req.Description,
			}).Update()

		if err != nil {
			return gerror.Wrap(err, "更新国际化配置失败")
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &v1.EditI18nItemRes{OK: true}, nil
}
