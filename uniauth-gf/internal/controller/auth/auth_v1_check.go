package auth

import (
	"context"
	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) Check(ctx context.Context, req *v1.CheckReq) (res *v1.CheckRes, err error) {
	res = &v1.CheckRes{}
	res.Allow, err = e.Enforce(req.Sub, req.Dom, req.Obj, req.Act)
	if err != nil {
		panic(err)
	}
	return
}
