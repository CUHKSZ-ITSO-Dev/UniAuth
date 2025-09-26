package auth

import (
    "context"

    "uniauth-gf/api/auth/v1"

    "github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) UniauthLogin(ctx context.Context, req *v1.UniauthLoginReq) (res *v1.UniauthLoginRes, err error) {
    res = &v1.UniauthLoginRes{}
    if req.Account == g.Cfg().MustGetWithEnv(ctx, "uniauth.account").String() && req.Password == g.Cfg().MustGetWithEnv(ctx, "uniauth.password").String() {
        res.Ok = true
        // Mark session as logged in
        r := g.RequestFromCtx(ctx)
        if r != nil {
            if err2 := r.Session.Set("auth.loggedIn", true); err2 != nil {
                return res, err2
            }
            if err2 := r.Session.Set("auth.account", req.Account); err2 != nil {
                return res, err2
            }
        }
    } else {
        res.Ok = false
        // Clear login session if present
        r := g.RequestFromCtx(ctx)
        if r != nil {
            if err2 := r.Session.Remove("auth.loggedIn"); err2 != nil {
                return res, err2
            }
            if err2 := r.Session.Remove("auth.account"); err2 != nil {
                return res, err2
            }
        }
    }
    return
}
