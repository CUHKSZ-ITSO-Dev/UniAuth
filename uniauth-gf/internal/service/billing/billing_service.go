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

// BillingService 计费服务
type BillingService struct{}

// NewBillingService 创建计费服务实例
func NewBillingService() *BillingService {
	return &BillingService{}
}

// ValidateAndFilterName 验证和过滤服务名称、配额池和产品名称（可复用）
func (s *BillingService) ValidateAndFilterName(service string, quotaPool string, product string) (v1.ConsumptionItem, error) {
	// 处理 "all" 关键字，转换为空字符串
	if service == "all" {
		service = ""
	}
	if quotaPool == "all" {
		quotaPool = ""
	}
	if product == "all" {
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

// ValidateAndFilterService 验证和过滤服务名称数组（可复用）
func (s *BillingService) ValidateAndFilterService(services []string) ([]string, error) {
	// 如果为空或nil，返回空数组（表示查询全部）
	if len(services) == 0 {
		return []string{}, nil
	}

	// 过滤和验证每个服务名称
	filteredServices := make([]string, 0, len(services))
	serviceMap := make(map[string]bool) // 用于去重

	for _, service := range services {
		// 处理 "all" 关键字，如果遇到 "all" 则返回空数组（查询全部）
		if service == "all" {
			return []string{}, nil
		}

		// 输入验证
		service = strings.TrimSpace(service)
		if service == "" {
			continue // 跳过空字符串
		}

		// 验证长度
		if len(service) > 50 {
			return nil, gerror.New("服务名称长度不能超过50字符")
		}

		// 检查非法字符
		if strings.ContainsAny(service, "';\"\\") {
			return nil, gerror.Newf("服务名称 '%s' 包含非法字符", service)
		}

		// 去重
		if !serviceMap[service] {
			serviceMap[service] = true
			filteredServices = append(filteredServices, service)
		}
	}

	return filteredServices, nil
}

// GetServiceDisplayName 获取服务显示名称（可复用）
func (s *BillingService) GetServiceDisplayName(services []string) string {
	if len(services) == 0 {
		return "全部服务"
	}
	if len(services) == 1 {
		return services[0]
	}
	// 多个服务时，返回 "服务1, 服务2, ..." 格式
	return strings.Join(services, ", ")
}

// GetTodayAndYesterdayCost 获取今日和昨日消费数据（可复用）
func (s *BillingService) GetTodayAndYesterdayCost(ctx context.Context, today, yesterday time.Time, services []string) (todayCost, yesterdayCost decimal.Decimal, err error) {
	// 使用精确的decimal类型处理财务数据，避免浮点数精度问题
	type CostResult struct {
		Date string          `json:"date"`
		Cost decimal.Decimal `json:"cost"`
	}

	var results []CostResult

	// 构建基础查询
	query := dao.BillingCostRecords.Ctx(ctx).
		Fields("DATE(created_at) as date, COALESCE(SUM(cost), 0) as cost").
		Where("created_at BETWEEN ? AND ?", yesterday, today.AddDate(0, 0, 1)).
		Group("DATE(created_at)")

	// 如果指定了服务列表，使用 WhereIn 查询
	if len(services) > 0 {
		query = query.WhereIn("svc", services)
	}

	err = query.Scan(&results)
	if err != nil {
		return decimal.Zero, decimal.Zero, gerror.Wrap(err, "查询消费数据失败")
	}

	// 处理查询结果，直接使用decimal类型
	todayStr := today.Format("2006-01-02")
	yesterdayStr := yesterday.Format("2006-01-02")

	for _, result := range results {
		switch result.Date {
		case todayStr:
			todayCost = result.Cost
		case yesterdayStr:
			yesterdayCost = result.Cost
		}
	}

	return todayCost, yesterdayCost, nil
}

// CalculateIncreaseRate 计算增加率（可复用）
func (s *BillingService) CalculateIncreaseRate(yesterdayCost, todayCost decimal.Decimal) float64 {
	if yesterdayCost.IsZero() {
		if todayCost.IsZero() {
			return 0.0
		}
		return 100.0 // 从0增长到有值，增长率为100%
	}

	increase := todayCost.Sub(yesterdayCost)
	rate := increase.Div(yesterdayCost).Mul(decimal.NewFromFloat(100))

	rateFloat, _ := rate.Float64()
	return rateFloat
}

// GetActiveUsersData 查询返回每天的活跃用户数和总活跃用户数（可复用）
func (s *BillingService) GetActiveUsersData(ctx context.Context, day int) (map[string]int, int, error) {
	// 计算日期范围
	startDate := time.Now().AddDate(0, 0, -(day + 1))
	totalStartDate := time.Now().AddDate(0, 0, -day)

	// 串行查询:每天的活跃用户数
	type DailyActiveUser struct {
		Date       string `json:"date"`
		DailyTotal int    `json:"daily_total"`
	}

	var dailyResult []DailyActiveUser
	err := dao.BillingCostRecords.Ctx(ctx).
		Fields("DATE(created_at) as date, COUNT(DISTINCT upn) as daily_total").
		Where("created_at >= ?", startDate).
		Group("DATE(created_at)").
		Order("date DESC").
		Scan(&dailyResult)

	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询每日活跃用户失败")
	}

	activeUsersMap := make(map[string]int, len(dailyResult))
	for _, record := range dailyResult {
		activeUsersMap[record.Date] = record.DailyTotal
	}

	// 串行查询:总活跃用户数，不采用并发查询了
	type TotalActiveUser struct {
		TotalActive int `json:"total_active"`
	}

	var totalResult TotalActiveUser
	err = dao.BillingCostRecords.Ctx(ctx).
		Fields("COUNT(DISTINCT upn) as total_active").
		Where("created_at >= ?", totalStartDate).
		Scan(&totalResult)

	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询总活跃用户失败")
	}

	return activeUsersMap, totalResult.TotalActive, nil
}

