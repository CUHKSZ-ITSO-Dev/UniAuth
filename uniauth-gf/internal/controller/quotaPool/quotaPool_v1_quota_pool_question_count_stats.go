package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) QuotaPoolQuestionCountStats(ctx context.Context, req *v1.QuotaPoolQuestionCountStatsReq) (res *v1.QuotaPoolQuestionCountStatsRes, err error) {
	now := gtime.Now()
	startDate := now.AddDate(0, 0, -(req.NDays - 1)).StartOfDay()
	endDate := now.EndOfDay()

	var quotaPoolList []*entity.QuotapoolQuotaPool
	if err = dao.QuotapoolQuotaPool.Ctx(ctx).
		Where("personal = ?", false).
		Fields("quota_pool_name").
		Scan(&quotaPoolList); err != nil {
		return nil, gerror.Wrap(err, "查询非私人配额池列表失败")
	}

	// 提取配额池名称列表
	quotaPoolNames := make([]string, len(quotaPoolList))
	for i, qp := range quotaPoolList {
		quotaPoolNames[i] = qp.QuotaPoolName
	}

	// 查询统计数据：按日期和配额池分组统计
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", startDate).
		Where("created_at <= ?", endDate).
		Fields("DATE(created_at) as date, source as quota_pool_name, COUNT(*) as count").
		Group("DATE(created_at), source").
		Order("date desc").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询配额池提问次数统计失败")
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
		count := record["count"].Int64()

		if dateMap, ok := stats[date].(g.Map); ok {
			dateMap[quotaPoolName] = count
		} else {
			stats[date] = g.Map{quotaPoolName: count}
		}
	}

	res = &v1.QuotaPoolQuestionCountStatsRes{
		QuestionCountStats: gjson.New(stats),
	}
	return
}
