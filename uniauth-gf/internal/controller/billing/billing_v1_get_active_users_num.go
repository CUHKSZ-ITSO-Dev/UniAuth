package billing

import (
	"context"
	"time"

	v1 "uniauth-gf/api/billing/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetActiveUsersNum(ctx context.Context, req *v1.GetActiveUsersNumReq) (res *v1.GetActiveUsersNumRes, err error) {
	// 默认返回30天内的活跃用户数
	if req.Days == 0 {
		req.Days = 30
	}

	// 串行查询：每天的活跃用户数 + 总活跃用户数
	activeUsersMap, totalActiveUsers, err := c.billingService.GetActiveUsersData(ctx, req.Days)
	if err != nil {
		return nil, gerror.Wrap(err, "查询活跃用户数失败")
	}

	// 串行查询：系统总用户数
	totalUsers, err := c.billingService.GetTotalUsersCount(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "查询总用户数失败")
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
		activeRateInc := c.billingService.CalculateActiveRateIncrease(activeUsersNum, prevActiveUsersNum)

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
