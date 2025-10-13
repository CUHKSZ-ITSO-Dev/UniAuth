package billing

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetBillAmount(ctx context.Context, req *v1.GetBillAmountReq) (res *v1.GetBillAmountRes, err error) {
	// 调用GetBillRecord接口获取账单数据
	recordsPri, err := c.GetBillRecord(ctx, &v1.GetBillRecordReq{
		Type:       req.Type,
		Upns:       req.Upns,
		QuotaPools: req.QuotaPools,
		Svc:        req.Svc,
		Product:    req.Product,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Order:      "asc", // 排序对计算总额没有影响
	})
	if err != nil {
		return nil, gerror.Wrap(err, "复用获取账单记录接口时失败")
	}

	// 获取所有记录
	records := recordsPri.Records
	records.SetViolenceCheck(true) // 开启冲突检测，避免键名中有.的时候提取错误

	// 确定要处理的目标列表
	var targets []string
	if req.Type == "upn" {
		targets = req.Upns
	} else {
		targets = req.QuotaPools
	}

	// 计算总金额
	totalAmount := decimal.Zero
	for _, target := range targets {
		for _, record := range records.GetJsons(target) {
			if cost, err := decimal.NewFromString(record.Get("cost").String()); err == nil && cost.IsPositive() {
				totalAmount = totalAmount.Add(cost)
			} else if err != nil {
				return nil, gerror.Wrap(err, "转换 Decimal 失败")
			}
		}
	}

	// 返回结果
	return &v1.GetBillAmountRes{
		Amount: totalAmount.String(),
	}, nil
}
