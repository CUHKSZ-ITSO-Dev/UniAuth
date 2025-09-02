package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) DeletePolicies(ctx context.Context, req *v1.DeletePoliciesReq) (res *v1.DeletePoliciesRes, err error) {
	if _, err := e.RemovePolicies(req.Policies); err != nil {
		return nil, err
	}
	return
}
