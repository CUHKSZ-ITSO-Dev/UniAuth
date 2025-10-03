package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) EditPolicy(ctx context.Context, req *v1.EditPolicyReq) (res *v1.EditPolicyRes, err error) {
	if _, err := e.UpdatePolicy(req.OldPolicy, req.NewPolicy); err != nil {
		return nil, gerror.Wrap(err, "编辑 Policy 失败")
	}
	return
}
