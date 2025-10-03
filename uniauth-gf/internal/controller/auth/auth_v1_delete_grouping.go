package auth

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) DeleteGrouping(ctx context.Context, req *v1.DeleteGroupingReq) (res *v1.DeleteGroupingRes, err error) {
	if _, err := e.RemoveGroupingPolicies(req.Groupings); err != nil {
		return nil, gerror.Wrap(err, "删除 Grouping Policies 失败")
	}
	return
}
