package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/robfig/cron/v3"
)

/*
实际执行任务前的预检查，检查余额池可不可以使用这个产品。

会做以下几件事：

1. 先校验 用户有没有权限使用这个配额池
  - 检查配额池是否存在
  - 检查配额池是否被禁用
  - 检查用户有没有权限使用这个配额池

2. 检查权限，能否使用
  - 检查配额池有没有权限使用对应的服务和产品

3. 检查余额。

  - 懒刷新余额池

  - 检查余额是否充足

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
	// 找到余额池
	var quotaPool *entity.QuotapoolQuotaPool
	err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPool).Scan(&quotaPool)
	if err != nil {
		err = gerror.Wrap(err, "查询配额池信息失败")
		return
	}

	// 懒刷新
	sched, err := cron.ParseStandard(quotaPool.CronCycle)
	if err != nil {
		err = gerror.Wrapf(err, "配额池 cron_cycle 解析失败。cron_cycle: %v", quotaPool.CronCycle)
		return
	}
	if gtime.Now().Time.After(sched.Next(quotaPool.LastResetAt.Time)) {
		quotaPool.RemainingQuota = quotaPool.RegularQuota
	}

	// 检查余额是否充足
	// 重新获取一次
	err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPool).Scan(&quotaPool)
	if err != nil {
		err = gerror.Wrap(err, "第二次查询配额池信息失败")
		return
	}
	if quotaPool.RemainingQuota.Add(quotaPool.ExtraQuota).IsPositive() {
		res.Ok = true
	} else {
		res.Ok = false
	}
	return
}
