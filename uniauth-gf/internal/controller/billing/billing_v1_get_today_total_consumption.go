package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetTodayTotalConsumption(ctx context.Context, req *v1.GetTodayTotalConsumptionReq) (res *v1.GetTodayTotalConsumptionRes, err error) {
	return c.billingService.GetTodayTotalConsumption(ctx, req)
}
