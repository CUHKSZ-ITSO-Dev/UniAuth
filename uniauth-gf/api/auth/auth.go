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
	GetAllSubjects(ctx context.Context, req *v1.GetAllSubjectsReq) (res *v1.GetAllSubjectsRes, err error)
	GetAllObjects(ctx context.Context, req *v1.GetAllObjectsReq) (res *v1.GetAllObjectsRes, err error)
	GetAllActions(ctx context.Context, req *v1.GetAllActionsReq) (res *v1.GetAllActionsRes, err error)
	GetAllDomains(ctx context.Context, req *v1.GetAllDomainsReq) (res *v1.GetAllDomainsRes, err error)
	FilterPolicies(ctx context.Context, req *v1.FilterPoliciesReq) (res *v1.FilterPoliciesRes, err error)
	FilterGroupings(ctx context.Context, req *v1.FilterGroupingsReq) (res *v1.FilterGroupingsRes, err error)
}
