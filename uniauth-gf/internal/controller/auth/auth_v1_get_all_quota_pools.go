package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"
	"uniauth-gf/internal/service/quotaPool"

	"github.com/gogf/gf/v2/errors/gerror"
)


func (c *ControllerV1) GetAllQuotaPools(ctx context.Context, req *v1.GetAllQuotaPoolsReq) (res *v1.GetAllQuotaPoolsRes, err error) {
	quotaPools, personalMap, _, err := quotaPool.GetAllEnabledQuotaPoolsForUser(ctx, req.Upn)
	if err != nil {
		return nil, gerror.Wrap(err, "获取用户所有配额池时发生内部错误")
	}
	res = &v1.GetAllQuotaPoolsRes{
		QuotaPools:  quotaPools,
		PersonalMap: personalMap,
	}
	return
}
