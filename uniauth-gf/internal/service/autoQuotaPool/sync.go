package autoQuotaPool

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"

	userinfosV1 "uniauth-gf/api/userinfos/v1"
	userinfos "uniauth-gf/internal/controller/userinfos"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"
)

// SyncUpnsCache 重新计算并回写指定规则的 upns_cache，返回每个自动配额池的用户数 Map。
func SyncUpnsCache(ctx context.Context, ruleNames []string) (matchedUserCountMap g.MapStrInt, err error) {
	matchedUserCountMap = g.MapStrInt{}
	if err := dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var autoQuotaPoolList []*entity.ConfigAutoQuotaPool
		// 一次性拿到所有数据并锁定数据表，避免逐条锁定导致数据库死锁
		if err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			OmitEmpty().
			WhereIn("rule_name", ruleNames).
			LockUpdate().
			Scan(&autoQuotaPoolList); err != nil {
			return gerror.Wrapf(err, "获取自动配额池 %v 记录失败", ruleNames)
		}

		// 计算需要更新的数据
		updateData := g.MapStrAny{}
		for _, config := range autoQuotaPoolList {
			var cfgFilterGroup userinfosV1.FilterGroup
			if err := config.FilterGroup.Scan(&cfgFilterGroup); err != nil {
				return gerror.Wrapf(err, "解析 自动配额池 %v FilterGroup 失败", config.RuleName)
			}
			if upnListRes, err := userinfos.NewV1().Filter(ctx, &userinfosV1.FilterReq{
				Filter: &cfgFilterGroup,
				Pagination: &userinfosV1.PaginationReq{
					All: true,
				},
				Verbose: false,
			}); err != nil {
				return gerror.Wrapf(err, "根据 FilterGroup 筛选用户失败")
			} else {
				updateData[config.RuleName] = g.Map{
					"upns_cache":        upnListRes.UserUpns,
					"last_evaluated_at": gtime.Now(),
				}
				matchedUserCountMap[config.RuleName] = len(upnListRes.UserUpns)
			}
		}

		// 写入数据库 upns_cache 和 last_evaluated_at
		// 考虑了一下自动配额池应该不会有太多，就不继续优化成一次 SQL 操作了
		for ruleName, data := range updateData {
			if _, err := dao.ConfigAutoQuotaPool.
				Ctx(ctx).
				Where("rule_name", ruleName).
				Data(data).
				Update(); err != nil {
				return gerror.Wrapf(err, "更新自动配额池 %v upns_cache 失败", ruleName)
			}
		}
		return nil
	}); err != nil {
		err = gerror.Wrapf(err, "同步 upns_cache 事务失败，所有操作已回滚")
		return g.MapStrInt{}, err
	}
	return
}

