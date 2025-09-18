package autoquotapool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/autoquotapool/v1"
)

func (c *ControllerV1) GetAutoQuotaPoolRules(ctx context.Context, req *v1.GetAutoQuotaPoolRulesReq) (res *v1.GetAutoQuotaPoolRulesRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
