package autoQuotaPool

import (
	"context"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

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
