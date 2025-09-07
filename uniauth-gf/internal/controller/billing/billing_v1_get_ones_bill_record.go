package billing

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/billing/v1"
)

func (c *ControllerV1) GetOnesBillRecord(ctx context.Context, req *v1.GetOnesBillRecordReq) (res *v1.GetOnesBillRecordRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
