package quotaPool

import (
	"context"
	"fmt"
	"math"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	quotaPoolService "uniauth-gf/internal/service/quotaPool"
)

func (c *ControllerV1) FilterQuotaPool(ctx context.Context, req *v1.FilterQuotaPoolReq) (res *v1.FilterQuotaPoolRes, err error) {
	// 设置默认分页参数
	if req.Pagination == nil {
		req.Pagination = &v1.PaginationReq{
			Page:     1,
			PageSize: 20,
		}
	}

	// 创建查询模型
	model := dao.QuotapoolQuotaPool.Ctx(ctx)

	// 应用过滤条件
	model, err = quotaPoolService.ApplyQuotaPoolFilter(ctx, model, req.Filter)
	if err != nil {
		return nil, gerror.Wrap(err, "应用过滤条件失败")
	}

	// 获取总数
	total, err := model.Count()
	if err != nil {
		return nil, gerror.Wrap(err, "获取总数失败")
	}

	// 检查是否请求全部数据
	if req.Pagination.All {
		const maxAllLimit = 10000
		if total > maxAllLimit {
			return nil, gerror.Newf("查询结果过多(%d)，超过最大限制(%d)，请添加更精确的过滤条件", total, maxAllLimit)
		}
		req.Pagination.Page = 1
		req.Pagination.PageSize = total
	} else {
		if req.Pagination.PageSize > 1000 {
			return nil, gerror.New("分页大小不能超过1000")
		}
	}

	// 应用排序
	if len(req.Sort) > 0 {
		for _, sort := range req.Sort {
			if err := quotaPoolService.ValidateSortField(sort.Field); err != nil {
				return nil, err
			}

			dbField, err := quotaPoolService.GetDbFieldName(sort.Field)
			if err != nil {
				return nil, err
			}

			orderDirection := "ASC"
			if sort.Order == "desc" {
				orderDirection = "DESC"
			}
			model = model.Order(fmt.Sprintf("%s %s", dbField, orderDirection))
		}
	} else {
		// 默认按创建时间倒序排列
		model = model.OrderDesc(dao.QuotapoolQuotaPool.Columns().CreatedAt)
	}

	// 应用分页
	if !req.Pagination.All {
		offset := (req.Pagination.Page - 1) * req.Pagination.PageSize
		model = model.Limit(req.Pagination.PageSize).Offset(offset)
	}

	// 构建响应
	res = &v1.FilterQuotaPoolRes{
		Total:      total,
		Page:       req.Pagination.Page,
		PageSize:   req.Pagination.PageSize,
		TotalPages: int(math.Ceil(float64(total) / float64(req.Pagination.PageSize))),
		IsAll:      req.Pagination.All,
	}

	// 查询配额池信息
	var quotaPools []entity.QuotapoolQuotaPool
	err = model.Scan(&quotaPools)
	if err != nil {
		return nil, gerror.Wrap(err, "查询配额池信息失败")
	}
	res.Items = quotaPools

	return res, nil
}
