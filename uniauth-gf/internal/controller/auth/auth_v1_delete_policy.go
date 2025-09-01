package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) DeletePolicy(ctx context.Context, req *v1.DeletePolicyReq) (res *v1.DeletePolicyRes, err error) {
	if _, err := e.RemovePolicy(req.Sub, req.Dom, req.Obj, req.Act); err != nil {
		return nil, err
	}
	return
}
