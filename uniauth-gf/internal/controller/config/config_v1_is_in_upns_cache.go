package config

import (
	"context"
	"slices"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) IsInUpnsCache(ctx context.Context, req *v1.IsInUpnsCacheReq) (res *v1.IsInUpnsCacheRes, err error) {
	var autoQuotaPool entity.ConfigAutoQuotaPool
	if err = dao.ConfigAutoQuotaPool.Ctx(ctx).Where("rule_name = ?", req.RuleName).Scan(&autoQuotaPool); err != nil {
		err = gerror.Wrap(err, "查询自动配额池规则失败")
		return
	}
	res = &v1.IsInUpnsCacheRes{
		IsInUpnsCache: slices.Contains(autoQuotaPool.UpnsCache, req.Upn),
	}
	return
}
