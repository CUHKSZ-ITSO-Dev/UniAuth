package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetAllApps(ctx context.Context, req *v1.GetAllAppsReq) (res *v1.GetAllAppsRes, err error) {
	// 查询所有不同的app_id值，初始化空数组避免返回null
	appIds := make([]string, 0)

	// 使用Array方法获取app_id字段的值列表
	results, err := dao.ConfigInternationalization.Ctx(ctx).
		Distinct().
		Fields("app_id").
		Array("app_id")

	if err != nil {
		return nil, gerror.Wrap(err, "查询应用列表失败")
	}

	// 将查询结果转换为字符串数组
	for _, v := range results {
		if appId := v.String(); appId != "" {
			appIds = append(appIds, appId)
		}
	}

	return &v1.GetAllAppsRes{
		Apps: appIds,
	}, nil
}
