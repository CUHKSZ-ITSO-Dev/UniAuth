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
	upnLen := len(req.Upns)
	qpLen := len(req.QuotaPools)
	if upnLen == 0 && qpLen == 0 {
		return nil, gerror.New("UPNs 和 QuotaPools 必须传一个")
	}
	// golangci-lint QF1001: could apply De Morgan's law (staticcheck)
	// 原始条件 !(upnLen > 0 && qpLen == 0 || upnLen == 0 && qpLen > 0)
	// not (a and b or c and d)
	// not (a and b) and not (c and d)
	if !(upnLen > 0 && qpLen == 0) && !(upnLen == 0 && qpLen > 0) {
		return nil, gerror.New("UPNs 和 QuotaPools 只能同时传一个")
	}
	resultMap := map[string]gdb.Result{}
	if upnLen > 0 {
		// upn 模式
		for _, upn := range req.Upns {
			result, err := dao.BillingCostRecords.Ctx(ctx).
				OmitEmpty().
				Where("upn", upn).
				WhereIn("svc", req.Svc).
				WhereIn("product", req.Product).
				WhereGTE("created_at", req.StartTime).
				WhereLTE("created_at", req.EndTime).
				Order("created_at asc").
				All()
			if err != nil {
				return nil, gerror.Wrapf(err, "[UPN 模式] 获取 UPN = %s 账单信息失败", upn)
			}
			resultMap[upn] = result
		}
	} else {
		// Quota Pool 模式
		for _, quotaPool := range req.QuotaPools {
			result, err := dao.BillingCostRecords.Ctx(ctx).
				OmitEmpty().
				Where("source", quotaPool).
				WhereIn("svc", req.Svc).
				WhereIn("product", req.Product).
				WhereGTE("created_at", req.StartTime).
				WhereLTE("created_at", req.EndTime).
				Order("created_at asc").
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
