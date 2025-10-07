package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/robfig/cron/v3"
	"github.com/shopspring/decimal"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

// ResetBalance 重置指定配额池的余额为定期配额，并更新时间。
// resetAnyway 为可选参数，默认值为 false。为 true 时强制更新余额。
func ResetBalance(ctx context.Context, quotaPoolName string, resetAnyway bool) (remainingQuota decimal.Decimal, err error) {
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
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

		// 懒刷新
		sched, err := cron.ParseStandard(quotaPool.CronCycle)
		if err != nil {
			return gerror.Wrapf(err, "配额池 cron_cycle 解析失败。cron_cycle: %v", quotaPool.CronCycle)
		}
		nextResetAt := sched.Next(quotaPool.LastResetAt.Local().Time)
		if gtime.Now().Time.After(nextResetAt) || resetAnyway {
			quotaPool.RemainingQuota = quotaPool.RegularQuota
			quotaPool.LastResetAt = gtime.Now()
			if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
				WherePri(quotaPool.QuotaPoolName).
				Data(quotaPool).
				Update(); err != nil {
				return gerror.Wrap(err, "更新配额池信息失败")
			}
		}
		remainingQuota = quotaPool.RemainingQuota
		return nil
	})
	if err != nil {
		return decimal.Zero, gerror.Wrap(err, "重置配额池余额事务失败")
	}
	return
}
