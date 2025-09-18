package auth

import (
	"context"
	"strings"

	v1 "uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) FilterPolicies(ctx context.Context, req *v1.FilterPoliciesReq) (res *v1.FilterPoliciesRes, err error) {
	policies, err := e.GetPolicy()
	if err != nil {
		return nil, err
	}

	res = &v1.FilterPoliciesRes{
		Policies: [][]string{},
	}

	for _, policy := range policies {
		sub, obj, act, eft := policy[0], policy[1], policy[2], policy[3]
		if strings.Contains(sub, req.Sub) &&
			strings.Contains(obj, req.Obj) &&
			strings.Contains(act, req.Act) &&
			strings.Contains(eft, req.Eft) {
			res.Policies = append(res.Policies, policy)
		}
	}
	return
}
