package quotaPool

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/quotaPool/v1"
)

func (c *ControllerV1) DeleteQuotaPool(ctx context.Context, req *v1.DeleteQuotaPoolReq) (res *v1.DeleteQuotaPoolRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
