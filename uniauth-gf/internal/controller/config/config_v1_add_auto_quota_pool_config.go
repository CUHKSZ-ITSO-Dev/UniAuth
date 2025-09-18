package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/robfig/cron/v3"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
)

func (c *ControllerV1) AddAutoQuotaPoolConfig(ctx context.Context, req *v1.AddAutoQuotaPoolConfigReq) (res *v1.AddAutoQuotaPoolConfigRes, err error) {
	res = &v1.AddAutoQuotaPoolConfigRes{}

	// 校验 cron 表达式
	if _, cronErr := cron.ParseStandard(req.CronCycle); cronErr != nil {
		err = gerror.Newf("cronCycle 无效: %v", cronErr)
		return
	}

	err = dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 基本唯一性校验：rule_name 不重复
		count, err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", req.RuleName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.Wrap(err, "检查规则是否存在失败")
		}
		if count > 0 {
			return gerror.Newf("规则已存在: %s", req.RuleName)
		}

		// 插入
		now := gtime.Now()
		data := &entity.ConfigAutoQuotaPool{
			RuleName:     req.RuleName,
			Description:  req.Description,
			CronCycle:    req.CronCycle,
			RegularQuota: req.RegularQuota,
			Enabled:      req.Enabled,
			FilterGroup:  nil,
			Priority:     req.Priority,
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if req.FilterGroup != nil {
			data.FilterGroup = gjson.New(req.FilterGroup)
		}

		if _, err = dao.ConfigAutoQuotaPool.Ctx(ctx).Data(data).Insert(); err != nil {
			return gerror.Wrap(err, "新增自动配额池规则失败")
		}
		return nil
	})
	if err != nil {
		return
	}

	res.OK = true
	return
}
