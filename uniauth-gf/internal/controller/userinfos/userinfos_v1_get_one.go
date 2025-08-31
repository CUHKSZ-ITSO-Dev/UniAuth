package userinfos

import (
	"context"

	v1 "uniauth-gf/api/userinfos/v1"

	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) GetOne(ctx context.Context, req *v1.GetOneReq) (res *v1.GetOneRes, err error) {
	res = &v1.GetOneRes{}
	err = g.DB().Model("user_infos").WherePri(req.Upn).Scan(&res)
	return
}
