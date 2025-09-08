package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllUsersForQuotaPool(ctx context.Context, req *v1.GetAllUsersForQuotaPoolReq) (res *v1.GetAllUsersForQuotaPoolRes, err error) {
	res = &v1.GetAllUsersForQuotaPoolRes{}
	res.Users = e.GetUsersForRoleInDomain(req.QuotaPool, req.Dom)
	return
}
