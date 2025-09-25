package config

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetI18nConfig(ctx context.Context, req *v1.GetI18nConfigReq) (res *v1.GetI18nConfigRes, err error) {
	type i18nItem struct {
		Key  string `json:"key"`
		ZhCn string `json:"zh_cn"`
		EnUs string `json:"en_us"`
	}

	var items []i18nItem
	if err = dao.ConfigInternationalization.Ctx(ctx).Fields("key, zh_cn, en_us").Scan(&items); err != nil {
		return nil, gerror.Wrap(err, "查询i18n配置失败")
	}

	// 创建空的JSON对象
	jsonObj := gjson.New(g.Map{})

	for _, item := range items {
		var value string
		switch req.Lang {
		case "zh-CN":
			value = item.ZhCn
		case "en-US":
			value = item.EnUs
		default:
			return nil, gerror.Newf("不支持的语言代码: %s", req.Lang)
		}

		if err = jsonObj.Set(item.Key, value); err != nil {
			return nil, gerror.Wrapf(err, "设置配置项失败: %s", item.Key)
		}
	}

	return &v1.GetI18nConfigRes{
		Langpack: jsonObj,
	}, nil
}
