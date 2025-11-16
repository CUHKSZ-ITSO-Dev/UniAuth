package billing

import (
	"context"
	"time"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"
)

func (c *ControllerV1) GetProductConsumption(ctx context.Context, req *v1.GetProductConsumptionReq) (res *v1.GetProductConsumptionRes, err error) {
	// 使用新的验证和过滤函数
	filteredParams, err := c.billingService.ValidateAndFilterName(req.Service, req.QuotaPool, req.Product)
	if err != nil {
		return nil, err
	}

	// 计算时间范围
	now := time.Now()
	startDate := now.AddDate(0, 0, -req.NDays)
	endDate := now

	if req.NDays == 0 {
		startDate = now.AddDate(0, 0, -7)
	}
	// 构建查询
	query := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", startDate).
		Where("created_at <= ?", endDate)

	// 使用过滤后的参数
	if filteredParams.Service != "" {
		query = query.Where("svc = ?", filteredParams.Service)
	}
	if filteredParams.QuotaPool != "" {
		query = query.Where("source = ?", filteredParams.QuotaPool)
	}
	if filteredParams.Product != "" {
		query = query.Where("product = ?", filteredParams.Product)
	}
	var consumption []v1.ConsumptionItem
	err = query.Fields("DATE(created_at) as date, product, svc as service, source as quotaPool, COALESCE(SUM(cost), 0) as cost, COUNT(*) as calls").
		Group("DATE(created_at), product, svc, source").
		Order("date DESC, cost DESC").
		Scan(&consumption)

	if err != nil {
		return nil, gerror.Wrap(err, "查询消费数据失败")
	}

	// 优化：通过遍历consumption列表计算总计，避免额外的数据库查询
	var totalCalls int
	var totalCost decimal.Decimal

	for _, item := range consumption {
		totalCalls += item.Calls
		totalCost = totalCost.Add(item.Cost)
	}

	// 构建响应 - 显示给用户的日期使用+8时区
	loc, _ := time.LoadLocation("Asia/Shanghai")
	res = &v1.GetProductConsumptionRes{
		StartDate:   startDate.In(loc).Format("2006-01-02"),
		EndDate:     endDate.In(loc).Format("2006-01-02"),
		Consumption: consumption,
		TotalCalls:  totalCalls,
		TotalCost:   totalCost,
	}

	return res, nil
}
