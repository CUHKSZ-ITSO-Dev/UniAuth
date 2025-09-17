package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"

	"github.com/robfig/cron/v3"
)

func (c *ControllerV1) NewQuotaPool(ctx context.Context, req *v1.NewQuotaPoolReq) (res *v1.NewQuotaPoolRes, err error) {
	res = &v1.NewQuotaPoolRes{}
	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		count, err := dao.QuotapoolQuotaPool.Ctx(ctx).
			Where("quota_pool_name = ?", req.QuotaPoolName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.Wrap(err, "检查配额池是否已存在失败")
		}
		if count > 0 {
			return gerror.Newf("配额池已存在: %s", req.QuotaPoolName)
		}

		now := gtime.Now()
		data := &entity.QuotapoolQuotaPool{
			QuotaPoolName:  req.QuotaPoolName,
			CronCycle:      req.CronCycle,
			RegularQuota:   req.RegularQuota,
			RemainingQuota: req.RegularQuota,
			LastResetAt:    now,
			ExtraQuota:     req.ExtraQuota,
			Personal:       req.Personal,
			Disabled:       req.Disabled,
			UserinfosRules: req.UserinfosRules,
			CreatedAt:      now,
			UpdatedAt:      now,
		}

		if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).Data(data).Insert(); err != nil {
			return gerror.Wrap(err, "创建配额池失败")
		}
		return nil
	})
	if err != nil {
		return
	}
	res.OK = true
	return
}
