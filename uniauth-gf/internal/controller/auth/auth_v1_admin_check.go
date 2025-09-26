package auth

import (
    "context"
    v1 "uniauth-gf/api/auth/v1"
)

// AdminCheck is an alias of Check, exposing /admin/check with identical behavior.
func (c *ControllerV1) AdminCheck(ctx context.Context, req *v1.AdminCheckReq) (res *v1.CheckRes, err error) {
    return c.Check(ctx, &v1.CheckReq{Sub: req.Sub, Obj: req.Obj, Act: req.Act})
}

