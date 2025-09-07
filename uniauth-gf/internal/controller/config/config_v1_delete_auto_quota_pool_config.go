package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/config/v1"
)

func (c *ControllerV1) DeleteAutoQuotaPoolConfig(ctx context.Context, req *v1.DeleteAutoQuotaPoolConfigReq) (res *v1.DeleteAutoQuotaPoolConfigRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
