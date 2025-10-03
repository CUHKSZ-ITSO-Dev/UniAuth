package auth

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	
	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) AddGrouping(ctx context.Context, req *v1.AddGroupingReq) (res *v1.AddGroupingRes, err error) {
	if req.Skip {
		_, err = e.AddGroupingPoliciesEx(req.Groupings)
	} else {
		_, err = e.AddGroupingPolicies(req.Groupings)
	}
	if err != nil {
		return nil, gerror.Wrap(err, "添加 Grouping Policies 失败")
	}
	return
}
