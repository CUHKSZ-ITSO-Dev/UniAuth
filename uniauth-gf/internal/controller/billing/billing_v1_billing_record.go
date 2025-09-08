package billing

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/service/exchangeRate"
)

func (c *ControllerV1) BillingRecord(ctx context.Context, req *v1.BillingRecordReq) (res *v1.BillingRecordRes, err error) {
	// model := dao.BillingCostRecords.Ctx(ctx)
	res = &v1.BillingRecordRes{}
	// 算钱
	rate, err := exchangeRate.GetExchangeRate(ctx, "USD", "CNY")
	if err != nil {
		return
	}
	cost := req.CNYCost.Add(req.USDCost.Mul(rate))
	
	// 记录
	_, err = dao.BillingCostRecords.Ctx(ctx).Data(g.Map{
		"upn":        req.Upn,
		"svc":        req.Service,
		"product":    req.Product,
		"cost":       cost,
		"plan":       req.Plan,
		"source":     req.Source,
		"remark":     req.Remark.MustToJsonString(),
		"created_at": gtime.Now(),
	}).Insert()
	if err != nil {
		return nil, err
	}
	// 扣钱
	return
}
