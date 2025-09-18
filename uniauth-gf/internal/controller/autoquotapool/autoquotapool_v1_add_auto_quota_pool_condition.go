package autoquotapool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/autoquotapool/v1"
)

func (c *ControllerV1) AddAutoQuotaPoolCondition(ctx context.Context, req *v1.AddAutoQuotaPoolConditionReq) (res *v1.AddAutoQuotaPoolConditionRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
