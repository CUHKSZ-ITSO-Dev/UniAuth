package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetActiveUsersNum(ctx context.Context, req *v1.GetActiveUsersNumReq) (res *v1.GetActiveUsersNumRes, err error) {
	return c.billingService.GetActiveUsersNum(ctx, req)
}
