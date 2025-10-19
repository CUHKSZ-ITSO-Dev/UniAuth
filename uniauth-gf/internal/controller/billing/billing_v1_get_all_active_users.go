package billing

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	"uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetAllActiveUsers(ctx context.Context, req *v1.GetAllActiveUsersReq) (res *v1.GetAllActiveUsersRes, err error) {
	// 计算近多少天活跃用户总数
	countSql := `
        SELECT COUNT(DISTINCT upn) as total
        FROM billing_cost_records  //从billing_cost_records提取参数
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) //时间(近几天)
    `
	totalRecord, err := g.DB().GetOne(ctx, countSql, req.Days)
	if err != nil {
		return nil, err
	}
	total := totalRecord["total"].Int()

	offset := (req.Page - 1) * req.PageSize //偏移量
	dataSql := `
        	SELECT 
            upn,
            SUM(cost) as total_cost,
            COUNT(*) as total_calls,
            MAX(created_at) as last_active
        FROM billing_cost_records
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY upn
        ORDER BY ` + req.SortBy + ` ` + req.SortOrder + `
        LIMIT ?, ?
    `

	var activeUsers []*v1.ActiveUserDetail
	err = g.DB().GetScan(ctx, &activeUsers, dataSql, req.Days, offset, req.PageSize)

	return &v1.GetAllActiveUsersRes{
		ActiveUsers: activeUsers,
		Total:       total,
		Page:        req.Page,
		PageSize:    req.PageSize,
		TotalPages:  (total + req.PageSize - 1) / req.PageSize,
	}, err
}
