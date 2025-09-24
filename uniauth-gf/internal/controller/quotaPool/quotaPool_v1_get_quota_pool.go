package quotaPool

import (
	"context"
	"math"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error) {
	var items []v1.QuotaPoolItem
	var total int
	if err := dao.QuotapoolQuotaPool.Ctx(ctx).
		OmitEmptyWhere().
		Where("quota_pool_name", req.QuotaPoolName).
		OrderDesc(dao.QuotapoolQuotaPool.Columns().CreatedAt).
		Offset((req.Page - 1) * req.PageSize).
		Limit(req.PageSize).
		ScanAndCount(&items, &total, false); err != nil {
		return nil, gerror.Wrap(err, "查询配额池列表失败")
	}
	res = &v1.GetQuotaPoolRes{
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: int(math.Ceil(float64(total) / float64(req.PageSize))),
		Items:      items,
	}
	return res, nil
}
