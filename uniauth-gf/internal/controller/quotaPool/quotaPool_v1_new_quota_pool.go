package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"

	"github.com/robfig/cron/v3"
)

func (c *ControllerV1) NewQuotaPool(ctx context.Context, req *v1.NewQuotaPoolReq) (res *v1.NewQuotaPoolRes, err error) {
	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}
	data := g.Map{
		"quota_pool_name": req.QuotaPoolName,
		"cron_cycle":      req.CronCycle,
		"regular_quota":   req.RegularQuota,
		"remaining_quota": req.RegularQuota, // 需要初始化剩余配额为定期配额
		"extra_quota":     req.ExtraQuota,
		"personal":        req.Personal,
		"disabled":        req.Disabled,
		"userinfos_rules": req.UserinfosRules,
	}
	if _, err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.QuotaPoolName).Data(data).Insert(); err != nil {
		return nil, gerror.Wrap(err, "新增配额池失败")
	}
	return &v1.NewQuotaPoolRes{
		OK: true,
	}, nil
}
