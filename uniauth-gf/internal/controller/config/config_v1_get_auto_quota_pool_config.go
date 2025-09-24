package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/config/v1"
)

func (c *ControllerV1) GetAutoQuotaPoolConfig(ctx context.Context, req *v1.GetAutoQuotaPoolConfigReq) (res *v1.GetAutoQuotaPoolConfigRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
