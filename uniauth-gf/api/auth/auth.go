// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

type IAuthV1 interface {
	Check(ctx context.Context, req *v1.CheckReq) (res *v1.CheckRes, err error)
	CheckAndExplain(ctx context.Context, req *v1.CheckAndExplainReq) (res *v1.CheckAndExplainRes, err error)
}
