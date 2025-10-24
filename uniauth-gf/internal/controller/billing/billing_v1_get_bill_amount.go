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
	var keyField string    // 记录主键字段名，upn或source
	var keyValues []string // 记录主键值列表

	switch req.Type {
	case "upn":
		keyField = "upn"
		keyValues = req.Upns
	case "qp":
		keyField = "source"
		keyValues = req.QuotaPools
	default:
		return nil, gerror.New("Type值错误, 只能传入 upn 或 qp")
	}

	if len(keyValues) == 0 {
		return nil, gerror.Wrapf(err, "%s 不能传空", keyField)
	}

	result, err = dao.BillingCostRecords.Ctx(ctx).
		OmitEmpty().
		WhereIn(keyField, keyValues).
		WhereIn("svc", req.Svc).
		WhereIn("product", req.Product).
		WhereGTE("created_at", req.StartTime).
		WhereLTE("created_at", req.EndTime).
		Fields("SUM(cost) as cost, SUM(original_cost) as original_cost").
		One()

	if err != nil {
		return nil, gerror.Wrapf(err, "[%s 模式] 获取 %s = %s 账单总金额失败", req.Type, keyField, keyValues)
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
