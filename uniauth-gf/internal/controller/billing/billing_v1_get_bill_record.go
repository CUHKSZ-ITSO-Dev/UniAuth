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

	var model *gdb.Model
	var keyField string          // 记录主键字段名，upn或source
	var auxiliaryField string    // 辅助字段
	var keyValues []string       // 记录主键值
	var auxiliaryValues []string // 辅助字段值
	var searchField string       // 模糊搜索的字段

	isPagination := req.Pagination != nil && req.Pagination.Page > 0 && req.Pagination.PageSize > 0
	if !isPagination {
		return nil, gerror.New("分页参数错误，pagination 不能为空，且 page 和 pageSize 必须大于0")
	}

	switch req.Type {
	case "upn":
		// upn 模式
		keyField, auxiliaryField, searchField = "upn", "source", "source"
		keyValues, auxiliaryValues = req.Upns, req.QuotaPools
	case "qp":
		// Quota Pool 模式
		keyField, auxiliaryField, searchField = "source", "upn", "upn"
		keyValues, auxiliaryValues = req.QuotaPools, req.Upns
	}

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

	return &v1.GetBillRecordRes{
		Records:    gjson.New(result),
		TotalCount: total,
		Page:       req.Pagination.Page,
		PageSize:   req.Pagination.PageSize,
		TotalPages: totalPages,
	}, nil

}
