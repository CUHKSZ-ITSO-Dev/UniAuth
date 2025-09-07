package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/quotaPool/v1"
)

func (c *ControllerV1) BatchQuotaPoolDisabled(ctx context.Context, req *v1.BatchQuotaPoolDisabledReq) (res *v1.BatchQuotaPoolDisabledRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
