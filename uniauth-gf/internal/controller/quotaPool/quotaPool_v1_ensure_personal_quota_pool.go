package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) EnsurePersonalQuotaPool(ctx context.Context, req *v1.EnsurePersonalQuotaPoolReq) (res *v1.EnsurePersonalQuotaPoolRes, err error) {
	res = &v1.EnsurePersonalQuotaPoolRes{}

	_, _, havePersonal, err := quotaPool.GetAllEnabledQuotaPoolsForUser(ctx, req.Upn)
	if err != nil {
		return nil, gerror.Wrap(err, "获取用户所有配额池时发生内部错误")
	}
	if havePersonal {
		res.OK = true
		return
	}

	// 从 AutoQuotaPoolConfig 里面找到合适的配置，并进行新建一个个人配额池
	var autoQPConfig *entity.ConfigAutoQuotaPool
	if err = dao.ConfigAutoQuotaPool.Ctx(ctx).OrderAsc("priority").Where("? = ANY(upns_cache)", req.Upn).Limit(1).Scan(&autoQPConfig); err != nil {
		err = gerror.Wrap(err, "获取自动配额池配置时发生内部错误")
		return
	}
	if autoQPConfig == nil {
		err = gerror.New("没有找到合适的自动配额池配置")
		return
	}
	if _, err = c.NewQuotaPool(ctx, &v1.NewQuotaPoolReq{
		QuotaPoolName: "personal-" + req.Upn,
		CronCycle:     autoQPConfig.CronCycle,
		RegularQuota:  autoQPConfig.RegularQuota,
		Personal:      true,
		Disabled:      !autoQPConfig.Enabled,
		UserinfosRules: gjson.New(g.Map{
			"field": "upn",
			"op":    "eq",
			"value": req.Upn,
		}),
	}); err != nil {
		err = gerror.Wrap(err, "新建个人配额池时发生内部错误")
		return
	}
	res.OK = true
	res.IsNew = true
	return
}
