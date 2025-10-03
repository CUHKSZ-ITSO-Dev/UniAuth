package auth

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) EditGrouping(ctx context.Context, req *v1.EditGroupingReq) (res *v1.EditGroupingRes, err error) {
	if _, err := e.UpdateGroupingPolicy(req.OldGrouping, req.NewGrouping); err != nil {
		return nil, gerror.Wrap(err, "编辑 Grouping Policies 失败")
	}
	return
}
