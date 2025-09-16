package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error) {
	res = &v1.GetQuotaPoolRes{}
	var items []v1.QuotaPoolItem
	mdl := dao.QuotapoolQuotaPool.Ctx(ctx)
	if req.QuotaPoolName != "" {
		mdl = mdl.Where("quota_pool_name = ?", req.QuotaPoolName)
	}
	err = mdl.Scan(&items)
	if err != nil {
		err = gerror.Wrap(err, "查询配额池失败")
		return
	}
	res.Items = make([]v1.QuotaPoolItem, 0, len(items))
	for _, it := range items {
		res.Items = append(res.Items, it)
	}
	return
}
