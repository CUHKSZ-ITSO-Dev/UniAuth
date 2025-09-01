package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

func (c *ControllerV1) GetAllObjects(ctx context.Context, req *v1.GetAllObjectsReq) (res *v1.GetAllObjectsRes, err error) {
	res = &v1.GetAllObjectsRes{}
	res.Objects, err = e.GetAllObjects()
	if err != nil {
		return nil, err
	}
	return
}
