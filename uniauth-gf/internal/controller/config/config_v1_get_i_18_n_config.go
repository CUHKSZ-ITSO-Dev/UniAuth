package config

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) GetI18nConfig(ctx context.Context, req *v1.GetI18nConfigReq) (res *v1.GetI18nConfigRes, err error) {
	// 查询指定语言的所有配置项
	var items []entity.ConfigInternationalization
	if err = dao.ConfigInternationalization.Ctx(ctx).Where("lang_code = ?", req.Lang).Scan(&items); err != nil {
		return nil, gerror.Wrap(err, "查询i18n配置失败")
	}

	// 创建空的JSON对象
	jsonObj := gjson.New(map[string]any{})

	// 使用gjson的Set方法直接设置嵌套值
	for _, item := range items {
		// gjson.Set 原生支持点分隔的路径来设置嵌套值
		if err = jsonObj.Set(item.Key, item.Value); err != nil {
			return nil, gerror.Wrapf(err, "设置配置项失败: %s", item.Key)
		}
	}

	return &v1.GetI18nConfigRes{
		Json: jsonObj,
	}, nil
}
