package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"

	"uniauth-gf/internal/service/exchangeRate"
)

func (c *ControllerV1) BillingRecord(ctx context.Context, req *v1.BillingRecordReq) (res *v1.BillingRecordRes, err error) {
	// model := dao.BillingCostRecords.Ctx(ctx)
	res = &v1.BillingRecordRes{}
	// 算钱
	_, err = exchangeRate.GetExchangeRate(ctx, "USD", "CNY")
	if err != nil {
		return
	}

	// 记录
	// 扣钱
	return
}
