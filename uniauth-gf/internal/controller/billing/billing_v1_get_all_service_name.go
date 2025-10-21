package billing

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetAllServiceName(ctx context.Context, req *v1.GetAllServiceNameReq) (res *v1.GetAllServiceNameRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
