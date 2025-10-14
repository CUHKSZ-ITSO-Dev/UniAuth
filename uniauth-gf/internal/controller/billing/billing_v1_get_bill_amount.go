package billing

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetBillAmount(ctx context.Context, req *v1.GetBillAmountReq) (res *v1.GetBillAmountRes, err error) {
	// 初始化响应对象
	res = &v1.GetBillAmountRes{}

	baseModel := dao.BillingCostRecords.Ctx(ctx).
		OmitEmpty().
		WhereIn("svc", req.Svc).
		WhereIn("product", req.Product).
		WhereGTE("created_at", req.StartTime).
		WhereLTE("created_at", req.EndTime)

	if req.Type == "upn" {
		// upn 模式查询
		if len(req.Upns) == 0 {
			return nil, gerror.New("UPNs 不能传空")
		}

		model := baseModel.Clone().
			WhereIn("upn", req.Upns).
			WhereIn("source", req.QuotaPools)

		// 总金额（打折后）
		costValue, err := model.Sum("cost")
		if err != nil {
			return nil, gerror.Wrapf(err, "[UPN 模式] 计算总金额失败")
		}

		// 原始总金额（打折前）
		originalCostValue, err := model.Sum("original_cost")
		if err != nil {
			return nil, gerror.Wrapf(err, "[UPN 模式] 计算原始总金额失败")
		}

		cost := decimal.NewFromFloat(costValue)
		originalCost := decimal.NewFromFloat(originalCostValue)

		res.Amount = cost
		res.OriginalAmount = originalCost
	} else {
		// Quota Pool 模式查询
		if len(req.QuotaPools) == 0 {
			return nil, gerror.New("QuotaPools 不能传空")
		}

		model := baseModel.Clone().
			WhereIn("source", req.QuotaPools)

		if len(req.Upns) > 0 {
			model = model.WhereIn("upn", req.Upns)
		}

		// 总金额（打折后）
		costValue, err := model.Sum("cost")
		if err != nil {
			return nil, gerror.Wrapf(err, "[Quota Pool 模式] 计算总金额失败")
		}

		// 原始总金额（打折前）
		originalCostValue, err := model.Sum("original_cost")
		if err != nil {
			return nil, gerror.Wrapf(err, "[Quota Pool 模式] 计算原始总金额失败")
		}

		cost := decimal.NewFromFloat(costValue)
		originalCost := decimal.NewFromFloat(originalCostValue)

		res.Amount = cost
		res.OriginalAmount = originalCost
	}

	return res, nil
}
