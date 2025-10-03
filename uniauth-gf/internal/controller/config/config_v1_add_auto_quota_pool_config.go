package config

import (
    "context"

    "github.com/gogf/gf/v2/errors/gerror"
    "github.com/robfig/cron/v3"

    v1 "uniauth-gf/api/config/v1"
    "uniauth-gf/internal/dao"
    "uniauth-gf/internal/service/autoQuotaPool"
)

func (c *ControllerV1) AddAutoQuotaPoolConfig(ctx context.Context, req *v1.AddAutoQuotaPoolConfigReq) (res *v1.AddAutoQuotaPoolConfigRes, err error) {
	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}
    if _, err = dao.ConfigAutoQuotaPool.Ctx(ctx).Where("rule_name = ?", req.RuleName).Data(req).Insert(); err != nil {
        return nil, gerror.Wrap(err, "新增自动配额池规则失败")
    }
    // 插入成功后，立即同步该规则的 upns_cache，保证一致性
    if _, err := autoQuotaPool.SyncUpnsCache(ctx, []string{req.RuleName}); err != nil {
        return nil, gerror.Wrap(err, "新增后同步 upns_cache 失败")
    }
    return &v1.AddAutoQuotaPoolConfigRes{OK: true}, nil
}
