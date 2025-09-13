package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error) {
	res = &v1.GetQuotaPoolRes{}
	var items []entity.QuotapoolQuotaPool
	mdl := dao.QuotapoolQuotaPool.Ctx(ctx)
	if req.QuotaPoolName != "" {
		mdl = mdl.Where("quota_pool_name = ?", req.QuotaPoolName)
	}
	err = mdl.Scan(&items)
	if err != nil {
		err = gerror.Wrap(err, "查询配额池失败")
		return
	}
	format := func(t *gtime.Time) string {
		if t == nil {
			return ""
		}
		return t.Local().Format("2006-01-02 15:04:05")
	}
	res.Items = make([]v1.QuotaPoolItem, 0, len(items))
	for _, it := range items {
		res.Items = append(res.Items, v1.QuotaPoolItem{
			Id:             it.Id,
			QuotaPoolName:  it.QuotaPoolName,
			CronCycle:      it.CronCycle,
			RegularQuota:   it.RegularQuota,
			RemainingQuota: it.RemainingQuota,
			LastResetAt:    format(it.LastResetAt),
			ExtraQuota:     it.ExtraQuota,
			Personal:       it.Personal,
			Disabled:       it.Disabled,
			UserinfosRules: it.UserinfosRules,
			CreatedAt:      format(it.CreatedAt),
			UpdatedAt:      format(it.UpdatedAt),
		})
	}
	return
}
