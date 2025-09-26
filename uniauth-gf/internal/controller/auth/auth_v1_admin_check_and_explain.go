package auth

import (
    "context"
    v1 "uniauth-gf/api/auth/v1"
)

// AdminCheckAndExplain is an alias of CheckAndExplain, exposing /admin/checkEx with identical behavior.
func (c *ControllerV1) AdminCheckAndExplain(ctx context.Context, req *v1.AdminCheckAndExplainReq) (res *v1.CheckAndExplainRes, err error) {
    return c.CheckAndExplain(ctx, &v1.CheckAndExplainReq{Sub: req.Sub, Obj: req.Obj, Act: req.Act})
}

