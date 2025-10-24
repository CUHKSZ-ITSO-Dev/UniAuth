package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetProductUsageChart(ctx context.Context, req *v1.GetProductUsageChartReq) (res *v1.GetProductUsageChartRes, err error) {
	return c.billingService.GetProductUsageChart(ctx, req)
}
