package billing

import (
	"context"
	"strings"
	"time"
	"uniauth-gf/internal/dao"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"
)

func (c *ControllerV1) GetProductConsumption(ctx context.Context, req *v1.GetProductConsumptionReq) (res *v1.GetProductConsumptionRes, err error) {
	// 使用新的验证和过滤函数
	filteredParams, err := c.validateAndFilterName(req.Service, req.QuotaPool, req.Product)
	if err != nil {
		return nil, err
	}

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
	err = query.Fields("DATE(created_at) as date, product, svc as service, source as quotaPool, SUM(cost) as cost, COUNT(*) as calls").
		Group("DATE(created_at), product, svc, source").
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

	// 使用过滤后的参数
	if filteredParams.Service != "" {
		totalQuery = totalQuery.Where("svc = ?", filteredParams.Service)
	}
	if filteredParams.QuotaPool != "" {
		totalQuery = totalQuery.Where("source = ?", filteredParams.QuotaPool)
	}
	if filteredParams.Product != "" {
		totalQuery = totalQuery.Where("product = ?", filteredParams.Product)
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

// validateAndFilterName 验证和过滤服务名称、配额池和产品名称
func (c *ControllerV1) validateAndFilterName(service string, quotaPool string, product string) (v1.ConsumptionItem, error) {
	// 处理 "all" 关键字，转换为空字符串
	if strings.EqualFold(service, "all") {
		service = ""
	}
	if strings.EqualFold(quotaPool, "all") {
		quotaPool = ""
	}
	if strings.EqualFold(product, "all") {
		product = ""
	}

	// 输入验证
	service = strings.TrimSpace(service)
	quotaPool = strings.TrimSpace(quotaPool)
	product = strings.TrimSpace(product)

	// 验证长度
	if len(service) > 50 {
		return v1.ConsumptionItem{}, gerror.New("服务名称长度不能超过50字符")
	}
	if len(quotaPool) > 50 {
		return v1.ConsumptionItem{}, gerror.New("配额池名称长度不能超过50字符")
	}
	if len(product) > 50 {
		return v1.ConsumptionItem{}, gerror.New("产品名称长度不能超过50字符")
	}

	// 检查非法字符
	if strings.ContainsAny(service, "';\"\\") {
		return v1.ConsumptionItem{}, gerror.New("服务名称包含非法字符")
	}
	if strings.ContainsAny(quotaPool, "';\"\\") {
		return v1.ConsumptionItem{}, gerror.New("配额池名称包含非法字符")
	}
	if strings.ContainsAny(product, "';\"\\") {
		return v1.ConsumptionItem{}, gerror.New("产品名称包含非法字符")
	}

	return v1.ConsumptionItem{
		Service:   service,
		QuotaPool: quotaPool,
		Product:   product,
	}, nil
}
