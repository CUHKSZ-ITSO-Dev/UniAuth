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
	// 1. 先获取自动配额池配置（短事务）
	var autoQuotaPoolConfig *entity.ConfigAutoQuotaPool
	err := dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		if err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", ruleName).
			LockUpdate().
			Scan(&autoQuotaPoolConfig); err != nil {
			return gerror.Wrapf(err, "获取自动配额池配置 %v 失败", ruleName)
		}
		return nil
	})
	if err != nil {
		return err
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

	// 4. 批量查询现有的个人配额池（短事务）
	var existingQuotaPools []*entity.QuotapoolQuotaPool
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		if err := dao.QuotapoolQuotaPool.Ctx(ctx).
			WhereIn("quota_pool_name", personalQuotaPoolNames).
			LockUpdate().
			Scan(&existingQuotaPools); err != nil {
			return gerror.Wrapf(err, "批量查询个人配额池失败")
		}
		return nil
	})
	if err != nil {
		return err
	}

	// 5. 构建更新数据，分离需要更新剩余配额和不需要更新的记录
	type quotaPoolUpdate struct {
		name string
		data g.Map
	}

	var updateWithoutRemainingQuota []string
	var updatesWithRemaining []quotaPoolUpdate

	existingPoolMap := make(map[string]*entity.QuotapoolQuotaPool)
	for _, pool := range existingQuotaPools {
		existingPoolMap[pool.QuotaPoolName] = pool
	}

	targetCronCycle := autoQuotaPoolConfig.CronCycle
	targetRegularQuota := autoQuotaPoolConfig.RegularQuota
	targetDisabled := !autoQuotaPoolConfig.Enabled

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

			// 如果基础字段或剩余配额发生变化，则需要更新
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

		if baseFieldsChanged {
			updateWithoutRemainingQuota = append(updateWithoutRemainingQuota, poolName)
		}
	}

	// 6. 执行批量更新操作
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 更新不需要修改剩余配额的记录
		if len(updateWithoutRemainingQuota) > 0 {
			updateData := g.Map{
				"cron_cycle":    targetCronCycle,
				"regular_quota": targetRegularQuota,
				"disabled":      targetDisabled,
			}

			if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
				WhereIn("quota_pool_name", updateWithoutRemainingQuota).
				Data(updateData).
				Update(); err != nil {
				return gerror.Wrapf(err, "批量更新个人配额池失败（不更新剩余配额）")
			}
		}

		// 更新需要修改剩余配额的记录
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
