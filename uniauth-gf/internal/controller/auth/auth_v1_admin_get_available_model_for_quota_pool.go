package auth

import (
    "context"
    v1 "uniauth-gf/api/auth/v1"
)

// AdminGetAvailableModelForQuotaPool is an alias of GetAvailableModelForQuotaPool, exposing /admin/chat/quotaPools/models.
func (c *ControllerV1) AdminGetAvailableModelForQuotaPool(ctx context.Context, req *v1.AdminGetAvailableModelForQuotaPoolReq) (res *v1.GetAvailableModelForQuotaPoolRes, err error) {
    return c.GetAvailableModelForQuotaPool(ctx, &v1.GetAvailableModelForQuotaPoolReq{QuotaPool: req.QuotaPool})
}

