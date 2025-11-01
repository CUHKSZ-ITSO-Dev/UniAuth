package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetAllApps(ctx context.Context, req *v1.GetAllAppsReq) (res *v1.GetAllAppsRes, err error) {
	// 查询所有不同的app_id值
	var appIds []string
	err = dao.ConfigInternationalization.Ctx(ctx).
		Fields("DISTINCT app_id").
		Scan(&appIds)
	if err != nil {
		return nil, gerror.Wrap(err, "查询应用列表失败")
	}

	return &v1.GetAllAppsRes{
		Apps: appIds,
	}, nil
}
