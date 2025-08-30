package userinfos

import (
	"context"

	v1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/dao"
)

func (c *ControllerV1) QueryUserInfo(ctx context.Context, req *v1.QueryUserInfoReq) (res *v1.QueryUserInfoRes, err error) {
	res = &v1.QueryUserInfoRes{}
	// 假设 QueryUserInfoReq 有 Upn 字段，QueryUserInfoRes 有 Upn 字段，且都是导出的
	err = dao.UserInfos.Ctx(ctx).WherePri(req.Upn).Scan(&res)
	return
}
