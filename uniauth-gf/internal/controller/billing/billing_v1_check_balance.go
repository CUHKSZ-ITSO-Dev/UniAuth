package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/robfig/cron/v3"
	"github.com/shopspring/decimal"
)

/*
实际执行任务前的预检查，检查有没有余额。

1. 懒刷新余额池

2. 检查余额是否充足

Field name   | Mandatory? | Allowed values  | Allowed special characters
----------   | ---------- | --------------  | --------------------------
Seconds      | Yes        | 0-59            | * / , -
Minutes      | Yes        | 0-59            | * / , -
Hours        | Yes        | 0-23            | * / , -
Day of month | Yes        | 1-31            | * / , - ?
Month        | Yes        | 1-12 or JAN-DEC | * / , -
Day of week  | Yes        | 0-6 or SUN-SAT  | * / , - ?
*/
func (c *ControllerV1) CheckBalance(ctx context.Context, req *v1.CheckBalanceReq) (res *v1.CheckBalanceRes, err error) {
	res = &v1.CheckBalanceRes{}
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 找到余额池并锁定
		var quotaPool *entity.QuotapoolQuotaPool
		err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPool).LockUpdate().Scan(&quotaPool)
		if err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		}
		if quotaPool == nil {
			return gerror.Newf("该配额池不存在，请重新检查：%v", req.QuotaPool)
		}

		// 懒刷新
		sched, err := cron.ParseStandard(quotaPool.CronCycle)
		if err != nil {
			return gerror.Wrapf(err, "配额池 cron_cycle 解析失败。cron_cycle: %v", quotaPool.CronCycle)
		}
		res.NextResetAt = sched.Next(quotaPool.LastResetAt.Local().Time)
		if gtime.Now().Time.After(res.NextResetAt) {
			quotaPool.RemainingQuota = quotaPool.RegularQuota
			quotaPool.LastResetAt = gtime.Now()
			// 更新并释放锁
			_, err = dao.QuotapoolQuotaPool.Ctx(ctx).WherePri(quotaPool.Id).Data(quotaPool).Update()
			if err != nil {
				return gerror.Wrap(err, "更新配额池信息失败")
			}
		}

		// 检查余额是否充足
		if quotaPool.RemainingQuota.Add(quotaPool.ExtraQuota).IsPositive() {
			res.Ok = true
		} else {
			res.Ok = false
		}
		res.Percentage = quotaPool.RemainingQuota.
			Add(quotaPool.ExtraQuota).
			Div(quotaPool.RegularQuota).
			Mul(decimal.NewFromInt(100)).
			Round(2).
			String() + "%"
		return nil
	})
	if err != nil {
		err = gerror.Wrap(err, "检查余额事务中发生错误")
	}
	return
}
