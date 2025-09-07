package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/config/v1"
)

func (c *ControllerV1) DeleteI18Config(ctx context.Context, req *v1.DeleteI18ConfigReq) (res *v1.DeleteI18ConfigRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
