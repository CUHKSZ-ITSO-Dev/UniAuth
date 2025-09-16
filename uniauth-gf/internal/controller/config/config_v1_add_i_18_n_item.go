package config

import (
	"context"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	v1 "uniauth-gf/api/config/v1"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) AddI18nItem(ctx context.Context, req *v1.AddI18nItemReq) (res *v1.AddI18nItemRes, err error) {
	res = &v1.AddI18nItemRes{OK: false}
	// 使用事务
	err = g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 检查是否已存在
		exists, err := dao.ConfigInternationalization.Ctx(ctx).TX(tx).
			Where("lang_code = ? AND key = ?", req.Lang, req.Key).
			Count()
		if err != nil {
			return err
		}
		if exists > 0 {
			return gerror.New("该语言和键已存在")
		}
		// 插入新数据
		data := &entity.ConfigInternationalization{
			LangCode: req.Lang,
			Key:      req.Key,
			Value:    req.Value,
		}
		_, err = dao.ConfigInternationalization.Ctx(ctx).TX(tx).Data(data).Insert()
		if err != nil {
			return err
		}
		res.OK = true
		return nil
	})
	return res, err
}
