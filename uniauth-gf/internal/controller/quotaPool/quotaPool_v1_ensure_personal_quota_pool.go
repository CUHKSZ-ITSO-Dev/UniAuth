package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) EnsurePersonalQuotaPool(ctx context.Context, req *v1.EnsurePersonalQuotaPoolReq) (res *v1.EnsurePersonalQuotaPoolRes, err error) {
	_, _, havePersonal, err := quotaPool.GetAllEnabledQuotaPoolsForUser(ctx, req.Upn)
	if err != nil {
		return nil, gerror.Wrap(err, "获取用户所有配额池时发生内部错误")
	}
	if havePersonal {
		return &v1.EnsurePersonalQuotaPoolRes{OK: true, IsNew: false}, nil
	}
	return &v1.EnsurePersonalQuotaPoolRes{OK: true, IsNew: true}, nil
}
