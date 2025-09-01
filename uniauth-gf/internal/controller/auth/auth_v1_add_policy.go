package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) AddPolicy(ctx context.Context, req *v1.AddPolicyReq) (res *v1.AddPolicyRes, err error) {
	if _, err := e.AddPolicy(req.Sub, req.Dom, req.Obj, req.Act); err != nil {
		return nil, err
	}
	return
}
