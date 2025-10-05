package autoQuotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"

	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

// SyncPersonalQuotaPools 根据自动配额池规则名称，更新所有个人配额池配置
func SyncPersonalQuotaPools(ctx context.Context, ruleName string) error {
	// 1. 先获取自动配额池配置
	var autoQuotaPoolConfig *entity.ConfigAutoQuotaPool
	if err := dao.ConfigAutoQuotaPool.Ctx(ctx).
		Where("rule_name = ?", ruleName).
		LockUpdate().
		Scan(&autoQuotaPoolConfig); err != nil {
		return gerror.Wrapf(err, "获取自动配额池配置 %v 失败", ruleName)
	}

	// 2. 检查是否有影响的用户
	if len(autoQuotaPoolConfig.UpnsCache) == 0 {
		return nil
	}

	// 3. 构建个人配额池名称列表
	personalQuotaPoolNames := make([]string, len(autoQuotaPoolConfig.UpnsCache))
	for i, upn := range autoQuotaPoolConfig.UpnsCache {
		personalQuotaPoolNames[i] = "personal-" + upn
	}

	targetCronCycle := autoQuotaPoolConfig.CronCycle
	targetRegularQuota := autoQuotaPoolConfig.RegularQuota
	targetDisabled := !autoQuotaPoolConfig.Enabled

	// 查询+更新事务
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 4. 批量查询现有的个人配额池
		var existingQuotaPools []*entity.QuotapoolQuotaPool
		if err := dao.QuotapoolQuotaPool.Ctx(ctx).
			WhereIn("quota_pool_name", personalQuotaPoolNames).
			LockUpdate().
			Scan(&existingQuotaPools); err != nil {
			return gerror.Wrapf(err, "批量查询个人配额池失败")
		}

		// 5. 构建更新数据
		type quotaPoolUpdate struct {
			name string
			data g.Map
		}
		updateWithoutRemaining := make([]string, 0)
		updatesWithRemaining := make([]quotaPoolUpdate, 0)

		existingPoolMap := make(map[string]*entity.QuotapoolQuotaPool)
		for _, pool := range existingQuotaPools {
			existingPoolMap[pool.QuotaPoolName] = pool
		}

		for _, poolName := range personalQuotaPoolNames {
			pool, exists := existingPoolMap[poolName]
			if !exists {
				continue
			}

			baseFieldsChanged := pool.CronCycle != targetCronCycle ||
				!pool.RegularQuota.Equal(targetRegularQuota) ||
				pool.Disabled != targetDisabled

			if !pool.Disabled && autoQuotaPoolConfig.Enabled {
				newRegularQuota := targetRegularQuota
				diff := newRegularQuota.Sub(pool.RegularQuota)
				newRemainingQuota := pool.RemainingQuota

				if diff.GreaterThan(decimal.Zero) { // 新常规配额 > 原常规配额
					// 新剩余配额 = 原有剩余配额 + (新常规配额 - 原有常规配额)
					newRemainingQuota = newRemainingQuota.Add(diff)
				} else if diff.LessThan(decimal.Zero) { // 新常规配额 < 原常规配额
					// 新剩余配额 = min{原有剩余配额, 新常规配额}
					if newRegularQuota.LessThan(newRemainingQuota) {
						newRemainingQuota = newRegularQuota
					}
				}
				remainingChanged := !pool.RemainingQuota.Equal(newRemainingQuota)

				// 如果基础字段或剩余配额发生变化，则更新 updateWithRemaining
				if baseFieldsChanged || remainingChanged {
					updateData := g.Map{
						"cron_cycle":      targetCronCycle,
						"regular_quota":   newRegularQuota,
						"disabled":        targetDisabled,
						"remaining_quota": newRemainingQuota,
					}
					updatesWithRemaining = append(updatesWithRemaining, quotaPoolUpdate{
						name: poolName,
						data: updateData,
					})
				}
				continue
			}

			// 如果仅基础字段发生变化，则更新 updateWithoutRemaining
			if baseFieldsChanged {
				updateWithoutRemaining = append(updateWithoutRemaining, poolName)
			}
		}

		// 6. 批量更新个人配额池（不更新剩余配额）
		if len(updateWithoutRemaining) > 0 {
			updateData := g.Map{
				"cron_cycle":    targetCronCycle,
				"regular_quota": targetRegularQuota,
				"disabled":      targetDisabled,
			}

			if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
				WhereIn("quota_pool_name", updateWithoutRemaining).
				Data(updateData).
				Update(); err != nil {
				return gerror.Wrapf(err, "批量更新个人配额池失败（不更新剩余配额）")
			}
		}

		// 7. 批量更新个人配额池（更新剩余配额）
		if len(updatesWithRemaining) > 0 {
			for _, update := range updatesWithRemaining {
				if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
					Where("quota_pool_name", update.name).
					Data(update.data).
					Update(); err != nil {
					return gerror.Wrapf(err, "更新个人配额池失败（更新剩余配额）")
				}
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}
