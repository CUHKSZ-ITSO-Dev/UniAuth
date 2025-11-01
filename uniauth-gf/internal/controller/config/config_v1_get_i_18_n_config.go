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
	// 检查输入参数，确保app_id不为空
	if req.AppId == "" {
		return nil, gerror.New("app_id不能为空")
	}

	type i18nItem struct {
		Key  string `json:"key"`
		ZhCn string `json:"zh_cn"`
		EnUs string `json:"en_us"`
	}

	var items []i18nItem
	if err = dao.ConfigInternationalization.Ctx(ctx).
		Fields("key, zh_cn, en_us").
		Where("app_id", req.AppId).
		Scan(&items); err != nil {
		return nil, gerror.Wrap(err, "查询i18n配置失败")
	}

	var jsonObj *gjson.Json

	// 根据Type参数决定返回格式
	switch req.Type {
	case "path":
		// 路径格式：{"pages.login.submit": "登录", ...}
		pathData := g.Map{}
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
			pathData[item.Key] = value
		}
		jsonObj = gjson.New(pathData)

	case "tree":
		// 嵌套格式：{"pages": {"login": {"submit": "登录"}}}
		jsonObj = gjson.New(g.Map{})
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

	default:
		return nil, gerror.Newf("不支持的返回类型: %s", req.Type)
	}

	return &v1.GetI18nConfigRes{
		Langpack: jsonObj,
	}, nil
}
