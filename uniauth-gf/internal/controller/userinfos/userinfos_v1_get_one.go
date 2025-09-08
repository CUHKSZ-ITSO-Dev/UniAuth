package userinfos

import (
	"context"
	"uniauth-gf/internal/dao"

	v1 "uniauth-gf/api/userinfos/v1"
)

func (c *ControllerV1) GetOne(ctx context.Context, req *v1.GetOneReq) (res *v1.GetOneRes, err error) {
	res = &v1.GetOneRes{}
	err = dao.UserinfosUserInfos.Ctx(ctx).WherePri(req.Upn).Scan(&res)
	return
}
