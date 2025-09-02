package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllRoles(ctx context.Context, req *v1.GetAllRolesReq) (res *v1.GetAllRolesRes, err error) {
	res = &v1.GetAllRolesRes{}
	res.Roles, err = e.GetAllRoles()
	if err != nil {
		return nil, err
	}
	return
}
