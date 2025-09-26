package userinfos

import (
    "context"
    v1 "uniauth-gf/api/userinfos/v1"
)

// AdminGet is an alias of GetOne, exposing /admin/get with identical behavior.
func (c *ControllerV1) AdminGet(ctx context.Context, req *v1.AdminGetReq) (res *v1.GetOneRes, err error) {
    return c.GetOne(ctx, &v1.GetOneReq{Upn: req.Upn})
}

