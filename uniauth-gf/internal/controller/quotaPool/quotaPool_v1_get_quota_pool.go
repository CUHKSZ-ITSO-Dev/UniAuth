package quotaPool

import (
	"context"
	"math"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error) {
	res = &v1.GetQuotaPoolRes{}
	var total int
	if err := dao.QuotapoolQuotaPool.Ctx(ctx).
		OmitEmptyWhere().
		Where("quota_pool_name", req.QuotaPoolName).
		OrderDesc(dao.QuotapoolQuotaPool.Columns().CreatedAt).
		Offset((req.Page - 1) * req.PageSize).
		Limit(req.PageSize).
		ScanAndCount(&res.Items, &total, false); err != nil {
		return nil, gerror.Wrap(err, "查询配额池列表失败")
	}
	res.Total = total
	res.Page = req.Page
	res.PageSize = req.PageSize
	res.TotalPages = int(math.Ceil(float64(total) / float64(req.PageSize)))
	return res, nil
}
