package auth

import (
	"context"
	"math"
	"strings"

	v1 "uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) FilterPolicies(ctx context.Context, req *v1.FilterPoliciesReq) (res *v1.FilterPoliciesRes, err error) {
	policies, err := e.GetPolicy()
	if err != nil {
		return nil, err
	}

	var resPolicies = [][]string{}
	for _, policy := range policies {
		sub, obj, act, eft := policy[0], policy[1], policy[2], policy[3]
		if strings.Contains(sub, req.Sub) &&
			strings.Contains(obj, req.Obj) &&
			strings.Contains(act, req.Act) &&
			strings.Contains(eft, req.Eft) {
			resPolicies = append(resPolicies, policy)
		}
	}

	res = &v1.FilterPoliciesRes{
		Total:      len(resPolicies),
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: int(math.Ceil(float64(len(resPolicies)) / float64(req.PageSize))),
	}
	if req.Page*req.PageSize > len(resPolicies) {
		res.Policies = resPolicies[(req.Page-1)*req.PageSize:]
	} else {
		res.Policies = resPolicies[(req.Page-1)*req.PageSize : req.Page*req.PageSize]
	}

	return
}
