package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/config/v1"
)

func (c *ControllerV1) DeleteModelConfig(ctx context.Context, req *v1.DeleteModelConfigReq) (res *v1.DeleteModelConfigRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
