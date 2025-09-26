package auth

import (
    "context"

    "uniauth-gf/api/auth/v1"

    "github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) UniauthLogout(ctx context.Context, req *v1.UniauthLogoutReq) (res *v1.UniauthLogoutRes, err error) {
    res = &v1.UniauthLogoutRes{Ok: true}
    r := g.RequestFromCtx(ctx)
    if r != nil {
        if err = r.Session.Remove("auth.loggedIn"); err != nil {
            return res, err
        }
        if err = r.Session.Remove("auth.account"); err != nil {
            return res, err
        }
    }
    return
}
