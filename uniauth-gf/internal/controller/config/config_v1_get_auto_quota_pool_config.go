package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetAutoQuotaPoolConfig(ctx context.Context, req *v1.GetAutoQuotaPoolConfigReq) (res *v1.GetAutoQuotaPoolConfigRes, err error) {
	res = &v1.GetAutoQuotaPoolConfigRes{}
	var items []v1.AutoQuotaPoolItem
	if err = dao.ConfigAutoQuotaPool.Ctx(ctx).Scan(&items); err != nil {
		err = gerror.Wrap(err, "查询自动配额池规则失败")
		return
	}
	res.Items = items
	return
}
