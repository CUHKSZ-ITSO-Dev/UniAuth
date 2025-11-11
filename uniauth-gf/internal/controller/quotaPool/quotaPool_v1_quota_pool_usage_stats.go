package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) QuotaPoolUsageStats(ctx context.Context, req *v1.QuotaPoolUsageStatsReq) (res *v1.QuotaPoolUsageStatsRes, err error) {
	now := gtime.Now()
	startDate := now.AddDate(0, 0, -(req.NDays - 1)).StartOfDay()
	endDate := now.EndOfDay()

	// 查询统计数据：按日期和配额池分组统计消费金额
	// 筛选条件：plan = "Quota Pool" 且 source 不以 "personal-" 开头
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Where("plan = ?", "Quota Pool").
		Where("source NOT LIKE ?", "personal-%").
		Where("created_at >= ?", startDate).
		Where("created_at <= ?", endDate).
		Fields("DATE(created_at) as date, source as quota_pool_name, SUM(cost) as total_cost").
		Group("DATE(created_at), source").
		Order("date desc").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询配额池消费统计失败")
	}

	// 初始化所有日期的统计数据
	stats := g.Map{}
	for i := 0; i < req.NDays; i++ {
		date := now.AddDate(0, 0, -i).Format("Y-m-d")
		stats[date] = g.Map{}
	}

	// 填充统计数据
	for _, record := range result {
		date := record["date"].GTime().Format("Y-m-d")
		quotaPoolName := record["quota_pool_name"].String()
		costStr := record["total_cost"].String()
		totalCost, err := decimal.NewFromString(costStr)
		if err != nil {
			return nil, gerror.Wrapf(err, "解析消费金额失败: %s", costStr)
		}

		if dateMap, ok := stats[date].(g.Map); ok {
			dateMap[quotaPoolName] = totalCost
		} else {
			stats[date] = g.Map{quotaPoolName: totalCost}
		}
	}

	res = &v1.QuotaPoolUsageStatsRes{
		StatsData: gjson.New(stats),
	}
	return
}
