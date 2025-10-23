package billing

import (
	"context"
	"strings"
	"time"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
)

// noinspection GoUnusedExportedFunction
func (c *ControllerV1) GetTodayTotalConsumption(ctx context.Context, req *v1.GetTodayTotalConsumptionReq) (res *v1.GetTodayTotalConsumptionRes, err error) {
	// 输入验证
	if req.Service != "" {
		// （防止SQL注入）
		svcFilter := strings.TrimSpace(req.Service)
		if len(svcFilter) > 50 { // 限制长度
			return nil, gerror.New("服务名称长度不能超过50字符")
		}
		// 可以添加更多验证，如只允许特定字符
		if strings.ContainsAny(svcFilter, "';\"\\") {
			return nil, gerror.New("服务名称包含非法字符")
		}
	}

	// 初始化响应
	res = &v1.GetTodayTotalConsumptionRes{
		Date:        time.Now().Format("2006-01-02"),
		ServiceName: req.Service,
	}

	// 服务过滤
	svcFilter := strings.TrimSpace(req.Service)
	if svcFilter == "" || strings.EqualFold(svcFilter, "all") {
		svcFilter = ""
	}

	// 默认显示全部(serviceName不传值）
	if res.ServiceName == "" {
		res.ServiceName = "all"
	}

	// AI建议(避免时区问题)
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	yesterday := today.AddDate(0, 0, -1)

	// 查询获取今天和昨天的数据
	todayCost, yesterdayCost, err := c.getTodayAndYesterdayCost(ctx, today, yesterday, svcFilter)
	if err != nil {
		return nil, gerror.Wrap(err, "查询消费数据失败")
	}

	res.TotalCostCNY = todayCost
	res.IncreaseRate = c.calculateIncreaseRate(todayCost, yesterdayCost)

	return res, nil
}

// getTodayAndYesterdayCost 查询获取今天和昨天的消费数据
func (c *ControllerV1) getTodayAndYesterdayCost(ctx context.Context, today, yesterday time.Time, service string) (todayCost, yesterdayCost decimal.Decimal, err error) {
	// 查询获取今天和昨天的数据
	query := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", yesterday).
		Where("created_at < ?", today.AddDate(0, 0, 1))

	// 如果指定了服务类型，添加过滤条件
	if service != "" {
		query = query.Where("svc = ?", service)
	}

	// 使用 CASE WHEN 在单次查询中计算今天和昨天的消费
	type CostResult struct {
		TodayCost     decimal.Decimal `json:"today_cost"`
		YesterdayCost decimal.Decimal `json:"yesterday_cost"`
	}

	var result CostResult
	err = query.Fields(`
		COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN cost ELSE 0 END), 0) as today_cost,
		COALESCE(SUM(CASE WHEN DATE(created_at) = ? THEN cost ELSE 0 END), 0) as yesterday_cost
	`).
		Scan(&result, today.Format("2006-01-02"), yesterday.Format("2006-01-02"))

	if err != nil {
		return decimal.Zero, decimal.Zero, gerror.Wrap(err, "查询消费数据失败")
	}

	return result.TodayCost, result.YesterdayCost, nil
}

// getCostByDate 查询指定日期的消费数据
func (c *ControllerV1) getCostByDate(ctx context.Context, date time.Time, service string) (cost decimal.Decimal, err error) {
	query := dao.BillingCostRecords.Ctx(ctx).
		Where("DATE(created_at) = ?", date.Format("2006-01-02"))

	// 如果指定了服务类型，添加过滤条件
	if service != "" {
		query = query.Where("svc = ?", service)
	}

	var result decimal.Decimal
	err = query.Fields("COALESCE(SUM(cost), 0)").
		Scan(&result)

	if err != nil {
		return decimal.Zero, gerror.Wrap(err, "查询消费数据失败")
	}

	return result, nil
}

// calculateIncreaseRate 计算增长率
func (c *ControllerV1) calculateIncreaseRate(today, yesterday decimal.Decimal) float64 {
	// 昨天没有消费额的特殊处理
	if yesterday.IsZero() {
		if today.IsZero() {
			return 0.0
		}
		return 100.0 //昨天无消费额但是今天有消费额
	}

	// 计算增长率((今天-昨天)/昨天)*100
	increase := today.Sub(yesterday)
	rate := increase.Div(yesterday).Mul(decimal.NewFromInt(100))

	// 转换为 float64，忽略精度
	rateFloat, _ := rate.Float64()
	return rateFloat
}
