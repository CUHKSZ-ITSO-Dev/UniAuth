package auth

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllUsersForQuotaPool(ctx context.Context, req *v1.GetAllUsersForQuotaPoolReq) (res *v1.GetAllUsersForQuotaPoolRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
