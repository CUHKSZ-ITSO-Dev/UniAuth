package auth

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAvailableModelForQuotaPool(ctx context.Context, req *v1.GetAvailableModelForQuotaPoolReq) (res *v1.GetAvailableModelForQuotaPoolRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
