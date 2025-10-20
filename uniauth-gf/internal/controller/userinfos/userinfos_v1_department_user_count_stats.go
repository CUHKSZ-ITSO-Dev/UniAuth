package userinfos

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/userinfos/v1"
)

func (c *ControllerV1) DepartmentUserCountStats(ctx context.Context, req *v1.DepartmentUserCountStatsReq) (res *v1.DepartmentUserCountStatsRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
