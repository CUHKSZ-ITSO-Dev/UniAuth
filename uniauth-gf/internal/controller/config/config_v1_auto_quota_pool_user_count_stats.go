package config

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/autoQuotaPool"
)

func (c *ControllerV1) AutoQuotaPoolUserCountStats(ctx context.Context, req *v1.AutoQuotaPoolUserCountStatsReq) (res *v1.AutoQuotaPoolUserCountStatsRes, err error) {
	// 获取所有自动配额池规则
	var autoQuotaPoolList []*entity.ConfigAutoQuotaPool
	if err = dao.ConfigAutoQuotaPool.Ctx(ctx).Scan(&autoQuotaPoolList); err != nil {
		err = gerror.Wrap(err, "查询自动配额池规则失败")
		return
	}

	// 提取所有规则名称
	var ruleNames []string
	for _, config := range autoQuotaPoolList {
		ruleNames = append(ruleNames, config.RuleName)
	}

	// 调用SyncUpnsCache更新所有配额池的缓存并获取用户数统计
	matchedUserCountMap, err := autoQuotaPool.SyncUpnsCache(ctx, ruleNames)
	if err != nil {
		err = gerror.Wrap(err, "同步自动配额池缓存失败")
		return
	}

	// 构建返回的统计数据
	quotaPoolStats := g.Map{}
	for ruleName, userCount := range matchedUserCountMap {
		quotaPoolStats[ruleName] = g.Map{
			"userCount": userCount,
		}
	}

	// 转换为gjson.Json格式
	quotaPoolStatsJson := gjson.New(quotaPoolStats)

	res = &v1.AutoQuotaPoolUserCountStatsRes{
		QuotaPoolStats: quotaPoolStatsJson,
	}
	return
}
