package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) ResetBalance(ctx context.Context, req *v1.ResetBalanceReq) (res *v1.ResetBalanceRes, err error) {
	res = &v1.ResetBalanceRes{}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var quotaPool *v1.QuotaPoolItem
		if err := dao.QuotapoolQuotaPool.Ctx(ctx).
			Where("quota_pool_name = ?", req.QuotaPool).
			LockUpdate().
			Scan(&quotaPool); err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		}
		if quotaPool == nil {
			return gerror.Newf("该配额池不存在，请重新检查：%v", req.QuotaPool)
		}

		quotaPool.RemainingQuota = quotaPool.RegularQuota
		quotaPool.LastResetAt = gtime.Now()

		if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
			WherePri(quotaPool.Id).
			Data(quotaPool).
			Update(); err != nil {
			return gerror.Wrap(err, "更新配额池信息失败")
		}
		return nil
	})
	if err != nil {
		return
	}

	res.OK = true
	return
}
