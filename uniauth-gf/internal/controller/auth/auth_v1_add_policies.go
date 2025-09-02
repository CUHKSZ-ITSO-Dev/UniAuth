package auth

import (
	"context"
	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) AddPolicies(ctx context.Context, req *v1.AddPoliciesReq) (res *v1.AddPoliciesRes, err error) {
	if req.Skip {
		if _, err := e.AddPoliciesEx(req.Policies); err != nil {
			return nil, err
		}
	} else {
		if _, err := e.AddPolicies(req.Policies); err != nil {
			return nil, err
		}
	}
	return
}
