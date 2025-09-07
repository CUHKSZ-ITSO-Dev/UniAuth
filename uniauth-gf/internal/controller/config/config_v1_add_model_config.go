package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/config/v1"
)

func (c *ControllerV1) AddModelConfig(ctx context.Context, req *v1.AddModelConfigReq) (res *v1.AddModelConfigRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
