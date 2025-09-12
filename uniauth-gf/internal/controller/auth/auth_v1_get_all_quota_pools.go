package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetAllQuotaPools(ctx context.Context, req *v1.GetAllQuotaPoolsReq) (res *v1.GetAllQuotaPoolsRes, err error) {
	res = &v1.GetAllQuotaPoolsRes{}
	res.QuotaPools, err = e.GetRolesForUser(req.Upn)
	if err != nil {
		err = gerror.Wrap(err, "获取用户所有角色时发生内部错误")
	}
	return
}
