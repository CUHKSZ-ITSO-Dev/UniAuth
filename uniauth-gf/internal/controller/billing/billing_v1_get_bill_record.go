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
	var model *gdb.Model
	var keyField string          // 记录主键字段名，upn或source
	var auxiliaryField string    // 辅助字段
	var keyValues []string       // 记录主键值
	var auxiliaryValues []string // 辅助字段值
	var searchField string       // 模糊搜索的字段

	isPagination := req.Pagination != nil && req.Pagination.Page > 0 && req.Pagination.PageSize > 0

	switch req.Type {
	case "upn":
		// upn 模式
		keyField = "upn"
		auxiliaryField = "source"
		keyValues = req.Upns
		auxiliaryValues = req.QuotaPools
		searchField = "source"
	case "qp":
		// Quota Pool 模式
		keyField = "source"
		auxiliaryField = "upn"
		keyValues = req.QuotaPools
		auxiliaryValues = req.Upns
		searchField = "upn"
	}

	// 如果传了分页参数，则进行分页查询
	if isPagination {

		model = dao.BillingCostRecords.Ctx(ctx).
			OmitEmpty().
			WhereIn(keyField, keyValues).
			WhereIn(auxiliaryField, auxiliaryValues).
			WhereIn("svc", req.Svc).
			WhereIn("product", req.Product).
			WhereGTE("created_at", req.StartTime).
			WhereLTE("created_at", req.EndTime)

		if req.Keywords != "" {
			model = model.WhereLike(searchField, "%"+req.Keywords+"%")
		}

		total, err := model.Count()
		if err != nil {
			return nil, gerror.Wrapf(err, "[%s 模式]: 获取 %s = %s 账单总数失败", req.Type, keyField, keyValues)
		}

		result, err := model.
			Order("created_at "+req.Order).
			Page(req.Pagination.Page, req.Pagination.PageSize).
			All()
		if err != nil {
			return nil, gerror.Wrapf(err, "[%s 模式]: 获取 %s = %s 账单信息失败", req.Type, keyField, keyValues)
		}

		totalPages := (total + req.Pagination.PageSize - 1) / req.Pagination.PageSize

		resultMap[keyValues[0]] = result

		return &v1.GetBillRecordRes{
			Records:    gjson.New(resultMap),
			TotalCount: total,
			Page:       req.Pagination.Page,
			PageSize:   req.Pagination.PageSize,
			TotalPages: totalPages,
		}, nil
	} else {
		// 非分页查询，返回所有符合条件的记录

		if len(keyValues) == 0 {
			return nil, gerror.Wrapf(err, "%s 不能传空", keyValues)
		}
		for _, keyFieldItem := range req.Upns {
			result, err := dao.BillingCostRecords.Ctx(ctx).
				OmitEmpty().
				Where(keyField, keyFieldItem).
				WhereIn(auxiliaryField, auxiliaryValues).
				WhereIn("svc", req.Svc).
				WhereIn("product", req.Product).
				WhereGTE("created_at", req.StartTime).
				WhereLTE("created_at", req.EndTime).
				Order("created_at " + req.Order).
				All()
			if err != nil {
				return nil, gerror.Wrapf(err, "[%s 模式] 获取 %s = %s 账单信息失败", req.Type, keyField, keyFieldItem)
			}
			resultMap[keyFieldItem] = result
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
