package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) NewQuotaPool(ctx context.Context, req *v1.NewQuotaPoolReq) (res *v1.NewQuotaPoolRes, err error) {
	data := &entity.QuotapoolQuotaPool{
		QuotaPoolName:  req.QuotaPoolName,
		CronCycle:      req.CronCycle,
		RegularQuota:   req.RegularQuota,
		RemainingQuota: req.RegularQuota, // 需要初始化剩余配额为定期配额
		LastResetAt:    gtime.Now(),
		ExtraQuota:     req.ExtraQuota,
		Personal:       req.Personal,
		Disabled:       req.Disabled,
		UserinfosRules: req.UserinfosRules,
	}
	if err = quotaPool.Create(ctx, data); err != nil {
		return nil, gerror.Wrap(err, "新增配额池失败")
	}
	return &v1.NewQuotaPoolRes{
		OK: true,
	}, nil
}
