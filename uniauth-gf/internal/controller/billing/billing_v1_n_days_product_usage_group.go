package billing

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) NDaysProductUsageGroup(ctx context.Context, req *v1.NDaysProductUsageGroupReq) (res *v1.NDaysProductUsageGroupRes, err error) {
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Where("svc = ?", "chat").
		Where(fmt.Sprintf("created_at >= NOW() - INTERVAL '%d' DAY", req.N)).
		Group("product").
		Fields("product, COUNT(*) as count").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "账单筛选数据失败 (Group.Group)")
	}

	var totalCount = 0
	for _, count := range result.Array("count") {
		totalCount += count.Int()
	}

	type finalResultItem struct {
		Product string
		Count   int
		Percent float32
	}
	finalResult := []finalResultItem{}
	for _, record := range result {
		finalResult = append(finalResult, finalResultItem{
			Product: record["product"].String(),
			Count:   record["count"].Int(),
			Percent: record["count"].Float32() / float32(totalCount),
		})
	}

	res = &v1.NDaysProductUsageGroupRes{
		GroupData: gjson.New(finalResult),
	}
	return
}
