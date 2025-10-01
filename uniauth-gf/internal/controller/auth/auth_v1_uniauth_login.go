package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) UniauthLogin(ctx context.Context, req *v1.UniauthLoginReq) (res *v1.UniauthLoginRes, err error) {
	res = &v1.UniauthLoginRes{}
	if req.Account == g.Cfg().MustGet(ctx, "uniauth.account").String() && req.Password == g.Cfg().MustGet(ctx, "uniauth.password").String() {
		res.Ok = true
	} else {
		res.Ok = false
	}
	return
}
