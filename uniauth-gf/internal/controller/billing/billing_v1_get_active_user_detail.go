package billing

import (
	"context"
	"time"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/shopspring/decimal"
)

func (c *ControllerV1) GetActiveUserDetail(ctx context.Context, req *v1.GetActiveUserDetailReq) (res *v1.GetActiveUserDetailRes, err error) {
	// 如果没有指定天数，默认使用7天
	nDays := req.NDays
	if nDays == 0 {
		nDays = 7
	}

	startOfDay := time.Now().AddDate(0, 0, -nDays)
	res = &v1.GetActiveUserDetailRes{}

	// 查询用户基本信息
	err = dao.UserinfosUserInfos.Ctx(ctx).
		Where("upn = ?", req.Upn).
		Scan(&res.UserInfo)

	// 检查用户
	if err != nil || res.UserInfo.Upn == "" {
		return nil, gerror.Newf("用户 '%s' 不存在", req.Upn)
	}

	// 查询用户的消费统计数据
	type StatsResult struct {
		TotalCost  decimal.Decimal `json:"totalCost"`
		TotalCalls int             `json:"totalCalls"`
		LastActive *string         `json:"lastActive"` // 使用指针来处理 NULL
	}

	var stats StatsResult
	err = dao.BillingCostRecords.Ctx(ctx).
		Where("upn = ?", req.Upn).
		Where("created_at >= ?", startOfDay).
		Fields("COALESCE(SUM(cost), 0) as totalCost, COUNT(*) as totalCalls, MAX(created_at) as lastActive").
		Scan(&stats)
	if err != nil {
		return nil, gerror.Wrap(err, "查询用户统计数据失败")
	}

	// 设置返回值
	res.TotalCost = stats.TotalCost
	res.TotalCalls = stats.TotalCalls
	if stats.LastActive == nil {
		res.LastActive = "暂无活跃记录"
	} else {
		res.LastActive = *stats.LastActive
	}

	return res, nil
}
