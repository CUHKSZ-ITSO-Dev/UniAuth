// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package userinfos

import (
	"context"

	"uniauth-gf/api/userinfos/v1"
)

type IUserinfosV1 interface {
	QueryUserInfo(ctx context.Context, req *v1.QueryUserInfoReq) (res *v1.QueryUserInfoRes, err error)
}
