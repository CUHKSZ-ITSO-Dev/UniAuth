package billing

import (
	"context"
	"time"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetTodayTotalConsumption(ctx context.Context, req *v1.GetTodayTotalConsumptionReq) (res *v1.GetTodayTotalConsumptionRes, err error) {
	// 初始化响应
	res = &v1.GetTodayTotalConsumptionRes{
		Date:        time.Now().Format("2006-01-02"),
		ServiceName: req.Service,
	}

	// 默认显示全部(serviceName不传值）
	if res.ServiceName == "" {
		res.ServiceName = "all"
	}

	// 查询今天的总消费
	todayCost, err := c.getTotalCostByDate(ctx, time.Now(), req.Service)
	if err != nil {
		return nil, gerror.Wrap(err, "查询今日消费失败")
	}

	res.TotalCostCNY = todayCost

	// 查询昨天的总消费
	yesterday := time.Now().AddDate(0, 0, -1)
	yesterdayCost, err := c.getTotalCostByDate(ctx, yesterday, req.Service)
	if err != nil {
		return nil, gerror.Wrap(err, "查询昨日消费失败")
	}

	// 计算增长率
	res.IncreaseRate = c.calculateIncreaseRate(todayCost, yesterdayCost)

	return res, nil
}

// getTotalCostByDate 查询指定日期的总消费
func (c *ControllerV1) getTotalCostByDate(ctx context.Context, date time.Time, service string) (decimal.Decimal, error) {

	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.Local)
	endOfDay := startOfDay.AddDate(0, 0, 1)
	// 构建查询
	model := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", startOfDay).Where("created_at < ?", endOfDay)

	// 如果指定了服务类型，添加过滤条件
	if service != "" {
		model = model.Where("svc = ?", service)
	}

	// 查询总金额
	result, err := model.Fields("COALESCE(SUM(cost), 0) as total").One()
	if err != nil {
		return decimal.Zero, err
	}

	// 提取总金额
	totalStr := result["total"].String()
	total, err := decimal.NewFromString(totalStr)
	if err != nil {
		return decimal.Zero, gerror.Wrap(err, "无法获取总金额")
	}

	return total, nil
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
