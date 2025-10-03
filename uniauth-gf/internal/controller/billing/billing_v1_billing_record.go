package billing

import (
	"context"
	"log"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"

	v1 "uniauth-gf/api/billing/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/exchangeRate"
)

/*
计费请求接收控制器

注意，本函数不再检查：

1. 该用户有没有钱使用产品（因为这里已经是计费了）；

2. 该用户有没有权限使用本产品，也不对 Svc 和 Product 的正确性做校验；

3. 不校验本用户有没有权限使用本配额池。
*/
func (c *ControllerV1) BillingRecord(ctx context.Context, req *v1.BillingRecordReq) (res *v1.BillingRecordRes, err error) {
	res = &v1.BillingRecordRes{}
	defer func() {
		if err != nil {
			res.Ok = false
			err = gerror.Wrapf(err, "计费记录流程失败，操作终止。%v", "")
		}
	}()

	// 根据配额池属性是否为个人自动判断计费方案
	var qp *entity.QuotapoolQuotaPool
	err = dao.QuotapoolQuotaPool.Ctx(ctx).Fields("personal, disabled").Where("quota_pool_name = ?", req.Source).Scan(&qp)
	if err != nil {
		err = gerror.Wrap(err, "获取配额池当前的剩余余额失败")
		return
	}
	if qp == nil {
		err = gerror.New("没有找到这个配额池。请重新检查")
		return
	}
	if qp.Disabled {
		err = gerror.New("这个配额池被禁用了，不能使用")
		return
	}
	
	var plan string 
	if qp.Personal {
		plan = "Included"
	} else {
		plan = "Quota Pool"
	}

	// 记录
	var cost decimal.Decimal
	var rate decimal.Decimal
	if !req.USDCost.IsZero() {
		// 算钱
		rate, err = exchangeRate.GetExchangeRate(ctx, "USD", "CNY")
		if err != nil {
			err = gerror.Wrap(err, "获取汇率失败")
			return
		}

		wrtErr := req.Remark.Set("USD", req.USDCost.String())
		if wrtErr != nil {
			log.Printf("计费流程中 USD 信息写入 Remark 失败。原始计费记录：%v", req)
		}
		wrtErr = req.Remark.Set("USD_CNY_rate", rate.String())
		if wrtErr != nil {
			log.Printf("计费流程中 USD->CNY 汇率信息写入 Remark 失败。原始计费记录：%v", req)
		}
		if !req.CNYCost.IsZero() {
			wrtErr = req.Remark.Set("CNY", req.CNYCost.String())
			if wrtErr != nil {
				log.Printf("计费流程中 CNY 信息写入 Remark 失败。原始计费记录：%v", req)
			}
		}

		cost = req.CNYCost.Add(req.USDCost.Mul(rate))
	} else {
		cost = req.CNYCost
	}
	_, err = dao.BillingCostRecords.Ctx(ctx).Data(g.Map{
		"upn":     req.Upn,
		"svc":     req.Service,
		"product": req.Product,
		"cost":    cost,
		"plan":    plan,
		"source":  req.Source,
		"remark":  req.Remark.MustToJsonString(),
	}).Insert()
	if err != nil {
		return
	}

	// 扣钱流程，使用事务
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先获取基本余额和加油包的情况，用来计算应该扣多少
		type oldQuota struct {
			RemainingQuota decimal.Decimal
			ExtraQuota     decimal.Decimal
		}
		var old_quota oldQuota
		err := dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.Source).LockUpdate().Scan(&old_quota)
		if err != nil {
			return gerror.Wrap(err, "扣费事务中，查询当前基本余额和额外余额失败")
		}
		remaining_quota := old_quota.RemainingQuota
		extra_quota := old_quota.ExtraQuota
		// 1. 优先扣除基本余额的正值部分
		if remaining_quota.IsPositive() {
			deduction := decimal.Min(remaining_quota, cost)
			remaining_quota = remaining_quota.Sub(deduction)
			cost = cost.Sub(deduction)
		}
		// 2. 如果还有剩余费用，则从额外余额中扣除
		if cost.IsPositive() {
			deduction := decimal.Min(extra_quota, cost)
			extra_quota = extra_quota.Sub(deduction)
			cost = cost.Sub(deduction)
		}
		// 3. 如果费用还未扣完，则计入基本余额的欠款
		if cost.IsPositive() {
			remaining_quota = remaining_quota.Sub(cost)
		}

		// 回写数据
		_, err = dao.QuotapoolQuotaPool.Ctx(ctx).Where("quota_pool_name = ?", req.Source).Data(g.Map{
			"remaining_quota": remaining_quota,
			"extra_quota":     extra_quota,
		}).Update()
		if err != nil {
			return gerror.Wrap(err, "扣费事务中，更新扣费后的基本余额和额外余额失败")
		}

		return nil
	})

	res.Ok = true
	return
}
