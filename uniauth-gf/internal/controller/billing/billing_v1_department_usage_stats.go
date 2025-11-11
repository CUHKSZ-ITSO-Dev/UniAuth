package billing

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DepartmentUsageStats(ctx context.Context, req *v1.DepartmentUsageStatsReq) (res *v1.DepartmentUsageStatsRes, err error) {
	now := gtime.Now()
	startDate := now.AddDate(0, 0, -(req.NDays - 1)).StartOfDay()
	endDate := now.EndOfDay()

	// 查询统计数据：按日期和部门分组统计消费金额
	result, err := dao.BillingCostRecords.Ctx(ctx).
		LeftJoin("userinfos_user_infos", "billing_cost_records.upn = userinfos_user_infos.upn").
		Where("billing_cost_records.created_at >= ?", startDate).
		Where("billing_cost_records.created_at <= ?", endDate).
		Fields("DATE(billing_cost_records.created_at) as date, COALESCE(NULLIF(TRIM(userinfos_user_infos.department), ''), 'Unknown') as department, SUM(billing_cost_records.cost) as total_cost").
		Group("DATE(billing_cost_records.created_at), COALESCE(NULLIF(TRIM(userinfos_user_infos.department), ''), 'Unknown')").
		Order("date desc").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询部门使用统计失败")
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
		department := strings.TrimSpace(record["department"].String())
		if department == "" {
			department = "Unknown"
		}
		costStr := record["total_cost"].String()
		totalCost, err := decimal.NewFromString(costStr)
		if err != nil {
			return nil, gerror.Wrapf(err, "解析消费金额失败: %s", costStr)
		}

		if dateMap, ok := stats[date].(g.Map); ok {
			dateMap[department] = totalCost
		} else {
			stats[date] = g.Map{department: totalCost}
		}
	}

	res = &v1.DepartmentUsageStatsRes{
		StatsData: gjson.New(stats),
	}
	return
}
