package billing

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/glog"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/gogf/gf/v2/util/gconv"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) CheckTokensUsage(ctx context.Context, req *v1.CheckTokensUsageReq) (res *v1.CheckTokensUsageRes, err error) {
	sevenDaysAgo := gtime.Now().AddDate(0, 0, -6).StartOfDay()
	var queryResult []g.Map

	log := glog.New()
	log.Infof(ctx, "CheckTokensUsage: UPN=%s, QuotaPool=%s, StartDate=%s", req.Upn, req.QuotaPool, sevenDaysAgo.String())

	query := dao.BillingCostRecords.Ctx(ctx).
		Fields("DATE(created_at) as date, SUM(cost) as total_cost").
		Where("upn = ?", req.Upn).
		Where("source = ?", req.QuotaPool).
		// Where("created_at >= ?", sevenDaysAgo). // Temporarily disabled for debugging
		Group("date").
		Order("date DESC"). // Order by recent date
		Limit(30)           // Limit to last 30 entries for debugging

	// Log the SQL query
	dryRun, errDryRun := query.DryRun()
	if errDryRun != nil {
		log.Warningf(ctx, "Failed to get DryRun SQL: %v", errDryRun)
	} else {
		log.Infof(ctx, "Executing SQL: %s with args %v", dryRun.SQL, dryRun.Args)
	}

	err = query.Scan(&queryResult)
	if err != nil {
		log.Errorf(ctx, "CheckTokensUsage query failed: %v", err)
		return nil, err
	}

	log.Infof(ctx, "CheckTokensUsage query result: %s", gjson.New(queryResult).MustToJsonString())

	// 初始化最近7天的数据
	dailyCosts := g.Map{}
	for i := 0; i < 7; i++ {
		day := gtime.Now().AddDate(0, 0, -i).Format("Y-m-d")
		dailyCosts[day] = 0.0
	}

	// 填充查询结果
	for _, result := range queryResult {
		date := gconv.Time(result["date"]).Format("Y-m-d")
		if _, ok := dailyCosts[date]; ok {
			dailyCosts[date] = gconv.Float64(result["total_cost"])
		}
	}
	res = &v1.CheckTokensUsageRes{
		TokensUsage: gjson.New(dailyCosts),
	}
	return res, nil
}
