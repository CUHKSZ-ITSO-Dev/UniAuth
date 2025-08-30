// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package userinfo

import (
	"context"

	"uniauth-gf/api/userinfo/v1"
)

type IUserinfoV1 interface {
	queryUserInfo(ctx context.Context, req *v1.queryUserInfoReq) (res *v1.queryUserInfoRes, err error)
}
