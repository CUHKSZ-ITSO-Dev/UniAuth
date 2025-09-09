package billing

import (
	"context"
	"errors"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/service/exchangeRate"
)

/*
计费请求接收控制器

注意，本函数不再检查：

1. 该用户有没有钱使用产品（因为这里已经是计费了）；

2. 该用户有没有权限使用本产品，也不对 Svc 和 Product 的正确性做校验。
*/
func (c *ControllerV1) BillingRecord(ctx context.Context, req *v1.BillingRecordReq) (res *v1.BillingRecordRes, err error) {
	res = &v1.BillingRecordRes{}
	defer func() {
		if err != nil {
			res.Ok = false
			err = gerror.Wrapf(err, "计费记录流程失败，操作终止。原始请求：%v", req)
		}
	}()
	
	// 校验配额池 Plan 和 Source 的数据
	value, err := dao.QuotapoolQuotaPool.Ctx(ctx).Fields("personal").Where("quota_pool_name = ?", req.Source).Value()
	if err != nil {
		return
	}
	if value == nil {
		err = errors.New("没有找到这个配额池。请重新检查")
		return
	}
	if req.Plan == "Included" && !(value.Bool()) {
		err = errors.New("计费请求中 Plan 声明计划为 Included，但声明的 Source 非个人配额池")
		return
	}

	// 算钱
	rate, err := exchangeRate.GetExchangeRate(ctx, "USD", "CNY")
	if err != nil {
		return
	}
	cost := req.CNYCost.Add(req.USDCost.Mul(rate))

	// 记录
	if req.USDCost != decimal.Zero {
		req.Remark.Set("USD", req.USDCost)
		req.Remark.Set("USD_CNY_rate", rate)
		if req.CNYCost != decimal.Zero {
			req.Remark.Set("CNY", req.CNYCost)
		}
	}
	_, err = dao.BillingCostRecords.Ctx(ctx).Data(g.Map{
		"upn":     req.Upn,
		"svc":     req.Service,
		"product": req.Product,
		"cost":    cost,
		"plan":    req.Plan,
		"source":  req.Source,
		"remark":  req.Remark.MustToJsonString(),
	}).Insert()
	if err != nil {
		return
	}

	// 扣钱流程，使用事务
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先获取基本余额和加油包的情况，用来计算应该扣多少
		var remaining_quota decimal.Decimal
		var extra_quota decimal.Decimal
		targetQuotaPool := dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.Source).LockUpdate()

		err := targetQuotaPool.Scan(&remaining_quota, &extra_quota)
		if err != nil {
			return gerror.Wrap(err, "扣费事务中，查询当前基本余额和额外余额失败")
		}
		if remaining_quota.Cmp(cost) < 0 {
			// 基本余额不够扣，需要从额外余额中扣除一部分
			extra_quota = extra_quota.Sub(cost.Sub(remaining_quota))
			remaining_quota = decimal.Zero
		} else {
			// 正常扣
			remaining_quota = remaining_quota.Sub(cost)
		}

		// 回写数据
		_, err = targetQuotaPool.Data(g.Map{
			"remaining_quota": remaining_quota,
			"extra_quota":     extra_quota,
		}).Update()
		if err != nil {
			return gerror.Wrap(err, "扣费事务中，更新扣扣费后的基本余额和额外余额失败")
		}

		return nil
	})

	res.Ok = true
	return 
}
