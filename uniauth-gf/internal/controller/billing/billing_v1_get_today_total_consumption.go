package billing

import (
	"context"
	"time"

	v1 "uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetTodayTotalConsumption(ctx context.Context, req *v1.GetTodayTotalConsumptionReq) (res *v1.GetTodayTotalConsumptionRes, err error) {
	// 输入验证和服务过滤
	svcFilter, err := c.billingService.ValidateAndFilterService(req.Services)
	if err != nil {
		return nil, err
	}

	// 初始化响应 - 显示给用户的日期使用+8时区
	loc, _ := time.LoadLocation("Asia/Shanghai")
	res = &v1.GetTodayTotalConsumptionRes{
		Date:        time.Now().In(loc).Format("2006-01-02"),
		ServiceName: c.billingService.GetServiceDisplayName(svcFilter),
	}

	// 计算时间范围
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	yesterday := today.AddDate(0, 0, -1)

	// 获取今日和昨日消费数据
	todayCost, yesterdayCost, err := c.billingService.GetTodayAndYesterdayCost(ctx, today, yesterday, svcFilter)
	if err != nil {
		return nil, err
	}

	// 计算增加率
	increaseRate := c.billingService.CalculateIncreaseRate(yesterdayCost, todayCost)

	res.TotalCostCNY = todayCost
	res.IncreaseRate = increaseRate

	return res, nil
}
