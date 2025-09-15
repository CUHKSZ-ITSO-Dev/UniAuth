package billing

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) NDaysProductUsageChart(ctx context.Context, req *v1.NDaysProductUsageChartReq) (res *v1.NDaysProductUsageChartRes, err error) {
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Where("svc = ?", "chat").
		Where(fmt.Sprintf("created_at >= NOW() - INTERVAL '%d' DAY", req.N)).
		Group("DATE(created_at), product").
		Fields("DATE(created_at) as date, product, SUM(cost) as cost").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "账单筛选数据失败")
	}
	return &v1.NDaysProductUsageChartRes{
		ChartData: gjson.New(result),
	}, nil
}
