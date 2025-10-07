package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	quotaPool "uniauth-gf/internal/service/quotaPool"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) CheckBalance(ctx context.Context, req *v1.CheckBalanceReq) (res *v1.CheckBalanceRes, err error) {
	res = &v1.CheckBalanceRes{}
	balance, err := quotaPool.ResetBalance(ctx, req.QuotaPool, false)
	if err != nil {
		return nil, gerror.Wrap(err, "检查余额事务中发生错误")
	}
	g.Dump(balance)
	if balance.IsPositive() {
		res.Ok = true
	} else {
		res.Ok = false
	}
	return
}
