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
	Filter(ctx context.Context, req *v1.FilterReq) (res *v1.FilterRes, err error)
	DepartmentUserCountStats(ctx context.Context, req *v1.DepartmentUserCountStatsReq) (res *v1.DepartmentUserCountStatsRes, err error)
}
