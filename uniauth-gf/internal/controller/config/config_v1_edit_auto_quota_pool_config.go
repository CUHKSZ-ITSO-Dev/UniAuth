package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/robfig/cron/v3"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/autoQuotaPool"
	"uniauth-gf/internal/service/casbin"
)

func (c *ControllerV1) EditAutoQuotaPoolConfig(ctx context.Context, req *v1.EditAutoQuotaPoolConfigReq) (res *v1.EditAutoQuotaPoolConfigRes, err error) {
	res = &v1.EditAutoQuotaPoolConfigRes{}

	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}

	err = dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var configAutoQuotaPool *entity.ConfigAutoQuotaPool
		err = dao.ConfigAutoQuotaPool.Ctx(ctx).Where("rule_name = ?", req.RuleName).LockUpdate().Scan(&configAutoQuotaPool)
		if err != nil {
			return gerror.Wrap(err, "查询规则是否存在失败")
		}
		if configAutoQuotaPool == nil {
			return gerror.Newf("该规则不存在，请重新检查：%v", req.RuleName)
		}

		data := g.Map{
			"cron_cycle":    req.CronCycle,
			"regular_quota": req.RegularQuota,
			"enabled":       req.Enabled,
			"description":   req.Description,
			"priority":      req.Priority,
		}
		// 仅当字段在请求中出现时才处理；显式 null 或空对象 {} 则置为数据库 NULL
		if _, ok := g.RequestFromCtx(ctx).GetRequestMap()["filterGroup"]; ok {
			if req.FilterGroup == nil {
				data["filter_group"] = nil
			} else {
				data["filter_group"] = gjson.New(req.FilterGroup)
			}
		}

		if _, ok := g.RequestFromCtx(ctx).GetRequestMap()["defaultCasbinRules"]; ok {
			if req.DefaultCasbinRules == nil {
				data["default_casbin_rules"] = nil
			} else {
				data["default_casbin_rules"] = gjson.New(req.DefaultCasbinRules)
			}
		}

		if _, err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", req.RuleName).
			Data(data).
			Update(); err != nil {
			return gerror.Wrap(err, "更新自动配额池规则失败")
		}

		// 更新成功后，立即同步该规则的 upns_cache，失败则回滚本次事务
		if _, syncErr := autoQuotaPool.SyncUpnsCache(ctx, []string{req.RuleName}); syncErr != nil {
			return gerror.Wrap(syncErr, "编辑后同步 upns_cache 失败")
		}

		// 同步 upns_cache 成功后，更新所有受影响的个人配额池配置
		if updateErr := autoQuotaPool.SyncPersonalQuotaPools(ctx, req.RuleName); updateErr != nil {
			return gerror.Wrap(updateErr, "更新受影响的个人配额池失败")
		}
		if err := casbin.SyncAutoQuotaPoolCasbinRules(ctx, []string{req.RuleName}); err != nil {
			return gerror.Wrap(err, "编辑后同步 casbin 规则失败")
		}
		return nil

	})
	if err != nil {
		err = gerror.Wrap(err, "更新自动配额池规则失败")
		return
	}

	res.OK = true
	return
}
