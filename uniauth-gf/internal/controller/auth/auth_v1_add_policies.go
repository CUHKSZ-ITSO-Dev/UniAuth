package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) AddPolicies(ctx context.Context, req *v1.AddPoliciesReq) (res *v1.AddPoliciesRes, err error) {
	if req.Skip {
		_, err = e.AddPoliciesEx(req.Policies)
	} else {
		_, err = e.AddPolicies(req.Policies)
	}
	if err != nil {
		return nil, gerror.Wrap(err, "添加规则时 Casbin 发生内部错误")
	}
	return
}
