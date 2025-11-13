package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetActiveUserDetail(ctx context.Context, req *v1.GetActiveUserDetailReq) (res *v1.GetActiveUserDetailRes, err error) {
	return c.billingService.GetActiveUserDetail(ctx, req)
}
