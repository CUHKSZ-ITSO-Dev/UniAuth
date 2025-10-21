package billing

import (
	"context"
	"fmt"
	"time"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/billing/v1"
)

// GetAllActiveUsers 返回指定天数内活跃用户的简单信息
func (c *ControllerV1) GetAllActiveUsers(ctx context.Context, req *v1.GetAllActiveUsersReq) (res *v1.GetAllActiveUsersRes, err error) {

	// 起始时间
	startOfDay := time.Now().AddDate(0, 0, -req.Days)

	// 统计活跃用户总数
	var totalResult struct {
		Total int `json:"total"`
	}

	err = dao.BillingCostRecords.Ctx(ctx).
		Where("created_at >= ?", startOfDay).
		Fields("COUNT(DISTINCT upn) as total").
		Scan(&totalResult)

	if err != nil {
		return nil, gerror.Wrap(err, "查询活跃用户总数失败")
	}

	total := totalResult.Total

	// 如果没有活跃用户，直接返回空
	if total == 0 {
		return &v1.GetAllActiveUsersRes{
			ActiveUsers: []*v1.ActiveUserSummary{},
			Total:       0,
			Page:        req.Page,
			PageSize:    req.PageSize,
			TotalPages:  0,
		}, nil
	}

	// 创建字段映射表验证和映射排序字段（防止恶意sql注入）
	sortByMap := map[string]string{
		"cost":        "total_cost",
		"calls":       "total_calls",
		"upn":         "upn",
		"last_active": "last_active",
	}

	sortOrderMap := map[string]string{
		"asc":  "ASC",
		"desc": "DESC",
	}

	dbSortBy, ok := sortByMap[req.SortBy]
	if !ok {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "无效的排序字段")
	}

	dbSortOrder, ok := sortOrderMap[req.SortOrder]
	if !ok {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "无效的排序方向")
	}

	// 查询活跃用户详细信息
	//分页计算偏移量计算
	offset := (req.Page - 1) * req.PageSize

	// 参数化查询
	dataSql := fmt.Sprintf(`
		SELECT 
			upn,
			SUM(cost) as total_cost,
			COUNT(*) as total_calls,
			MAX(created_at) as last_active
		FROM billing_cost_records
		WHERE created_at >= $1
		GROUP BY upn
		ORDER BY %s %s
		LIMIT $2 OFFSET $3
	`, dbSortBy, dbSortOrder)

	var activeUsers []*v1.ActiveUserSummary
	err = g.DB().GetScan(ctx, &activeUsers, dataSql, startOfDay, req.PageSize, offset)

	if err != nil {
		return nil, gerror.Wrap(err, "查询活跃用户详情失败")
	}

	// 步骤4：构建响应
	totalPages := (total + req.PageSize - 1) / req.PageSize

	return &v1.GetAllActiveUsersRes{
		ActiveUsers: activeUsers,
		Total:       total,
		Page:        req.Page,
		PageSize:    req.PageSize,
		TotalPages:  totalPages,
	}, nil
}
