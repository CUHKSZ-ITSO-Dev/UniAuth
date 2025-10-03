// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package auth

import (
	"context"

	"uniauth-gf/api/auth/v1"
)

type IAuthV1 interface {
	AddPolicies(ctx context.Context, req *v1.AddPoliciesReq) (res *v1.AddPoliciesRes, err error)
	EditPolicy(ctx context.Context, req *v1.EditPolicyReq) (res *v1.EditPolicyRes, err error)
	DeletePolicies(ctx context.Context, req *v1.DeletePoliciesReq) (res *v1.DeletePoliciesRes, err error)
	FilterPolicies(ctx context.Context, req *v1.FilterPoliciesReq) (res *v1.FilterPoliciesRes, err error)
	AddGrouping(ctx context.Context, req *v1.AddGroupingReq) (res *v1.AddGroupingRes, err error)
	EditGrouping(ctx context.Context, req *v1.EditGroupingReq) (res *v1.EditGroupingRes, err error)
	DeleteGrouping(ctx context.Context, req *v1.DeleteGroupingReq) (res *v1.DeleteGroupingRes, err error)
	FilterGroupings(ctx context.Context, req *v1.FilterGroupingsReq) (res *v1.FilterGroupingsRes, err error)
	Check(ctx context.Context, req *v1.CheckReq) (res *v1.CheckRes, err error)
	CheckAndExplain(ctx context.Context, req *v1.CheckAndExplainReq) (res *v1.CheckAndExplainRes, err error)
	GetAllSubjects(ctx context.Context, req *v1.GetAllSubjectsReq) (res *v1.GetAllSubjectsRes, err error)
	GetAllObjects(ctx context.Context, req *v1.GetAllObjectsReq) (res *v1.GetAllObjectsRes, err error)
	GetAllActions(ctx context.Context, req *v1.GetAllActionsReq) (res *v1.GetAllActionsRes, err error)
	GetAllRoles(ctx context.Context, req *v1.GetAllRolesReq) (res *v1.GetAllRolesRes, err error)
	GetAllQuotaPools(ctx context.Context, req *v1.GetAllQuotaPoolsReq) (res *v1.GetAllQuotaPoolsRes, err error)
	GetAllUsersForQuotaPool(ctx context.Context, req *v1.GetAllUsersForQuotaPoolReq) (res *v1.GetAllUsersForQuotaPoolRes, err error)
	ChatPreCheckOneStop(ctx context.Context, req *v1.ChatPreCheckOneStopReq) (res *v1.ChatPreCheckOneStopRes, err error)
	GetAvailableModelForQuotaPool(ctx context.Context, req *v1.GetAvailableModelForQuotaPoolReq) (res *v1.GetAvailableModelForQuotaPoolRes, err error)
	UniauthLogin(ctx context.Context, req *v1.UniauthLoginReq) (res *v1.UniauthLoginRes, err error)
}
