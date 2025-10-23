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

func (c *ControllerV1) GetTodayTotalConsumption(ctx context.Context, req *v1.GetTodayTotalConsumptionReq) (res *v1.GetTodayTotalConsumptionRes, err error) {
	// 输入验证和服务过滤
	svcFilter, err := c.validateAndFilterService(req.Service)
	if err != nil {
		return nil, err
	}

	// 初始化响应
	res = &v1.GetTodayTotalConsumptionRes{
		Date:        time.Now().Format("2006-01-02"),
		ServiceName: c.getServiceDisplayName(req.Service),
	}

	// 计算时间范围（使用UTC避免时区问题）
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	yesterday := today.AddDate(0, 0, -1)

	// 查询获取今天和昨天的数据
	todayCost, yesterdayCost, err := c.getTodayAndYesterdayCostOriginal(ctx, today, yesterday, svcFilter)
	if err != nil {
		return nil, gerror.Wrap(err, "查询消费数据失败")
	}

	res.TotalCostCNY = todayCost
	res.IncreaseRate = c.calculateIncreaseRate(todayCost, yesterdayCost)

	return res, nil
}

func (c *ControllerV1) getTodayAndYesterdayCostOriginal(ctx context.Context, today, yesterday time.Time, service string) (todayCost, yesterdayCost decimal.Decimal, err error) {
	// 分别查询今天和昨天的消费数据，避免复杂的CASE WHEN查询
	var todayCostResult, yesterdayCostResult decimal.Decimal

	// 查询今天的消费
	todayQuery := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", today).
		Where("created_at < ?", today.AddDate(0, 0, 1))

	if service != "" {
		todayQuery = todayQuery.Where("svc = ?", service)
	}

	todayCostFloat, err := todayQuery.Sum("cost")
	if err != nil {
		return decimal.Zero, decimal.Zero, gerror.Wrap(err, "查询今天消费失败")
	}
	todayCostResult = decimal.NewFromFloat(todayCostFloat)

	// 查询昨天的消费
	yesterdayQuery := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", yesterday).
		Where("created_at < ?", today)

	if service != "" {
		yesterdayQuery = yesterdayQuery.Where("svc = ?", service)
	}

	yesterdayCostFloat, err := yesterdayQuery.Sum("cost")
	if err != nil {
		return decimal.Zero, decimal.Zero, gerror.Wrap(err, "查询昨天消费失败")
	}
	yesterdayCostResult = decimal.NewFromFloat(yesterdayCostFloat)

	return todayCostResult, yesterdayCostResult, nil
}

func (c *ControllerV1) validateAndFilterService(service string) (string, error) {
	if service == "" {
		return "", nil
	}

	// 防止SQL注入的输入验证
	svcFilter := strings.TrimSpace(service)
	if len(svcFilter) > 50 {
		return "", gerror.New("服务名称长度不能超过50字符")
	}

	// 检查非法字符
	if strings.ContainsAny(svcFilter, "';\"\\") {
		return "", gerror.New("服务名称包含非法字符")
	}

	// 处理 "all" 关键字
	if strings.EqualFold(svcFilter, "all") {
		return "", nil
	}

	return svcFilter, nil
}

func (c *ControllerV1) getServiceDisplayName(service string) string {
	if service == "" || strings.EqualFold(service, "all") {
		return "all"
	}
	return service
}

func (c *ControllerV1) calculateIncreaseRate(today, yesterday decimal.Decimal) float64 {
	// 昨天没有消费额的特殊处理
	if yesterday.IsZero() {
		if today.IsZero() {
			return 0.0 // 今天和昨天都没有消费
		}
		return 100.0 // 昨天无消费，今天有消费，增长100%
	}

	// 计算增长率: ((今天-昨天)/昨天) * 100
	increase := today.Sub(yesterday)
	rate := increase.Div(yesterday).Mul(decimal.NewFromInt(100))

	// 转换为 float64，保留2位小数精度
	rateFloat, _ := rate.Round(2).Float64()
	return rateFloat
}
