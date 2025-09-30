package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) RefreshUsersOfQuotaPool(ctx context.Context, req *v1.RefreshUsersOfQuotaPoolReq) (res *v1.RefreshUsersOfQuotaPoolRes, err error) {
	if err = quotaPool.UpdateQuotaPoolsUsersInCasbin(ctx, req.QPNameList); err != nil {
		return nil, gerror.Wrap(err, "刷新配额池的用户时发生内部错误")
	}
	res = &v1.RefreshUsersOfQuotaPoolRes{
		OK: true,
	}
	return
}
