package billing

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetBillAmount(ctx context.Context, req *v1.GetBillAmountReq) (res *v1.GetBillAmountRes, err error) {
	var cost, originalCost decimal.Decimal
	var result gdb.Record

	if req.Type == "upn" {
		// upn 模式查询
		if len(req.Upn) == 0 {
			return nil, gerror.New("UPN 不能传空")
		}

		result, err = dao.BillingCostRecords.Ctx(ctx).
			OmitEmpty().
			Where("upn", req.Upn).
			WhereIn("svc", req.Svc).
			WhereIn("product", req.Product).
			WhereGTE("created_at", req.StartTime).
			WhereLTE("created_at", req.EndTime).
			Fields("SUM(cost) as cost, SUM(original_cost) as original_cost").
			One()

		if err != nil {
			return nil, gerror.Wrapf(err, "[UPN 模式] 获取 UPN = %s 账单总金额失败", req.Upn)
		}

	} else {
		// Quota Pool 模式查询
		if len(req.QuotaPool) == 0 {
			return nil, gerror.New("QuotaPools 不能传空")
		}

		result, err = dao.BillingCostRecords.Ctx(ctx).
			OmitEmpty().
			Where("source", req.QuotaPool).
			WhereIn("svc", req.Svc).
			WhereIn("product", req.Product).
			WhereGTE("created_at", req.StartTime).
			WhereLTE("created_at", req.EndTime).
			Fields("SUM(cost) as cost, SUM(original_cost) as original_cost").
			One()

		if err != nil {
			return nil, gerror.Wrapf(err, "[Quota Pool 模式] 获取 Source = %s 账单总金额失败", req.QuotaPool)
		}
	}

	costStr := result["cost"].String()
	originalCostStr := result["original_cost"].String()
	cost, _ = decimal.NewFromString(costStr)
	originalCost, _ = decimal.NewFromString(originalCostStr)

	res = &v1.GetBillAmountRes{
		Amount:         cost,
		OriginalAmount: originalCost,
	}

	return res, nil
}
