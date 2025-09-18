package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/robfig/cron/v3"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) EditAutoQuotaPoolConfig(ctx context.Context, req *v1.EditAutoQuotaPoolConfigReq) (res *v1.EditAutoQuotaPoolConfigRes, err error) {
	res = &v1.EditAutoQuotaPoolConfigRes{}

	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}

	err = dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		count, err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", req.RuleName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.Wrap(err, "检查规则是否存在失败")
		}
		if count == 0 {
			return gerror.Newf("规则不存在: %s", req.RuleName)
		}

		data := g.Map{
			"cron_cycle":    req.CronCycle,
			"regular_quota": req.RegularQuota,
			"enabled":       req.Enabled,
			"description":   req.Description,
			"priority":      req.Priority,
			"updated_at":    gtime.Now(),
		}
		if req.FilterGroup != nil {
			data["filter_group"] = gjson.New(req.FilterGroup)
		}

		if _, err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", req.RuleName).
			Data(data).
			Update(); err != nil {
			return gerror.Wrap(err, "更新自动配额池规则失败")
		}
		return nil
	})
	if err != nil {
		return
	}

	res.OK = true
	return
}
