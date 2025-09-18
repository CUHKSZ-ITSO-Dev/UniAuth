package autoquotapool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/autoquotapool/v1"
)

func (c *ControllerV1) ReevaluateAllRules(ctx context.Context, req *v1.ReevaluateAllRulesReq) (res *v1.ReevaluateAllRulesRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
