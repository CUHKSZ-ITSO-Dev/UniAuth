package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DeleteAutoQuotaPoolConfig(ctx context.Context, req *v1.DeleteAutoQuotaPoolConfigReq) (res *v1.DeleteAutoQuotaPoolConfigRes, err error) {
	res = &v1.DeleteAutoQuotaPoolConfigRes{}

	// 支持从查询参数获取 ruleName
	r := g.RequestFromCtx(ctx)
	ruleName := r.GetQuery("ruleName").String()
	if ruleName == "" {
		ruleName = req.RuleName
	}
	if ruleName == "" {
		err = gerror.NewCodef(gcode.CodeMissingParameter, "ruleName 必填")
		return
	}

	err = dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		count, err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", ruleName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "检查规则是否存在失败")
		}
		if count == 0 {
			return gerror.NewCodef(gcode.CodeNotFound, "规则不存在: %s", ruleName)
		}

		_, delErr := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", ruleName).
			Delete()
		if delErr != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, delErr, "删除规则失败")
		}
		return nil
	})
	if err != nil {
		return
	}

	res.OK = true
	return
}
