package userinfos

import (
	"context"
	"uniauth-gf/internal/dao"

	v1 "uniauth-gf/api/userinfos/v1"

	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) GetOne(ctx context.Context, req *v1.GetOneReq) (res *v1.GetOneRes, err error) {
	res = &v1.GetOneRes{}
	err = dao.UserinfosUserInfos.Ctx(ctx).Where("upn = ?", req.Upn).Scan(&res)
	if err != nil {
		err = gerror.Wrap(err, "获取指定用户SSO信息失败")
	}
	return
}
