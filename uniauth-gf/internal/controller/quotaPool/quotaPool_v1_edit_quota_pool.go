package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/robfig/cron/v3"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) EditQuotaPool(ctx context.Context, req *v1.EditQuotaPoolReq) (res *v1.EditQuotaPoolRes, err error) {
	res = &v1.EditQuotaPoolRes{}
	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var quotaPool *entity.QuotapoolQuotaPool
		err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).LockUpdate().Scan(&quotaPool)
		if err != nil {
			return gerror.Wrap(err, "查询配额池信息失败")
		}
		if quotaPool == nil {
			return gerror.Newf("该配额池不存在，请重新检查：%v", req.QuotaPoolName)
		}

		// 执行更新（不改 remaining_quota 与 last_reset_at）
		if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
			Where("quota_pool_name = ?", req.QuotaPoolName).
			Data(g.Map{
				"cron_cycle":      req.CronCycle,
				"regular_quota":   req.RegularQuota,
				"extra_quota":     req.ExtraQuota,
				"personal":        req.Personal,
				"disabled":        req.Disabled,
				"userinfos_rules": req.UserinfosRules,
			}).
			Update(); err != nil {
			return gerror.Wrap(err, "更新配额池失败")
		}
		return nil
	})
	if err != nil {
		err = gerror.Wrap(err, "更新配额池失败")
		return
	}

	res.OK = true
	return
}
