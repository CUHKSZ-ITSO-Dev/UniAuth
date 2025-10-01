package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error) {
	var quotaPool entity.QuotapoolQuotaPool
	if err := dao.QuotapoolQuotaPool.Ctx(ctx).
		Where(dao.QuotapoolQuotaPool.Columns().QuotaPoolName, req.QuotaPoolName).
		Scan(&quotaPool); err != nil {
		return nil, gerror.Wrap(err, "查询配额池失败")
	}

	if quotaPool.QuotaPoolName == "" {
		return nil, gerror.Newf("配额池 '%s' 不存在", req.QuotaPoolName)
	}

	return &quotaPool, nil
}
