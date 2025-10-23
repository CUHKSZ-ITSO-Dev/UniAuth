package billing

import (
	"context"
	"sync"
	"time"
	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetActiveUsersNum(ctx context.Context, req *v1.GetActiveUsersNumReq) (res *v1.GetActiveUsersNumRes, err error) {

	/*// 默认返回30天内的活跃用户数
	if req.Days == 0 {
		req.Days = 30
	}*/

	/*//AI建议如果需要：记录审计日志
	g.Log().Info(ctx, "GetActiveUsersNum called", g.Map{
		"days":      req.Days,
		"client_ip": g.RequestFromCtx(ctx).GetClientIp(),
		"timestamp": time.Now(),
	})*/

	//尝试进行并发查询
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
		activeUsersNum := activeUsersMap[dateStr]
		prevActiveUsersNum := activeUsersMap[prevDateStr]

		// 计算活跃率增长
		activeRateInc := c.calculateActiveRateIncrease(activeUsersNum, prevActiveUsersNum)

		activeUsersList = append(activeUsersList, v1.ActiveUserList{
			ActiveUsersNum: activeUsersNum,
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

// 查询返回每天的活跃用户数和总活跃用户数（并发查询优化）
func (c *ControllerV1) getActiveUsersData(ctx context.Context, day int) (map[string]int, int, error) {
	// 计算日期范围
	startDate := time.Now().AddDate(0, 0, -(day + 1))
	totalStartDate := time.Now().AddDate(0, 0, -day)

	var (
		activeUsersMap   map[string]int
		totalActiveUsers int
		err1, err2       error
		wg               sync.WaitGroup
	)

	wg.Add(2)

	// 并发查询:每天的活跃用户数
	go func() {
		defer wg.Done()

		type DailyActiveUser struct {
			Date       string `json:"date"`
			DailyTotal int    `json:"daily_total"`
		}

		var dailyResult []DailyActiveUser
		err := dao.BillingCostRecords.Ctx(ctx).
			Fields("DATE(created_at) as date, COUNT(DISTINCT upn) as daily_total").
			Where("created_at >= ?", startDate).
			Group("DATE(created_at)").
			Order("date DESC").
			Scan(&dailyResult)

		if err != nil {
			err1 = gerror.Wrap(err, "查询每日活跃用户失败")
			return
		}

		activeUsersMap = make(map[string]int, len(dailyResult))
		for _, record := range dailyResult {
			activeUsersMap[record.Date] = record.DailyTotal
		}
	}()

	// 并发查询:总活跃用户数
	go func() {
		defer wg.Done()

		type TotalActiveUser struct {
			TotalActive int `json:"total_active"`
		}

		var totalResult TotalActiveUser
		err := dao.BillingCostRecords.Ctx(ctx).
			Fields("COUNT(DISTINCT upn) as total_active").
			Where("created_at >= ?", totalStartDate).
			Scan(&totalResult)

		if err != nil {
			err2 = gerror.Wrap(err, "查询总活跃用户失败")
			return
		}

		totalActiveUsers = totalResult.TotalActive
	}()

	// 等待所有goroutine完成
	wg.Wait()

	// 检查错误
	if err1 != nil {
		return nil, 0, err1
	}
	if err2 != nil {
		return nil, 0, err2
	}

	return activeUsersMap, totalActiveUsers, nil
}

// getTotalUsersCount 查询系统总用户数
func (c *ControllerV1) getTotalUsersCount(ctx context.Context) (int, error) {
	count, err := dao.UserinfosUserInfos.Ctx(ctx).Count()
	if err != nil {
		return 0, err
	}
	return count, nil
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
