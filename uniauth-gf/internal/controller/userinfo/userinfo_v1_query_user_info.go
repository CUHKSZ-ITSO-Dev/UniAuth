package userinfo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/userinfo/v1"
)

func (c *ControllerV1) queryUserInfo(ctx context.Context, req *v1.queryUserInfoReq) (res *v1.queryUserInfoRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
