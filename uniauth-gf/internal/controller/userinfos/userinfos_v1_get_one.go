package userinfos

import (
	"context"

	v1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) GetOne(ctx context.Context, req *v1.GetOneReq) (res *v1.GetOneRes, err error) {
	res = &v1.GetOneRes{}
	err = dao.UserinfosUserInfos.Ctx(ctx).WherePri(req.Upn).Scan(&res)
	return
}
