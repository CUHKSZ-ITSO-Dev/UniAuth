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

	upns := garray.NewStrArrayFrom(req.Upns)
	roles := garray.NewStrArrayFrom(req.Roles)
	res = &v1.FilterGroupingsRes{
		Groupings: [][]string{},
	}

	for _, group := range groups {
		user, role := group[0], group[1]
		if (upns.Len() == 0 || upns.Contains(user)) &&
			(roles.Len() == 0 || roles.Contains(role)) {
			res.Groupings = append(res.Groupings, group)
		}
	}
	return
}
