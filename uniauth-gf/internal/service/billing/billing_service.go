package billing

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"
	"uniauth-gf/internal/dao"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"
)

// BillingService 计费服务
type BillingService struct{}

// NewBillingService 创建计费服务实例
func NewBillingService() *BillingService {
	return &BillingService{}
}

// GetProductConsumption 获取产品消费统计
func (s *BillingService) GetProductConsumption(ctx context.Context, req *v1.GetProductConsumptionReq) (res *v1.GetProductConsumptionRes, err error) {
	// 使用新的验证和过滤函数
	filteredParams, err := s.validateAndFilterName(req.Service, req.QuotaPool, req.Product)
	if err != nil {
		return nil, err
	}

	// 统一使用UTC时间，确保跨时区部署的一致性
	now := time.Now().UTC()
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

// GetTodayTotalConsumption 获取今日总消费
func (s *BillingService) GetTodayTotalConsumption(ctx context.Context, req *v1.GetTodayTotalConsumptionReq) (res *v1.GetTodayTotalConsumptionRes, err error) {
	// 输入验证和服务过滤
	svcFilter, err := s.validateAndFilterService(req.Service)
	if err != nil {
		return nil, err
	}

	// 初始化响应 - 显示给用户的日期使用+8时区
	loc, _ := time.LoadLocation("Asia/Shanghai")
	res = &v1.GetTodayTotalConsumptionRes{
		Date:        time.Now().In(loc).Format("2006-01-02"),
		ServiceName: s.getServiceDisplayName(req.Service),
	}

	// 计算时间范围（使用UTC避免时区问题）
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	yesterday := today.AddDate(0, 0, -1)

	// 获取今日和昨日消费数据
	todayCost, yesterdayCost, err := s.getTodayAndYesterdayCost(ctx, today, yesterday, svcFilter)
	if err != nil {
		return nil, err
	}

	// 计算增加率
	increaseRate := s.calculateIncreaseRate(yesterdayCost, todayCost)

	res.TotalCostCNY = todayCost
	res.IncreaseRate = increaseRate

	return res, nil
}

// validateAndFilterName 验证和过滤服务名称、配额池和产品名称
func (s *BillingService) validateAndFilterName(service string, quotaPool string, product string) (v1.ConsumptionItem, error) {
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

// validateAndFilterService 验证和过滤服务名称
func (s *BillingService) validateAndFilterService(service string) (string, error) {
	// 处理 "all" 关键字
	if service == "all" {
		service = ""
	}

	// 输入验证
	service = strings.TrimSpace(service)

	// 验证长度
	if len(service) > 50 {
		return "", gerror.New("服务名称长度不能超过50字符")
	}

	// 检查非法字符
	if strings.ContainsAny(service, "';\"\\") {
		return "", gerror.New("服务名称包含非法字符")
	}

	return service, nil
}

// getServiceDisplayName 获取服务显示名称
func (s *BillingService) getServiceDisplayName(service string) string {
	if service == "" {
		return "全部服务"
	}
	return service
}

// getTodayAndYesterdayCost 获取今日和昨日消费数据
func (s *BillingService) getTodayAndYesterdayCost(ctx context.Context, today, yesterday time.Time, service string) (todayCost, yesterdayCost decimal.Decimal, err error) {
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

	if service != "" {
		query = query.Where("svc = ?", service)
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

// calculateIncreaseRate 计算增加率
func (s *BillingService) calculateIncreaseRate(yesterdayCost, todayCost decimal.Decimal) float64 {
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

// GetActiveUsersNum 获取活跃用户数统计
func (s *BillingService) GetActiveUsersNum(ctx context.Context, req *v1.GetActiveUsersNumReq) (res *v1.GetActiveUsersNumRes, err error) {
	// 默认返回30天内的活跃用户数
	if req.Days == 0 {
		req.Days = 30
	}

	// 串行查询：每天的活跃用户数 + 总活跃用户数
	activeUsersMap, totalActiveUsers, err := s.getActiveUsersData(ctx, req.Days)
	if err != nil {
		return nil, gerror.Wrap(err, "查询活跃用户数失败")
	}

	// 串行查询：系统总用户数
	totalUsers, err := s.getTotalUsersCount(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "查询总用户数失败")
	}

	// 构建每日活跃用户列表
	activeUsersList := make([]v1.ActiveUserList, 0, req.Days)

	for i := 0; i < req.Days; i++ {
		date := time.Now().UTC().AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")
		prevDateStr := date.AddDate(0, 0, -1).Format("2006-01-02")

		// 从 map 中获取数据
		activeUsersNum := activeUsersMap[dateStr]
		prevActiveUsersNum := activeUsersMap[prevDateStr]

		// 计算活跃率增长
		activeRateInc := s.calculateActiveRateIncrease(activeUsersNum, prevActiveUsersNum)

		activeUsersList = append(activeUsersList, v1.ActiveUserList{
			ActiveUsersNum: activeUsersNum,
			ActiveRateInc:  activeRateInc,
			Date:           dateStr,
		})
	}

	// 构建响应
	res = &v1.GetActiveUsersNumRes{
		ActiveUsers:      activeUsersList,
		TotalUsers:       totalUsers,
		TotalActiveUsers: totalActiveUsers,
	}

	return res, nil
}

// GetAllActiveUsers 获取所有活跃用户
func (s *BillingService) GetAllActiveUsers(ctx context.Context, req *v1.GetAllActiveUsersReq) (res *v1.GetAllActiveUsersRes, err error) {
	// 起始时间
	startOfDay := time.Now().UTC().AddDate(0, 0, -req.Days)

	// 统计活跃用户总数
	var totalResult struct {
		Total int `json:"total"`
	}

	err = dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", startOfDay).
		Fields("COUNT(DISTINCT upn) as total").
		Scan(&totalResult)

	if err != nil {
		return nil, gerror.Wrap(err, "查询活跃用户总数失败")
	}

	total := totalResult.Total

	// 如果没有活跃用户，直接返回空
	if total == 0 {
		return &v1.GetAllActiveUsersRes{
			ActiveUsers: []*v1.ActiveUserSummary{},
			Total:       0,
			Page:        req.Page,
			PageSize:    req.PageSize,
			TotalPages:  0,
		}, nil
	}

	// 创建字段映射表验证和映射排序字段（防止恶意sql注入）
	sortByMap := map[string]string{
		"cost":        "total_cost",
		"calls":       "total_calls",
		"upn":         "upn",
		"last_active": "last_active",
	}

	sortOrderMap := map[string]string{
		"asc":  "ASC",
		"desc": "DESC",
	}

	dbSortBy, ok := sortByMap[req.SortBy]
	if !ok {
		return nil, gerror.New("无效的排序字段")
	}

	dbSortOrder, ok := sortOrderMap[req.SortOrder]
	if !ok {
		return nil, gerror.New("无效的排序方向")
	}

	// 查询活跃用户详细信息
	// 分页计算偏移量计算
	offset := (req.Page - 1) * req.PageSize

	// 优化查询
	query := dao.BillingCostRecords.Ctx(ctx).
		Fields("upn, SUM(cost) as total_cost, COUNT(*) as total_calls, MAX(created_at) as last_active").
		Where("created_at >= ?", startOfDay).
		Group("upn").
		Order(fmt.Sprintf("%s %s", dbSortBy, dbSortOrder)).
		Limit(req.PageSize).
		Offset(offset)

	var activeUsers []*v1.ActiveUserSummary
	err = query.Scan(&activeUsers)

	if err != nil {
		return nil, gerror.Wrap(err, "查询活跃用户详情失败")
	}

	// 构建响应
	totalPages := (total + req.PageSize - 1) / req.PageSize

	return &v1.GetAllActiveUsersRes{
		ActiveUsers: activeUsers,
		Total:       total,
		Page:        req.Page,
		PageSize:    req.PageSize,
		TotalPages:  totalPages,
	}, nil
}

// GetActiveUserDetail 获取活跃用户详情
func (s *BillingService) GetActiveUserDetail(ctx context.Context, req *v1.GetActiveUserDetailReq) (res *v1.GetActiveUserDetailRes, err error) {
	// 如果没有指定天数，默认使用7天
	nDays := req.NDays
	if nDays == 0 {
		nDays = 7
	}

	startOfDay := time.Now().UTC().AddDate(0, 0, -nDays)
	res = &v1.GetActiveUserDetailRes{}

	// 查询用户基本信息
	err = dao.UserinfosUserInfos.Ctx(ctx).
		Where("upn = ?", req.Upn).
		Scan(&res.UserInfo)
	if err != nil {
		return nil, gerror.Wrap(err, "查询用户基本信息失败")
	}

	// 检查用户是否存在
	if res.UserInfo.Upn == "" {
		return nil, gerror.Newf("用户 '%s' 不存在", req.Upn)
	}

	// 查询用户的消费统计数据
	type StatsResult struct {
		TotalCost  decimal.Decimal `json:"totalCost"`
		TotalCalls int             `json:"totalCalls"`
		LastActive *string         `json:"lastActive"` // 使用指针来处理 NULL
	}

	var stats StatsResult
	err = dao.BillingCostRecords.Ctx(ctx).
		Where("upn = ?", req.Upn).
		Where("created_at >= ?", startOfDay).
		Fields("COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as totalCalls, MAX(created_at) as lastActive").
		Scan(&stats)
	if err != nil {
		return nil, gerror.Wrap(err, "查询用户统计数据失败")
	}

	// 设置返回值
	res.TotalCost = stats.TotalCost
	res.TotalCalls = stats.TotalCalls
	if stats.LastActive == nil {
		res.LastActive = "暂无活跃记录"
	} else {
		res.LastActive = *stats.LastActive
	}

	return res, nil
}

// GetProductUsageChart 获取产品使用图表
func (s *BillingService) GetProductUsageChart(ctx context.Context, req *v1.GetProductUsageChartReq) (res *v1.GetProductUsageChartRes, err error) {
	// 调用基础接口获取数据
	consumptionReq := &v1.GetProductConsumptionReq{
		NDays:     req.NDays,
		Service:   req.Service,
		QuotaPool: req.QuotaPool,
		Product:   req.Product,
	}

	consumptionRes, err := s.GetProductConsumption(ctx, consumptionReq)
	if err != nil {
		return nil, gerror.Wrap(err, "获取消费数据失败")
	}

	// 转换为图表格式
	res = &v1.GetProductUsageChartRes{
		LineChartData: s.buildLineChartData(consumptionRes.Consumption),
		BarChartData:  s.buildBarChartData(consumptionRes.Consumption),
		TotalCalls:    consumptionRes.TotalCalls,
	}

	return res, nil
}

// buildLineChartData 构建折线图数据
func (s *BillingService) buildLineChartData(consumption []v1.ConsumptionItem) *gjson.Json {
	// 按日期分组
	dateMap := make(map[string]map[string]int)
	dates := make([]string, 0)

	for _, item := range consumption {
		if item.Date == "" {
			continue
		}

		// 确保日期在map中
		if _, exists := dateMap[item.Date]; !exists {
			dateMap[item.Date] = make(map[string]int)
			dates = append(dates, item.Date)
		}

		// 按产品分组
		dateMap[item.Date][item.Product] += item.Calls
	}

	// 构建系列数据
	series := make([]map[string]interface{}, 0)
	productMap := make(map[string]bool)

	// 收集所有产品
	for _, dateData := range dateMap {
		for product := range dateData {
			productMap[product] = true
		}
	}

	// 为每个产品创建系列
	for product := range productMap {
		seriesData := make([]int, len(dates))
		for i, date := range dates {
			if dateData, exists := dateMap[date]; exists {
				seriesData[i] = dateData[product]
			}
		}

		series = append(series, map[string]interface{}{
			"name": product,
			"data": seriesData,
		})
	}

	// 排序日期
	sort.Strings(dates)

	return gjson.New(map[string]interface{}{
		"dates":  dates,
		"series": series,
	})
}

// buildBarChartData 构建条形图数据
func (s *BillingService) buildBarChartData(consumption []v1.ConsumptionItem) *gjson.Json {
	// 按产品分组统计总调用次数
	productMap := make(map[string]int)

	for _, item := range consumption {
		productMap[item.Product] += item.Calls
	}

	// 构建标签和数据
	labels := make([]string, 0, len(productMap))
	data := make([]int, 0, len(productMap))

	for product, calls := range productMap {
		labels = append(labels, product)
		data = append(data, calls)
	}

	return gjson.New(map[string]interface{}{
		"labels": labels,
		"data":   data,
	})
}

// getActiveUsersData 查询返回每天的活跃用户数和总活跃用户数（串行查询）
func (s *BillingService) getActiveUsersData(ctx context.Context, day int) (map[string]int, int, error) {
	// 计算日期范围
	startDate := time.Now().UTC().AddDate(0, 0, -(day + 1))
	totalStartDate := time.Now().UTC().AddDate(0, 0, -day)

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

// getTotalUsersCount 查询系统总用户数
func (s *BillingService) getTotalUsersCount(ctx context.Context) (int, error) {
	count, err := dao.UserinfosUserInfos.Ctx(ctx).Count()
	if err != nil {
		return 0, err
	}
	return count, nil
}

// calculateActiveRateIncrease 计算活跃率增长
func (s *BillingService) calculateActiveRateIncrease(current, previous int) float64 {
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
