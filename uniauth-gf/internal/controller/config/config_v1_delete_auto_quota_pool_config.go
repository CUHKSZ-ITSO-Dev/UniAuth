package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
	"uniauth-gf/internal/model/entity"
	"uniauth-gf/internal/service/casbin"
)

func (c *ControllerV1) DeleteAutoQuotaPoolConfig(ctx context.Context, req *v1.DeleteAutoQuotaPoolConfigReq) (res *v1.DeleteAutoQuotaPoolConfigRes, err error) {
	res = &v1.DeleteAutoQuotaPoolConfigRes{}

	err = dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		var configAutoQuotaPool *entity.ConfigAutoQuotaPool
		if err := dao.ConfigAutoQuotaPool.Ctx(ctx).Where("rule_name = ?", req.RuleName).LockUpdate().Scan(&configAutoQuotaPool); err != nil {
			return gerror.Wrap(err, "检查规则是否存在失败")
		}
		if configAutoQuotaPool == nil {
			return gerror.Newf("该规则不存在，请重新检查：%v", req.RuleName)
		}

		_, delErr := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", req.RuleName).
			Delete()
		if delErr != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, delErr, "删除规则失败")
		}

		// 删除Casbin规则
		casbin_subject := "auto_qp_" + req.RuleName
		if _, err := casbin.GetEnforcer().RemoveFilteredPolicy(0, casbin_subject); err != nil {
			return gerror.Wrap(err, "删除自动配额池规则的现有 Casbin 策略失败")
		}
		return nil
	})
	if err != nil {
		err = gerror.Wrap(err, "删除自动配额池规则失败")
		return
	}

	res.OK = true
	return
}
