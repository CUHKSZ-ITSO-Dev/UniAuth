package auth

import (
    "context"
    v1 "uniauth-gf/api/auth/v1"
)

// AdminGetAllQuotaPools is an alias of GetAllQuotaPools, exposing /admin/quotaPools/all with identical behavior.
func (c *ControllerV1) AdminGetAllQuotaPools(ctx context.Context, req *v1.AdminGetAllQuotaPoolsReq) (res *v1.GetAllQuotaPoolsRes, err error) {
    return c.GetAllQuotaPools(ctx, &v1.GetAllQuotaPoolsReq{Upn: req.Upn})
}

