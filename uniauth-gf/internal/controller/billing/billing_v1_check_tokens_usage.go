package billing

import (
	"context"
	"fmt"
	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"
)

func (c *ControllerV1) CheckTokensUsage(ctx context.Context, req *v1.CheckTokensUsageReq) (res *v1.CheckTokensUsageRes, err error) {
	res = &v1.CheckTokensUsageRes{}

	startDate := gtime.Now().AddDate(0, 0, -6).Format("Y-m-d")
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Where("upn = ? AND source = ? AND created_at >= ?", req.Upn, req.QuotaPool, startDate).
		Fields("DATE(created_at) as date, product, SUM(cost) as total_cost").
		Group("date, product").
		Order("date desc").
		All()
	if err != nil {
		err = gerror.Wrap(err, "数据库查询和聚合数据失败")
	}
	fmt.Println("#############")
	for _, record := range result {
		fmt.Println(record)
	}
	return
}
