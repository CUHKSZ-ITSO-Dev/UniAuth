package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/config/v1"
)

func (c *ControllerV1) AddI18nItem(ctx context.Context, req *v1.AddI18nItemReq) (res *v1.AddI18nItemRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
