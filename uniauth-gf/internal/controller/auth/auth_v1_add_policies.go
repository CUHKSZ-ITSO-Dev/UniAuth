package auth

import (
	"context"

	v1 "uniauth-gf/api/auth/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) AddPolicies(ctx context.Context, req *v1.AddPoliciesReq) (res *v1.AddPoliciesRes, err error) {
	if req.Skip {
		if _, err := e.AddPoliciesEx(req.Policies); err != nil {
			return nil, gerror.Wrap(err, "添加规则时 Casbin 发生内部错误")
		}
	} else {
		if status, err := e.AddPolicies(req.Policies); err != nil {
			return nil, gerror.Wrap(err, "添加规则时 Casbin 发生内部错误")
		} else if !status {
			return nil, gerror.New("添加规则时出现重复规则，立即终止并回滚")
		}
	}
	return
}
