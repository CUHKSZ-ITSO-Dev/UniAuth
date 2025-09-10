package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetBillRecord(ctx context.Context, req *v1.GetBillRecordReq) (res *v1.GetBillRecordRes, err error) {
	result, err := dao.BillingCostRecords.Ctx(ctx).
		OmitEmpty().
		Where("source", req.QuotaPool).
		WhereIn("svc", req.Svc).
		WhereIn("product", req.Product).
		WhereGTE("created_at", req.StartTime).
		WhereLTE("created_at", req.EndTime).
		Order("created_at asc").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "数据库查询账单记录时失败")
	}
	
	res = &v1.GetBillRecordRes{}
	for _, record := range result {
		res.Records = append(res.Records, gjson.New(record))
	}
	return
}
