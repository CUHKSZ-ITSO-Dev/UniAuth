package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) DeletePolicies(ctx context.Context, req *v1.DeletePoliciesReq) (res *v1.DeletePoliciesRes, err error) {
	if _, err := e.RemovePolicies(req.Policies); err != nil {
		return nil, gerror.Wrap(err, "删除 Polices 失败")
	}
	return
}
