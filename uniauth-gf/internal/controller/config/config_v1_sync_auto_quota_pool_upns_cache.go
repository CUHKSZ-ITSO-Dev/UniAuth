package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/service/autoQuotaPool"
)

func (c *ControllerV1) SyncAutoQuotaPoolUpnsCache(
	ctx context.Context,
	req *v1.SyncAutoQuotaPoolUpnsCacheReq,
) (res *v1.SyncAutoQuotaPoolUpnsCacheRes, err error) {
	res = &v1.SyncAutoQuotaPoolUpnsCacheRes{
		OK:               false,
		UpdatedRules:     []string{},
		MatchedUserCount: map[string]int{},
	}

	if req.RuleName != "" {
		count, syncErr := autoQuotaPool.SyncOneRuleUpnsCache(ctx, req.RuleName)
		if syncErr != nil {
			err = gerror.Wrap(syncErr, "同步指定规则 upns_cache 失败")
			return
		}
		res.UpdatedRules = []string{req.RuleName}
		res.MatchedUserCount[req.RuleName] = count
		res.OK = true
		return
	}

	// 同步所有
	m, syncErr := autoQuotaPool.SyncAllRulesUpnsCache(ctx)
	if syncErr != nil {
		err = gerror.Wrap(syncErr, "同步所有规则 upns_cache 失败")
		return
	}
	for k, v := range m {
		res.UpdatedRules = append(res.UpdatedRules, k)
		res.MatchedUserCount[k] = v
	}
	g.Log().Infof(ctx, "手动同步 upns_cache 完成，共 %d 条规则", len(res.UpdatedRules))
	res.OK = true
	return
}
