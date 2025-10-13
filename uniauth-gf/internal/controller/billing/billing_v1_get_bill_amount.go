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
	res = &v1.GetBillAmountRes{
		Amount:         "0",
		OriginalAmount: "0",
	}

	baseModel := dao.BillingCostRecords.Ctx(ctx).
		OmitEmpty().
		WhereIn("svc", req.Svc).
		WhereIn("product", req.Product).
		WhereGTE("created_at", req.StartTime).
		WhereLTE("created_at", req.EndTime)

	var targets []string
	if req.Type == "upn" {
		// upn 模式查询
		if len(req.Upns) == 0 {
			return nil, gerror.New("UPNs 不能传空")
		}
		targets = req.Upns

		for _, upn := range targets {
			model := baseModel.Clone().
				Where("upn", upn).
				WhereIn("source", req.QuotaPools)

			// 总金额（打折后）
			costValue, err := model.Sum("cost")
			if err != nil {
				return nil, gerror.Wrapf(err, "[UPN 模式] 计算 UPN = %s 的总金额失败", upn)
			}

			// 原始总金额（打折前）
			originalCostValue, err := model.Sum("original_cost")
			if err != nil {
				return nil, gerror.Wrapf(err, "[UPN 模式] 计算 UPN = %s 的原始总金额失败", upn)
			}

			// 累加每个UPN的金额
			cost := decimal.NewFromFloat(costValue)
			totalAmount, _ := decimal.NewFromString(res.Amount)
			res.Amount = totalAmount.Add(cost).String()

			originalCost := decimal.NewFromFloat(originalCostValue)
			totalOriginalAmount, _ := decimal.NewFromString(res.OriginalAmount)
			res.OriginalAmount = totalOriginalAmount.Add(originalCost).String()
		}
	} else {
		// Quota Pool 模式查询
		if len(req.QuotaPools) == 0 {
			return nil, gerror.New("QuotaPools 不能传空")
		}
		targets = req.QuotaPools

		for _, quotaPool := range targets {
			model := baseModel.Clone().
				Where("source", quotaPool)

			if len(req.Upns) > 0 {
				model = model.WhereIn("upn", req.Upns)
			}

			// 总金额（打折后）
			costValue, err := model.Sum("cost")
			if err != nil {
				return nil, gerror.Wrapf(err, "[Quota Pool 模式] 计算 Source = %s 的总金额失败", quotaPool)
			}

			// 原始总金额（打折前）
			originalCostValue, err := model.Sum("original_cost")
			if err != nil {
				return nil, gerror.Wrapf(err, "[Quota Pool 模式] 计算 Source = %s 的原始总金额失败", quotaPool)
			}

			// 累加每个配额池的金额
			cost := decimal.NewFromFloat(costValue)
			totalAmount, _ := decimal.NewFromString(res.Amount)
			res.Amount = totalAmount.Add(cost).String()

			originalCost := decimal.NewFromFloat(originalCostValue)
			totalOriginalAmount, _ := decimal.NewFromString(res.OriginalAmount)
			res.OriginalAmount = totalOriginalAmount.Add(originalCost).String()
		}
	}

	return res, nil
}
