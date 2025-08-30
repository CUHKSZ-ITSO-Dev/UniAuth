// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package userinfos

import (
	"context"

	"uniauth-gf/api/userinfos/v1"
)

type IUserinfosV1 interface {
	GetOne(ctx context.Context, req *v1.GetOneReq) (res *v1.GetOneRes, err error)
}
