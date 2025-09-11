package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetAllUsersForQuotaPool(ctx context.Context, req *v1.GetAllUsersForQuotaPoolReq) (res *v1.GetAllUsersForQuotaPoolRes, err error) {
	res = &v1.GetAllUsersForQuotaPoolRes{}
	res.Users, err = e.GetUsersForRole(req.QuotaPool)
	if err != nil {
		err = gerror.Wrap(err, "Casbin 查询拥有该 QuotaPool 的用户时发生内部错误")
	}
	return
}
