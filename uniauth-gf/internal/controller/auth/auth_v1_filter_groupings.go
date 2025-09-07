package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/container/garray"
)

func (c *ControllerV1) FilterGroupings(ctx context.Context, req *v1.FilterGroupingsReq) (res *v1.FilterGroupingsRes, err error) {
	groups, err := e.GetGroupingPolicy()
	if err != nil {
		return nil, err
	}
	
	users := garray.NewStrArrayFrom(req.Users)
	roles := garray.NewStrArrayFrom(req.Roles)
	domains := garray.NewStrArrayFrom(req.Domains)
	res = &v1.FilterGroupingsRes{
		Groupings: [][]string{},
	}

	for _, group := range groups {
		user, role, domain := group[0], group[1], group[2]
		if (users.Len() == 0 || users.Contains(user)) &&
			(roles.Len() == 0 || roles.Contains(role)) &&
			(domains.Len() == 0 || domains.Contains(domain)) {
			res.Groupings = append(res.Groupings, group)
		}
	}
	return
}
