package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	svc "uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) ResetBalance(ctx context.Context, req *v1.ResetBalanceReq) (res *v1.ResetBalanceRes, err error) {
	res = &v1.ResetBalanceRes{}

	_, err = svc.ResetBalance(ctx, req.QuotaPool, true)
	if err != nil {
		err = gerror.Wrap(err, "重置配额池余额失败")
		return
	}

	res.OK = true
	return
}
