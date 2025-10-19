package billing

import (
	"context"
	"fmt"
	"sync"
	"time"
	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) GetActiveUsersNum(ctx context.Context, req *v1.GetActiveUsersNumReq) (res *v1.GetActiveUsersNumRes, err error) {

	// 默认返回30天内的活跃用户数
	if req.Days == 0 {
		req.Days = 30
	}

	// 对输入参数进行校验
	if req.Days > 365 || req.Days < 1 {
		return nil, fmt.Errorf("days must be between 1 and 365, got: %d", req.Days)
	}

	// 并发查询
	var (
		activeUsersMap   map[string]int
		totalActiveUsers int
		totalUsers       int
		err1, err2       error
		wg               sync.WaitGroup
	)

	wg.Add(2)

	// 并发查询：每天的活跃用户数 + 总活跃用户数
	go func() {
		defer wg.Done()
		activeUsersMap, totalActiveUsers, err1 = c.getActiveUsersData(ctx, req.Days)
	}()

	// 并发查询：系统总用户数
	go func() {
		defer wg.Done()
		totalUsers, err2 = c.getTotalUsersCount(ctx)
	}()

	wg.Wait()

	//抛出错误
	if err1 != nil {
		return nil, gerror.Wrap(err1, "查询活跃用户数失败")
	}
	if err2 != nil {
		return nil, gerror.Wrap(err2, "查询总用户数失败")
	}

	// 构建每日活跃用户列表
	activeUsersList := make([]v1.ActiveUserList, 0, req.Days)

	for i := 0; i < req.Days; i++ {
		date := time.Now().AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")
		prevDateStr := date.AddDate(0, 0, -1).Format("2006-01-02")

		// 从 map 中获取数据
		activeUsers := activeUsersMap[dateStr]
		prevActiveUsers := activeUsersMap[prevDateStr]

		// 计算活跃率增长
		activeRateInc := c.calculateActiveRateIncrease(activeUsers, prevActiveUsers)

		activeUsersList = append(activeUsersList, v1.ActiveUserList{
			ActiveUsersNum: activeUsers,
			ActiveRateInc:  activeRateInc,
			Date:           dateStr,
		})
	}

	// 构建响应
	res = &v1.GetActiveUsersNumRes{
		ActiveUsers:      activeUsersList,
		TotalUsers:       totalUsers,
		TotalActiveUsers: totalActiveUsers,
	}

	return res, nil
}

// 查询返回每天的活跃用户数和总活跃用户数（分两次查询）
func (c *ControllerV1) getActiveUsersData(ctx context.Context, day int) (map[string]int, int, error) {
	// 计算日期范围
	startDate := time.Now().AddDate(0, 0, -(day + 1))
	totalStartDate := time.Now().AddDate(0, 0, -day)

	// 查询每天的活跃用户数
	dailySql := `
        SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT upn) as daily_total
        FROM billing_cost_records
        WHERE created_at >= $1
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    `

	dailyResult, err := g.DB().GetAll(ctx, dailySql, startDate)
	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询每日活跃用户失败")
	}

	// 将结果转换为 map
	activeUsersMap := make(map[string]int, len(dailyResult))
	for _, record := range dailyResult {
		date := record["date"].String()
		dailyTotal := record["daily_total"].Int()
		activeUsersMap[date] = dailyTotal
	}

	// 查询总活跃用户数
	totalSql := `
        SELECT COUNT(DISTINCT upn) as total_active
        FROM billing_cost_records
        WHERE created_at >= $1
    `

	totalResult, err := g.DB().GetOne(ctx, totalSql, totalStartDate)
	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询总活跃用户失败")
	}

	totalActiveUsers := totalResult["total_active"].Int()

	return activeUsersMap, totalActiveUsers, nil
}

// getTotalUsersCount 查询系统总用户数
func (c *ControllerV1) getTotalUsersCount(ctx context.Context) (int, error) {
	countSql := `
        SELECT COUNT(*) as total
        FROM userinfos_user_infos
    `

	result, err := g.DB().GetOne(ctx, countSql)
	if err != nil {
		return 0, err
	}

	return result["total"].Int(), nil
}

// calculateActiveRateIncrease 计算活跃率增长
func (c *ControllerV1) calculateActiveRateIncrease(current, previous int) float64 {
	// 前一天无活跃用户的特殊处理
	if previous == 0 {
		if current == 0 {
			return 0.0
		}
		return 100.0 // 考虑前一天没有但是后一天有的问题
	}

	// 计算增长率
	increase := float64(current - previous)
	rate := (increase / float64(previous)) * 100

	return rate
}
