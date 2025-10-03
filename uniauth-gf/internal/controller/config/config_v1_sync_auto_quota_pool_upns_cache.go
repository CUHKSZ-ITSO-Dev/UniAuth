package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/service/autoQuotaPool"
)

func (c *ControllerV1) SyncAutoQuotaPoolUpnsCache(ctx context.Context, req *v1.SyncAutoQuotaPoolUpnsCacheReq) (res *v1.SyncAutoQuotaPoolUpnsCacheRes, err error) {
	if matchedUserCountMap, syncErr := autoQuotaPool.SyncUpnsCache(ctx, req.RuleName); syncErr != nil {
		err = gerror.Wrap(syncErr, "同步所有规则 upns_cache 失败")
		return
	} else {
		res = &v1.SyncAutoQuotaPoolUpnsCacheRes{}
		res.MatchedUserCount = matchedUserCountMap
		for k := range matchedUserCountMap{
			res.UpdatedRules = append(res.UpdatedRules, k)
		}
		res.OK = true
		return
	}
}
