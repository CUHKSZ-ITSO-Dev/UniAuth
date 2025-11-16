package config

import (
	"context"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) AutoQuotaPoolUserCountStats(ctx context.Context, req *v1.AutoQuotaPoolUserCountStatsReq) (res *v1.AutoQuotaPoolUserCountStatsRes, err error) {
	// 获取所有自动配额池规则
	var autoQuotaPoolList []*entity.ConfigAutoQuotaPool
	if err = dao.ConfigAutoQuotaPool.Ctx(ctx).Scan(&autoQuotaPoolList); err != nil {
		err = gerror.Wrap(err, "查询自动配额池规则失败")
		return
	}

	// 构建返回的统计数据
	quotaPoolStats := g.Map{}
	for _, config := range autoQuotaPoolList {
		quotaPoolStats[config.RuleName] = len(config.UpnsCache)
	}

	// 转换为gjson.Json格式
	quotaPoolStatsJson := gjson.New(quotaPoolStats)

	res = &v1.AutoQuotaPoolUserCountStatsRes{
		QuotaPoolStats: quotaPoolStatsJson,
	}
	return
}
