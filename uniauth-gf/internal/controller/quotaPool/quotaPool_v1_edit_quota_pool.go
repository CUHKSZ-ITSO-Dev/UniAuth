package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/robfig/cron/v3"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) EditQuotaPool(ctx context.Context, req *v1.EditQuotaPoolReq) (res *v1.EditQuotaPoolRes, err error) {
	res = &v1.EditQuotaPoolRes{}
	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}

	// 检查目标是否存在
	exists, err := dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).Count()
	if err != nil {
		err = gerror.Wrap(err, "检查配额池是否存在失败")
		return
	}
	if exists == 0 {
		err = gerror.Newf("配额池不存在: %s", req.QuotaPoolName)
		return
	}

	// 执行更新（不改 remaining_quota 与 last_reset_at）
	_, err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).Data(g.Map{
		"cron_cycle":      req.CronCycle,
		"regular_quota":   req.RegularQuota,
		"extra_quota":     req.ExtraQuota,
		"personal":        req.Personal,
		"disabled":        req.Disabled,
		"userinfos_rules": req.UserinfosRules,
		"updated_at":      gtime.Now(),
	}).Update()
	if err != nil {
		err = gerror.Wrap(err, "更新配额池失败")
		return
	}

	res.OK = true
	return
}
