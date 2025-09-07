package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllQuotaPools(ctx context.Context, req *v1.GetAllQuotaPoolsReq) (res *v1.GetAllQuotaPoolsRes, err error) {
	res = &v1.GetAllQuotaPoolsRes{}
	res.QuotaPools = []string{req.Upn}
	return
}
