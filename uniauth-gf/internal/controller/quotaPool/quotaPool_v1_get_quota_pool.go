package quotaPool

import (
	"context"
	"math"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/quotaPool/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error) {
	var items []v1.QuotaPoolItem

	model := dao.QuotapoolQuotaPool.Ctx(ctx)

	if req.QuotaPoolName != "" { // 指定配额池名称，查询指定配额池
		model = model.Where("quota_pool_name = ?", req.QuotaPoolName)
		err = model.Scan(&items)
		if err != nil {
			return nil, gerror.Wrap(err, "查询配额池列表失败")
		}
		res = &v1.GetQuotaPoolRes{
			Items: items,
		}
		return
	} else { // 未指定配额池名称，查询配额池列表
		// 获取总数（在排序和分页之前）
		total, err := model.Count()
		if err != nil {
			return nil, gerror.Wrap(err, "获取总数失败")
		}

		// 检查是否请求全部数据
		if req.All {
			// 安全检查：防止返回过多数据
			const maxAllLimit = 10000
			if total > maxAllLimit {
				return nil, gerror.Newf("查询结果过多(%d)，超过最大限制(%d)，请添加更精确的过滤条件", total, maxAllLimit)
			}
			// 重置分页参数为全部数据
			req.Page = 1
			req.PageSize = total
		} else {
			// 检查分页参数
			if req.PageSize > 1000 {
				return nil, gerror.New("分页大小不能超过1000")
			}
		}

		model = model.OrderDesc(dao.QuotapoolQuotaPool.Columns().CreatedAt)

		// 应用分页（如果不是查询全部）
		if !req.All {
			offset := (req.Page - 1) * req.PageSize
			model = model.Limit(req.PageSize).Offset(offset)
		}

		err = model.Scan(&items)
		if err != nil {
			return nil, gerror.Wrap(err, "查询配额池列表失败")
		}

		// 构建响应
		res = &v1.GetQuotaPoolRes{
			Total:      total,
			Page:       req.Page,
			PageSize:   req.PageSize,
			TotalPages: int(math.Ceil(float64(total) / float64(req.PageSize))),
			IsAll:      req.All,
			Items:      items,
		}
	}
	return res, nil
}
