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

	// 如果传了分页参数，则进行分页查询
	if req.Pagination != nil {
		var model *gdb.Model
		var keyField string    // 记录主键字段名，upn或source
		var keyValue string    // 记录主键值
		var searchField string // 模糊搜索的字段

		switch req.Type {
		case "upn":
			// upn 模式
			if len(req.Upns) != 1 {
				return nil, gerror.New("分页查询时，UPNs 必须且只能传入一个值")
			}
			keyField = "upn"
			keyValue = req.Upns[0]
			searchField = "source"
		case "qp":
			// Quota Pool 模式
			if len(req.QuotaPools) != 1 {
				return nil, gerror.New("分页查询时，QuotaPools 必须且只能传入一个值")
			}
			keyField = "source"
			keyValue = req.QuotaPools[0]
			searchField = "upn"
		}

		model = dao.BillingCostRecords.Ctx(ctx).
			OmitEmpty().
			Where(keyField, keyValue).
			WhereIn("svc", req.Svc).
			WhereIn("product", req.Product).
			WhereGTE("created_at", req.StartTime).
			WhereLTE("created_at", req.EndTime)

		if req.Keywords != "" {
			model = model.WhereLike(searchField, "%"+req.Keywords+"%")
		}

		total, err := model.Count()
		if err != nil {
			return nil, gerror.Wrapf(err, "[%s]模式: 获取 %s = %s 账单总数失败", keyField, keyField, keyValue)
		}

		result, err := model.
			Order("created_at "+req.Order).
			Page(req.Pagination.Page, req.Pagination.PageSize).
			All()
		if err != nil {
			return nil, gerror.Wrapf(err, "[%s]模式: 获取 %s = %s 账单信息失败", keyField, keyField, keyValue)
		}

		totalPages := (total + req.Pagination.PageSize - 1) / req.Pagination.PageSize

		resultMap[keyValue] = result

		return &v1.GetBillRecordRes{
			Records:    gjson.New(resultMap),
			TotalCount: total,
			Page:       req.Pagination.Page,
			PageSize:   req.Pagination.PageSize,
			TotalPages: totalPages,
		}, nil
	} else {

		// 非分页查询，返回所有符合条件的记录
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
					Order("created_at " + req.Order).
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
					Order("created_at " + req.Order).
					All()
				if err != nil {
					return nil, gerror.Wrapf(err, "[Quota Pool 模式] 获取 Source = %s 账单信息失败", quotaPool)
				}
				resultMap[quotaPool] = result
			}
		}

		return &v1.GetBillRecordRes{
			Records:    gjson.New(resultMap),
			TotalCount: 0,
			Page:       0,
			PageSize:   0,
			TotalPages: 0,
		}, nil
	}
}