// GetTotalUsersCount 查询系统总用户数（可复用）
func (s *BillingService) GetTotalUsersCount(ctx context.Context) (int, error) {
	count, err := dao.UserinfosUserInfos.Ctx(ctx).Count()
	if err != nil {
		return 0, err
	}
	return count, nil
}

// CalculateActiveRateIncrease 计算活跃率增长（可复用）
func (s *BillingService) CalculateActiveRateIncrease(current, previous int) float64 {
	// 前一天无活跃用户的特殊处理
	if previous == 0 {
		if current == 0 {
			return 0.0
		}
		return 100.0 // 考虑前一天没有但是后一天有的问题
	}

	// 计算增长率
	increase := float64(current - previous)
	rate := (increase / float64(previous)) * 100

	return rate
}

// ValidatePagination 验证分页参数（可复用）
func (s *BillingService) ValidatePagination(page, pageSize int) error {
	if page <= 0 {
		return gerror.New("页码必须大于0")
	}
	if pageSize <= 0 {
		return gerror.New("每页条数必须大于0")
	}
	if pageSize > 100 {
		return gerror.New("每页条数不能超过100")
	}
	return nil
}

// ValidateBillType 验证账单类型并返回字段映射（可复用）
func (s *BillingService) ValidateBillType(billType string, upns, quotaPools []string) (keyField, auxiliaryField, searchField string, keyValues, auxiliaryValues []string, err error) {
	switch billType {
	case "upn":
		// upn 模式
		keyField, auxiliaryField, searchField = "upn", "source", "source"
		keyValues, auxiliaryValues = upns, quotaPools
	case "qp":
		// Quota Pool 模式
		keyField, auxiliaryField, searchField = "source", "upn", "upn"
		keyValues, auxiliaryValues = quotaPools, upns
	default:
		return "", "", "", nil, nil, gerror.New("Type值错误, 只能传入 upn 或 qp")
	}
	return keyField, auxiliaryField, searchField, keyValues, auxiliaryValues, nil
}

// ValidateBillTypeAndKeyValues 验证账单类型并返回主键字段和值（可复用）
func (s *BillingService) ValidateBillTypeAndKeyValues(billType string, upns, quotaPools []string) (keyField string, keyValues []string, err error) {
	switch billType {
	case "upn":
		keyField = "upn"
		keyValues = upns
	case "qp":
		keyField = "source"
		keyValues = quotaPools
	default:
		return "", nil, gerror.New("Type值错误, 只能传入 upn 或 qp")
	}

	if len(keyValues) == 0 {
		return "", nil, gerror.Newf("%s 不能传空", keyField)
	}

	return keyField, keyValues, nil
}

// ValidateNameType 验证名称类型并返回数据库字段名（可复用）
func (s *BillingService) ValidateNameType(nameType string) (string, error) {
	// 字段映射（防止SQL注入）
	fieldMap := map[string]string{
		"service":   "svc",
		"quotaPool": "source",
		"product":   "product",
	}

	field, exists := fieldMap[nameType]
	if !exists {
		return "", gerror.New("不支持的名称类型: " + nameType)
	}

	return field, nil
}

// QueryDistinctNames 查询指定字段的所有不重复值（可复用）
func (s *BillingService) QueryDistinctNames(ctx context.Context, field string) ([]string, error) {
	// 使用Array()方法获取字符串数组
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Fields(field).
		Where(field + " IS NOT NULL AND " + field + " != ''").
		Distinct().
		Array()

	if err != nil {
		return nil, err
	}

	// 转换为字符串数组
	names := make([]string, 0, len(result)+1)
	names = append(names, "all")
	for _, item := range result {
		if str := item.String(); str != "" {
			names = append(names, str)
		}
	}

	return names, nil
}
