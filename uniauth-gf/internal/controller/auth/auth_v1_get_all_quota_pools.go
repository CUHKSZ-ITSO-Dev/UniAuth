package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"
	quotaPoolApi "uniauth-gf/api/quotaPool/v1"
	quotaPoolCtrl "uniauth-gf/internal/controller/quotaPool"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) GetAllQuotaPools(ctx context.Context, req *v1.GetAllQuotaPoolsReq) (res *v1.GetAllQuotaPoolsRes, err error) {
	res = &v1.GetAllQuotaPoolsRes{
		QuotaPools:  []string{},
		PersonalMap: g.MapStrBool{},
	}
	quotaPools, err := e.GetRolesForUser(req.Upn)
	if err != nil {
		return nil, gerror.Wrap(err, "获取用户所有角色时发生内部错误")
	}
	for _, quotaPool := range quotaPools {
		quotaPoolResp, err := quotaPoolCtrl.NewV1().GetQuotaPool(ctx, &quotaPoolApi.GetQuotaPoolReq{
			QuotaPoolName: quotaPool,
		})
		if err != nil {
			return nil, gerror.Wrap(err, "获取配额池时发生内部错误")
		}
		if len(quotaPoolResp.Items) == 0 {
			return nil, gerror.Newf("没有找到这个配额池：%v", quotaPool)
		}
		if !quotaPoolResp.Items[0].Disabled {
			res.QuotaPools = append(res.QuotaPools, quotaPool)
			res.PersonalMap[quotaPool] = quotaPoolResp.Items[0].Personal
		}
	}
	return
}
