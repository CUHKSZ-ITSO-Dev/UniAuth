package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"

	"uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) EnsurePersonalQuotaPool(ctx context.Context, req *v1.EnsurePersonalQuotaPoolReq) (res *v1.EnsurePersonalQuotaPoolRes, err error) {
	res = &v1.EnsurePersonalQuotaPoolRes{}

	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		_, _, havePersonal, err := quotaPool.GetAllEnabledQuotaPoolsForUser(ctx, req.Upn)
		if err != nil {
			return gerror.Wrap(err, "获取用户所有配额池时发生内部错误")
		}
		if havePersonal {
			res.IsNew = false
			return nil
		}

		res.IsNew = true
		// 从 AutoQuotaPoolConfig 里面找到合适的配置，并进行新建一个个人配额池
		var autoQPConfig *entity.ConfigAutoQuotaPool
		if err = dao.ConfigAutoQuotaPool.Ctx(ctx).OrderAsc("priority").Where("? = ANY(upns_cache)", req.Upn).Limit(1).LockUpdate().Scan(&autoQPConfig); err != nil {
			return gerror.Wrap(err, "获取自动配额池配置时发生内部错误")
		}
		if autoQPConfig == nil {
			return gerror.New("该用户没有个人配额池，但没有找到合适的自动配额池配置")
		}
		data := &entity.QuotapoolQuotaPool{
			QuotaPoolName:  "personal-" + req.Upn,
			CronCycle:      autoQPConfig.CronCycle,
			RegularQuota:   autoQPConfig.RegularQuota,
			RemainingQuota: autoQPConfig.RegularQuota,
			LastResetAt:    gtime.Now(),
			ExtraQuota:     decimal.Zero,
			Personal:       true,
			Disabled:       !autoQPConfig.Enabled,
			UserinfosRules: gjson.New(g.Map{
				"field": "upn",
				"op":    "eq",
				"value": req.Upn,
			}),
		}
		if err = quotaPool.Create(ctx, data); err != nil {
			return gerror.Wrap(err, "新建个人配额池时发生内部错误")
		}
		return nil
	})
	if err != nil {
		return nil, gerror.Wrap(err, "Ensure 配额池事务发生错误")
	}
	res.OK = true
	return
}
