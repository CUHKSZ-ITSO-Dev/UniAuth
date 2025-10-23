package billing

import (
	"context"
	"time"
	"uniauth-gf/internal/dao"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"
)

func (c *ControllerV1) GetProductConsumption(ctx context.Context, req *v1.GetProductConsumptionReq) (res *v1.GetProductConsumptionRes, err error) {
	// 计算日期范围
	startDate := time.Now().AddDate(0, 0, -req.NDays)
	endDate := time.Now()

	if req.NDays == 0 {
		startDate = time.Now().AddDate(0, 0, -7)
	}
	// 构建查询
	query := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", startDate).
		Where("created_at <= ?", endDate)

	// 过滤条件
	if req.Service != "" {
		query = query.Where("svc = ?", req.Service)
	}
	if req.QuotaPool != "" {
		query = query.Where("source = ?", req.QuotaPool)
	}
	if req.Product != "" {
		query = query.Where("product = ?", req.Product)
	}
	var consumption []v1.ConsumptionItem
	err = query.Fields("created_at::date as date, product, svc as service, source as quotaPool, SUM(cost) as cost, COUNT(*) as calls").
		Group("created_at::date, product, svc, source").
		Order("date DESC, cost DESC").
		Scan(&consumption)

	if err != nil {
		return nil, gerror.Wrap(err, "查询消费数据失败")
	}

	//在同一个查询中获取详细数据和总统计
	var totalStats struct {
		TotalCalls int             `json:"totalCalls"`
		TotalCost  decimal.Decimal `json:"totalCost"`
	}

	// 使用相同的查询条件获取总统计
	totalQuery := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", startDate).
		Where("created_at <= ?", endDate)

	// 添加相同的过滤条件
	if req.Service != "" {
		totalQuery = totalQuery.Where("svc = ?", req.Service)
	}
	if req.QuotaPool != "" {
		totalQuery = totalQuery.Where("source = ?", req.QuotaPool)
	}
	if req.Product != "" {
		totalQuery = totalQuery.Where("product = ?", req.Product)
	}

	err = totalQuery.Fields("COUNT(*) as totalCalls, SUM(cost) as totalCost").
		Scan(&totalStats)

	if err != nil {
		return nil, gerror.Wrap(err, "查询总统计失败")
	}

	// 构建响应
	res = &v1.GetProductConsumptionRes{
		StartDate:   startDate.Format("2006-01-02"),
		EndDate:     endDate.Format("2006-01-02"),
		Consumption: consumption,
		TotalCalls:  totalStats.TotalCalls,
		TotalCost:   totalStats.TotalCost,
	}

	return res, nil
}
