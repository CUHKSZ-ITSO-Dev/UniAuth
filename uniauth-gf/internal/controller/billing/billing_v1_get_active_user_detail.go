package billing

import (
	"context"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

func (c *ControllerV1) GetActiveUserDetail(ctx context.Context, req *v1.GetActiveUserDetailReq) (res *v1.GetActiveUserDetailRes, err error) {
	startOfDay := gtime.Now().AddDate(0, 0, -req.NDays)
	res = &v1.GetActiveUserDetailRes{}

	// 查询用户基本信息
	err = dao.UserinfosUserInfos.Ctx(ctx).
		Where("upn = ?", req.Upn).
		Scan(&res.UserInfo)
	if err != nil {
		return nil, gerror.Wrap(err, "查询用户基本信息失败")
	}

	// 查询用户的消费统计数据
	type StatsResult struct {
		TotalCost  decimal.Decimal `json:"totalCost"`
		TotalCalls int             `json:"totalCalls"`
		LastActive string          `json:"lastActive"`
	}

	var stats StatsResult
	err = dao.BillingCostRecords.Ctx(ctx).
		Where("upn = ?", req.Upn).
		Where("created_at >= ?", startOfDay).
		Fields("COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as totalCalls, COALESCE(MAX(created_at), '') as lastActive").
		Scan(&stats)
	if err != nil {
		return nil, gerror.Wrap(err, "查询用户统计数据失败")
	}

	res.TotalCost = stats.TotalCost
	res.TotalCalls = stats.TotalCalls
	res.LastActive = stats.LastActive

	return res, nil
}
