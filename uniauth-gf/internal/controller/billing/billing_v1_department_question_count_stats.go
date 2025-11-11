package billing

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DepartmentQuestionCountStats(ctx context.Context, req *v1.DepartmentQuestionCountStatsReq) (res *v1.DepartmentQuestionCountStatsRes, err error) {
	now := gtime.Now()
	startDate := now.AddDate(0, 0, -(req.NDays - 1)).StartOfDay()
	endDate := now.EndOfDay()

	result, err := dao.BillingCostRecords.Ctx(ctx).
		LeftJoin("userinfos_user_infos", "billing_cost_records.upn = userinfos_user_infos.upn").
		Where("billing_cost_records.created_at >= ?", startDate).
		Where("billing_cost_records.created_at <= ?", endDate).
		Fields("DATE(billing_cost_records.created_at) as date, COALESCE(NULLIF(TRIM(userinfos_user_infos.department), ''), 'Unknown') as department, COUNT(*) as count").
		Group("DATE(billing_cost_records.created_at), COALESCE(NULLIF(TRIM(userinfos_user_infos.department), ''), 'Unknown')").
		Order("date desc").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询部门提问次数统计失败")
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
		count := record["count"].Int64()

		if dateMap, ok := stats[date].(g.Map); ok {
			dateMap[department] = count
		} else {
			stats[date] = g.Map{department: count}
		}
	}

	res = &v1.DepartmentQuestionCountStatsRes{
		QuestionCountStats: gjson.New(stats),
	}
	return
}
