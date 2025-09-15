package billing

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) NDaysProductUsageGroup(ctx context.Context, req *v1.NDaysProductUsageGroupReq) (res *v1.NDaysProductUsageGroupRes, err error) {
	result, err := dao.BillingCostRecords.Ctx(ctx).
		Where("svc = ?", "chat").
		Where("created_at >= NOW() - INTERVAL ? DAY", req.N).
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
		product string
		count   int
		percent float32
	}
	finalResult := []finalResultItem{}
	result.ScanList(&finalResult, "product", "count")
	for _, item := range finalResult {
		if item.count > 0 {
			item.percent = float32(item.count) / float32(totalCount)
		} else {
			item.percent = 0
		}
	}

	res = &v1.NDaysProductUsageGroupRes{
		GroupData: gjson.New(finalResult),
	}
	return
}
