package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetBillRecord(ctx context.Context, req *v1.GetBillRecordReq) (res *v1.GetBillRecordRes, err error) {
	resultMap := map[string]gdb.Result{}
	if req.Type == "upn" {
		// upn 模式
		if len(req.Upns) == 0 {
			return nil, gerror.New("UPNs 不能传空")
		}
		for _, upn := range req.Upns {
			result, err := dao.BillingCostRecords.Ctx(ctx).
				OmitEmpty().
				Where("upn", upn).
				WhereIn("source", req.QuotaPools).
				WhereIn("svc", req.Svc).
				WhereIn("product", req.Product).
				WhereGTE("created_at", req.StartTime).
				WhereLTE("created_at", req.EndTime).
				Order("created_at desc").
				All()
			if err != nil {
				return nil, gerror.Wrapf(err, "[UPN 模式] 获取 UPN = %s 账单信息失败", upn)
			}
			resultMap[upn] = result
		}
	} else {
		// Quota Pool 模式
		if len(req.QuotaPools) == 0 {
			return nil, gerror.New("QuotaPools 不能传空")
		}
		for _, quotaPool := range req.QuotaPools {
			result, err := dao.BillingCostRecords.Ctx(ctx).
				OmitEmpty().
				Where("source", quotaPool).
				WhereIn("upn", req.Upns).
				WhereIn("svc", req.Svc).
				WhereIn("product", req.Product).
				WhereGTE("created_at", req.StartTime).
				WhereLTE("created_at", req.EndTime).
				Order("created_at desc").
				All()
			if err != nil {
				return nil, gerror.Wrapf(err, "[Quota Pool 模式] 获取 Source = %s 账单信息失败", quotaPool)
			}
			resultMap[quotaPool] = result
		}
	}

	return &v1.GetBillRecordRes{
		Records: gjson.New(resultMap),
	}, nil
}
