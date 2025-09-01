package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/container/garray"
)

func (c *ControllerV1) FilterPolicies(ctx context.Context, req *v1.FilterPoliciesReq) (res *v1.FilterPoliciesRes, err error) {
	policies, err := e.GetPolicy()
	if err != nil {
		return nil, err
	}

	subs := garray.NewStrArrayFrom(req.Subs)
	doms := garray.NewStrArrayFrom(req.Doms)
	objs := garray.NewStrArrayFrom(req.Objs)
	acts := garray.NewStrArrayFrom(req.Acts)
	res = &v1.FilterPoliciesRes{
		Policies: [][]string{},
	}
	
	for _, policy := range policies {
		sub, dom, obj, act := policy[0], policy[1], policy[2], policy[3]
		if (subs.Len() == 0 || subs.Contains(sub)) && 
			(doms.Len() == 0 || doms.Contains(dom)) && 
			(objs.Len() == 0 || objs.Contains(obj)) &&
			(acts.Len() == 0 || acts.Contains(act)) {
			res.Policies = append(res.Policies, policy)
		}
	}
	return
}
