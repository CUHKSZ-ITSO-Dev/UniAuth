package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

// ResetBalance 重置指定配额池的余额为定期配额，并更新时间。
func ResetBalance(ctx context.Context, quotaPoolName string) error {
	return dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var quotaPool *entity.QuotapoolQuotaPool
		if err := dao.QuotapoolQuotaPool.Ctx(ctx).
			Where("quota_pool_name = ?", quotaPoolName).
			LockUpdate().
			Scan(&quotaPool); err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		}
		if quotaPool == nil {
			return gerror.Newf("该配额池不存在，请重新检查：%v", quotaPoolName)
		}

		quotaPool.RemainingQuota = quotaPool.RegularQuota
		quotaPool.LastResetAt = gtime.Now()

		if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
			WherePri(quotaPool.QuotaPoolName).
			Data(quotaPool).
			Update(); err != nil {
			return gerror.Wrap(err, "更新配额池信息失败")
		}
		return nil
	})
}
