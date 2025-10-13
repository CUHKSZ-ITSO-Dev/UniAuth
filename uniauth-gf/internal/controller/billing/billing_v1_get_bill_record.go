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
	totalCountMap := map[string]int{}

	// 判断是否需要分页：
	// 1. 用户传入了分页参数
	// 2. 只在upns或quotaPools列表唯一时才应用分页
	needPagination := (req.Pagination.Page > 0 || req.Pagination.PageSize > 0) &&
		((req.Type == "upn" && len(req.Upns) == 1) ||
			(req.Type == "qp" && len(req.QuotaPools) == 1))

	// 设置分页参数
	var page, pageSize int
	if needPagination {
		page = 1
		pageSize = 10
		if req.Pagination.Page > 0 {
			page = req.Pagination.Page
		}
		if req.Pagination.PageSize > 0 {
			pageSize = req.Pagination.PageSize
		}
	}

	if req.Type == "upn" {
		// upn 模式
		if len(req.Upns) == 0 {
			return nil, gerror.New("UPNs 不能传空")
		}
		for _, upn := range req.Upns {
			model := dao.BillingCostRecords.Ctx(ctx).
				OmitEmpty().
				Where("upn", upn).
				WhereIn("source", req.QuotaPools).
				WhereIn("svc", req.Svc).
				WhereIn("product", req.Product).
				WhereGTE("created_at", req.StartTime).
				WhereLTE("created_at", req.EndTime).
				Order("created_at " + req.Order)

			var result gdb.Result
			var err error

			// 根据是否需要分页执行不同的查询
			if needPagination {
				// 使用 AllAndCount 方法同时获取记录和总数
				var count int
				result, count, err = model.Page(page, pageSize).AllAndCount(false)
				if err != nil {
					return nil, gerror.Wrapf(err, "[UPN 模式] 获取 UPN = %s 账单信息失败", upn)
				}
				totalCountMap[upn] = count
			} else {
				// 不分页，直接获取全部数据
				result, err = model.All()
				if err != nil {
					return nil, gerror.Wrapf(err, "[UPN 模式] 获取 UPN = %s 账单信息失败", upn)
				}
			}
			resultMap[upn] = result
		}
	} else {
		// Quota Pool 模式
		if len(req.QuotaPools) == 0 {
			return nil, gerror.New("QuotaPools 不能传空")
		}

		for _, quotaPool := range req.QuotaPools {
			model := dao.BillingCostRecords.Ctx(ctx).
				OmitEmpty().
				Where("source", quotaPool).
				WhereIn("svc", req.Svc).
				WhereIn("product", req.Product).
				WhereGTE("created_at", req.StartTime).
				WhereLTE("created_at", req.EndTime).
				Order("created_at " + req.Order)

			// 如果传入了UPN列表，则添加筛选条件
			if len(req.Upns) > 0 {
				model = model.WhereIn("upn", req.Upns)
			}

			// 在 qp 模式下，如果有关键字，添加模糊搜索条件
			if req.UpnKeywords != "" {
				model = model.WhereLike("upn", "%"+req.UpnKeywords+"%")
			}

			var result gdb.Result
			var err error

			// 根据是否需要分页执行不同的查询
			if needPagination {
				// 使用 AllAndCount 方法同时获取记录和总数
				var count int
				result, count, err = model.Page(page, pageSize).AllAndCount(false)
				if err != nil {
					return nil, gerror.Wrapf(err, "[Quota Pool 模式] 获取 Source = %s 账单信息失败", quotaPool)
				}
				totalCountMap[quotaPool] = count
			} else {
				// 不分页，直接获取全部数据
				result, err = model.All()
				if err != nil {
					return nil, gerror.Wrapf(err, "[Quota Pool 模式] 获取 Source = %s 账单信息失败", quotaPool)
				}
			}
			resultMap[quotaPool] = result
		}
	}

	// 创建响应对象
	res = &v1.GetBillRecordRes{
		Records: gjson.New(resultMap),
	}

	// 如果需要分页，才计算总记录数、总页数并返回分页信息
	if needPagination {
		var totalCount int
		for _, count := range totalCountMap {
			totalCount = count
			break
		}

		// 计算总页数
		var totalPages int
		if pageSize > 0 {
			// 使用整数计算向上取整：(totalCount + pageSize - 1) / pageSize
			totalPages = (totalCount + pageSize - 1) / pageSize
		}

		res.Page = page
		res.PageSize = pageSize
		res.TotalCount = totalCount
		res.TotalPages = totalPages
	}

	return res, nil
}
