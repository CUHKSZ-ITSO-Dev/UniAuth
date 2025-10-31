package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetAllActiveUsers(ctx context.Context, req *v1.GetAllActiveUsersReq) (res *v1.GetAllActiveUsersRes, err error) {
	return c.billingService.GetAllActiveUsers(ctx, req)
}
