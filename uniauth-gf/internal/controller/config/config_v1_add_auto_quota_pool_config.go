package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/robfig/cron/v3"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
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
	return &v1.AddAutoQuotaPoolConfigRes{
		OK: true,
	}, nil
}
