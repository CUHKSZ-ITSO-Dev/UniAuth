package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error) {
	res = &v1.GetQuotaPoolRes{
		Items: []v1.QuotaPoolItem{},
	}
	if err := dao.QuotapoolQuotaPool.Ctx(ctx).OmitEmpty().Where("quota_pool_name = ?", req.QuotaPoolName).Scan(&res.Items); err != nil {
		return nil, gerror.Wrap(err, "查询配额池失败")
	}
	return
}
