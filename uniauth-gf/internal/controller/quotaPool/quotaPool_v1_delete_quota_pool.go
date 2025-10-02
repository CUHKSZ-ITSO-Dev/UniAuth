package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) DeleteQuotaPool(ctx context.Context, req *v1.DeleteQuotaPoolReq) (res *v1.DeleteQuotaPoolRes, err error) {
	res = &v1.DeleteQuotaPoolRes{}
	if err := quotaPool.Delete(ctx, req.QuotaPoolName); err != nil {
		return nil, gerror.Wrap(err, "删除配额池失败")
	}
	res.OK = true
	return
}
