package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllActions(ctx context.Context, req *v1.GetAllActionsReq) (res *v1.GetAllActionsRes, err error) {
	res = &v1.GetAllActionsRes{}
	res.Actions, err = e.GetAllActions()
	if err != nil {
		return nil, err
	}
	return
}
