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
	var updateWithRemainingQuota []string
	var updateWithoutRemainingQuota []string

	existingPoolMap := make(map[string]*entity.QuotapoolQuotaPool)
	for _, pool := range existingQuotaPools {
		existingPoolMap[pool.QuotaPoolName] = pool
	}

	for _, poolName := range personalQuotaPoolNames {
		if pool, exists := existingPoolMap[poolName]; exists {
			// 如果个人配额池当前是启用状态，则需要更新剩余配额
			if !pool.Disabled && autoQuotaPoolConfig.Enabled {
				updateWithRemainingQuota = append(updateWithRemainingQuota, poolName)
			} else {
				updateWithoutRemainingQuota = append(updateWithoutRemainingQuota, poolName)
			}
		}
	}

	// 6. 执行批量更新操作
	updateCount := 0
	err = dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 更新不需要修改剩余配额的记录
		if len(updateWithoutRemainingQuota) > 0 {
			updateData := g.Map{
				"cron_cycle":    autoQuotaPoolConfig.CronCycle,
				"regular_quota": autoQuotaPoolConfig.RegularQuota,
				"disabled":      !autoQuotaPoolConfig.Enabled,
			}

			if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
				WhereIn("quota_pool_name", updateWithoutRemainingQuota).
				Data(updateData).
				Update(); err != nil {
				return gerror.Wrapf(err, "批量更新个人配额池失败（不更新剩余配额）")
			}
			updateCount += len(updateWithoutRemainingQuota)
		}

		// 更新需要修改剩余配额的记录
		if len(updateWithRemainingQuota) > 0 {
			for _, poolName := range updateWithRemainingQuota {
				pool := existingPoolMap[poolName]
				if pool == nil {
					continue
				}

				newRegularQuota := autoQuotaPoolConfig.RegularQuota
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

				updateData := g.Map{
					"cron_cycle":      autoQuotaPoolConfig.CronCycle,
					"regular_quota":   newRegularQuota,
					"disabled":        !autoQuotaPoolConfig.Enabled,
					"remaining_quota": newRemainingQuota,
				}

				if _, err := dao.QuotapoolQuotaPool.Ctx(ctx).
					Where("quota_pool_name", poolName).
					Data(updateData).
					Update(); err != nil {
					return gerror.Wrapf(err, "更新个人配额池失败（更新剩余配额）")
				}
				updateCount++
			}
		}

		return nil
	})
	if err != nil {
		return err
	}
	return nil
}
