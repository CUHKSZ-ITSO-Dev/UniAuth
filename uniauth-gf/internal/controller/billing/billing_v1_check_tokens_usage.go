package billing

import (
	"context"
	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/consts"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

func (c *ControllerV1) CheckTokensUsage(ctx context.Context, req *v1.CheckTokensUsageReq) (res *v1.CheckTokensUsageRes, err error) {
	res = &v1.CheckTokensUsageRes{}

	startDate := gtime.Now().AddDate(0, 0, 1-req.NDays).Format("Y-m-d")
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Where("upn = ? AND source = ? AND created_at >= ?", req.Upn, req.QuotaPool, startDate).
		Fields("created_at::date as date, product, SUM(cost) as total_cost").
		Group("created_at::date, product").
		Order("date desc").
		All()
	if err != nil {
		err = gerror.Wrap(err, "数据库查询和聚合数据失败")
	}

	stats := g.Map{}
	for i := range req.NDays {
		stats[gtime.Now().AddDate(0, 0, -i).Format("Y-m-d")] = g.Map{}
	}
	for _, record := range result {
		total_cost, _ := decimal.NewFromString(record["total_cost"].String())
		stats[record["date"].GTime().Format("Y-m-d")].(g.Map)[record["product"].String()] = total_cost.Mul(consts.GAME_CURRENCY).Round(0)
	}
	res.TokensUsage = gjson.New(stats)
	return
}
