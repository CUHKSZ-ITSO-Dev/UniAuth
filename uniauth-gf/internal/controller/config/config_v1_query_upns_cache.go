package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) QueryUpnsCache(ctx context.Context, req *v1.QueryUpnsCacheReq) (res *v1.QueryUpnsCacheRes, err error) {
	var autoQuotaPoolList []*entity.ConfigAutoQuotaPool
	if err = dao.ConfigAutoQuotaPool.Ctx(ctx).
		WhereIn("rule_name", req.RuleNames).
		Scan(&autoQuotaPoolList); err != nil {
		err = gerror.Wrap(err, "查询自动配额池规则失败")
		return
	}

	// 构建规则名称到UPN缓存列表的映射
	ruleUpnsMap := make(map[string][]string)
	for _, pool := range autoQuotaPoolList {
		ruleUpnsMap[pool.RuleName] = pool.UpnsCache
	}

	// 构建查询结果
	var items []v1.QueryUpnsCacheItem
	for _, ruleName := range req.RuleNames {
		upnsCache, exists := ruleUpnsMap[ruleName]
		if !exists {
			// 如果规则不存在，所有UPN都不在缓存中
			for _, upn := range req.Upns {
				items = append(items, v1.QueryUpnsCacheItem{
					RuleName:      ruleName,
					Upn:           upn,
					IsInUpnsCache: false,
				})
			}
			continue
		}

		// 检查每个UPN是否在缓存中
		for _, upn := range req.Upns {
			isInCache := false
			for _, cachedUpn := range upnsCache {
				if cachedUpn == upn {
					isInCache = true
					break
				}
			}
			items = append(items, v1.QueryUpnsCacheItem{
				RuleName:      ruleName,
				Upn:           upn,
				IsInUpnsCache: isInCache,
			})
		}
	}

	res = &v1.QueryUpnsCacheRes{
		Items: items,
	}
	return
}
