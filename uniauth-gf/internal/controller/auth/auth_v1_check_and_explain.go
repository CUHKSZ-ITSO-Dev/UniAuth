package auth

import (
	"context"
	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) CheckAndExplain(ctx context.Context, req *v1.CheckAndExplainReq) (res *v1.CheckAndExplainRes, err error) {
	res = &v1.CheckAndExplainRes{}
	res.Allow, res.Reason, err = e.EnforceEx(req.Sub, req.Obj, req.Act)
	if err != nil {
		panic(err)
	}
	return
}
