package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	v1 "uniauth-gf/api/config/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) DeleteAutoQuotaPoolConfig(ctx context.Context, req *v1.DeleteAutoQuotaPoolConfigReq) (res *v1.DeleteAutoQuotaPoolConfigRes, err error) {
	res = &v1.DeleteAutoQuotaPoolConfigRes{}

	err = dao.ConfigAutoQuotaPool.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		_, err := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", req.RuleName).
			LockUpdate().
			Count()
		if err != nil {
			return gerror.WrapCode(gcode.CodeDbOperationError, err, "检查规则是否存在失败")
		}

		_, delErr := dao.ConfigAutoQuotaPool.Ctx(ctx).
			Where("rule_name = ?", req.RuleName).
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