// SyncPersonalQuotaPools 根据自动配额池规则名称，更新所有个人配额池配置
func SyncPersonalQuotaPools(ctx context.Context, ruleName string) error {
	// 1. 获取自动配额池配置
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
	err := dao.QuotapoolQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
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

func SyncAutoQuotaPoolCasbinRules(ctx context.Context, ruleNames []string) error {
	type CasbinRule struct {
		Obj string `json:"obj" dc:"资源对象"`
		Act string `json:"act" dc:"动作"`
		Eft string `json:"eft" dc:"效果"`
	}

	e := casbin.GetEnforcer()

	for _, ruleName := range ruleNames {
		// 1. 删除指定规则名称的所有现有策略
		subject := "auto_qp_" + ruleName
		if removed, err := e.RemoveFilteredPolicy(0, subject); err != nil {
			return gerror.Wrapf(err, "删除自动配额池规则 %s 的现有策略失败", ruleName)
		} else if removed {
			g.Log().Infof(ctx, "成功删除了自动配额池规则 %s 的现有策略", ruleName)
		} else {
			g.Log().Infof(ctx, "自动配额池规则 %s 没有现有策略需要删除", ruleName)
		}
	}

	// 2. 查询指定的自动配额池规则
	var autoQuotaPoolList []*entity.ConfigAutoQuotaPool
	if err := dao.ConfigAutoQuotaPool.Ctx(ctx).
		WhereIn("rule_name", ruleNames).
		Scan(&autoQuotaPoolList); err != nil {
		return gerror.Wrapf(err, "查询自动配额池规则失败: %v", ruleNames)
	}

	// 3. 收集所有需要添加的casbin策略
	var allPolicies [][]string

	for _, config := range autoQuotaPoolList {
		if config.DefaultCasbinRules == nil {
			continue
		}
		var casbinRules []CasbinRule
		if err := config.DefaultCasbinRules.Scan(&casbinRules); err != nil {
			return gerror.Wrapf(err, "解析自动配额池规则 %s 的 default_casbin_rules 失败", config.RuleName)
		}

		// 为每个规则生成casbin策略
		for _, rule := range casbinRules {
			// 构建casbin策略: p, auto_qp_{rule_name}, {resource}, {action}, {effect}
			policy := []string{
				"auto_qp_" + config.RuleName, // subject
				rule.Obj,                     // object (resource)
				rule.Act,                     // action
				rule.Eft,                     // effect
			}
			allPolicies = append(allPolicies, policy)
		}
	}

	// 4. 添加新策略
	if len(allPolicies) == 0 {
		g.Log().Infof(ctx, "没有策略需要添加")
		return nil
	}
	if added, err := e.AddPolicies(allPolicies); err != nil {
		return gerror.Wrapf(err, "添加casbin策略失败: %v", allPolicies)
	} else if added {
		g.Log().Infof(ctx, "成功添加了 %d 条casbin策略", len(allPolicies))
	} else {
		g.Log().Infof(ctx, "没有新策略需要添加")
	}

	return nil
}

func SyncAutoQuotaPoolGroupingPolicies(ctx context.Context, ruleNames []string) error {
	e := casbin.GetEnforcer()

	return dao.ConfigAutoQuotaPool.Transaction(ctx, func(txCtx context.Context, _ gdb.TX) error {
		// 1. 查询自动配额池配置
		var poolList []*entity.ConfigAutoQuotaPool
		if err := dao.ConfigAutoQuotaPool.Ctx(txCtx).
			WhereIn("rule_name", ruleNames).
			LockUpdate().
			Scan(&poolList); err != nil {
			return gerror.Wrapf(err, "查询自动配额池配置失败: %v", ruleNames)
		}
		if len(poolList) == 0 {
			return nil
		}

		type poolContext struct {
			autoRole       string
			targetSubjects map[string]struct{}
		}

		// 2. 构建角色和主体映射
		poolMap := make(map[string]*poolContext, len(poolList))
		autoRoles := make([]string, 0, len(poolList))
		for _, pool := range poolList {
			autoRole := "auto_qp_" + pool.RuleName
			ctx := &poolContext{
				autoRole:       autoRole,
				targetSubjects: make(map[string]struct{}, len(pool.UpnsCache)),
			}
			for _, upn := range pool.UpnsCache {
				subject := "personal-" + upn
				ctx.targetSubjects[subject] = struct{}{}
			}
			poolMap[autoRole] = ctx
			autoRoles = append(autoRoles, autoRole)
		}

		// 3. 查询现有Casbin分组策略
		existingSubjectsByRole := make(map[string]map[string]struct{}, len(autoRoles))
		if len(autoRoles) > 0 {
			for _, role := range autoRoles {
				users, err := e.GetUsersForRole(role)
				if err != nil {
					return gerror.Wrapf(err, "查询角色 %s 的用户失败", role)
				}
				existingSubjectsByRole[role] = make(map[string]struct{}, len(users))
				for _, user := range users {
					existingSubjectsByRole[role][user] = struct{}{}
				}
			}
			totalSubjects := 0
			for _, subjects := range existingSubjectsByRole {
				totalSubjects += len(subjects)
			}
		}

		var policiesToAdd [][]string
		var policiesToRemove [][]string

		// 4. 计算策略差异
		for role, ctx := range poolMap {
			existingSubjects := existingSubjectsByRole[role]
			if existingSubjects == nil {
				existingSubjects = map[string]struct{}{}
			}
			for subject := range ctx.targetSubjects {
				if _, ok := existingSubjects[subject]; !ok {
					policiesToAdd = append(policiesToAdd, []string{subject, role})
				}
			}
			for subject := range existingSubjects {
				if _, ok := ctx.targetSubjects[subject]; !ok {
					policiesToRemove = append(policiesToRemove, []string{subject, role})
				}
			}
		}

		// 5. 批量更新Casbin策略
		if len(policiesToAdd) > 0 {
			if _, err := e.AddGroupingPolicies(policiesToAdd); err != nil {
				return gerror.Wrap(err, "批量新增 Casbin 分组失败")
			}
		}
		if len(policiesToRemove) > 0 {
			if _, err := e.RemoveGroupingPolicies(policiesToRemove); err != nil {
				return gerror.Wrap(err, "批量删除 Casbin 分组失败")
			}
		}
		return nil
	})
}
