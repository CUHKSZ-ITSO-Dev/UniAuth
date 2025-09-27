package auth

import (
	"context"
	"math"
	"fmt"
	"strings"

	v1 "uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) FilterPolicies(ctx context.Context, req *v1.FilterPoliciesReq) (res *v1.FilterPoliciesRes, err error) {
	policies, err := e.GetPolicy()
	if err != nil {
		return nil, gerror.Wrap(err, "获取规则失败")
	}

	var resPolicies = [][]string{}
	for _, policy := range policies {
		sub, obj, act, eft := policy[0], policy[1], policy[2], policy[3]
		if strings.Contains(sub, req.Sub) &&
			strings.Contains(obj, req.Obj) &&
			strings.Contains(act, req.Act) &&
			strings.Contains(eft, req.Eft) &&
			strings.Contains(fmt.Sprintf("p, %v, %v, %v, %v", sub, obj, act, eft), req.Rule) {
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