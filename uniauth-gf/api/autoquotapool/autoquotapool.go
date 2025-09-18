// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package autoquotapool

import (
	"context"

	"uniauth-gf/api/autoquotapool/v1"
)

type IAutoquotapoolV1 interface {
	GetAutoQuotaPoolRules(ctx context.Context, req *v1.GetAutoQuotaPoolRulesReq) (res *v1.GetAutoQuotaPoolRulesRes, err error)
	GetAutoQuotaPoolRule(ctx context.Context, req *v1.GetAutoQuotaPoolRuleReq) (res *v1.GetAutoQuotaPoolRuleRes, err error)
	AddAutoQuotaPoolRule(ctx context.Context, req *v1.AddAutoQuotaPoolRuleReq) (res *v1.AddAutoQuotaPoolRuleRes, err error)
	EditAutoQuotaPoolRule(ctx context.Context, req *v1.EditAutoQuotaPoolRuleReq) (res *v1.EditAutoQuotaPoolRuleRes, err error)
	DeleteAutoQuotaPoolRule(ctx context.Context, req *v1.DeleteAutoQuotaPoolRuleReq) (res *v1.DeleteAutoQuotaPoolRuleRes, err error)
	GetAutoQuotaPoolConditions(ctx context.Context, req *v1.GetAutoQuotaPoolConditionsReq) (res *v1.GetAutoQuotaPoolConditionsRes, err error)
	AddAutoQuotaPoolCondition(ctx context.Context, req *v1.AddAutoQuotaPoolConditionReq) (res *v1.AddAutoQuotaPoolConditionRes, err error)
	EditAutoQuotaPoolCondition(ctx context.Context, req *v1.EditAutoQuotaPoolConditionReq) (res *v1.EditAutoQuotaPoolConditionRes, err error)
	DeleteAutoQuotaPoolCondition(ctx context.Context, req *v1.DeleteAutoQuotaPoolConditionReq) (res *v1.DeleteAutoQuotaPoolConditionRes, err error)
	GetUserQuotaPools(ctx context.Context, req *v1.GetUserQuotaPoolsReq) (res *v1.GetUserQuotaPoolsRes, err error)
	GetQuotaPoolUsers(ctx context.Context, req *v1.GetQuotaPoolUsersReq) (res *v1.GetQuotaPoolUsersRes, err error)
	GetAutoQuotaPoolMappings(ctx context.Context, req *v1.GetAutoQuotaPoolMappingsReq) (res *v1.GetAutoQuotaPoolMappingsRes, err error)
	ReevaluateAllRules(ctx context.Context, req *v1.ReevaluateAllRulesReq) (res *v1.ReevaluateAllRulesRes, err error)
	TestRule(ctx context.Context, req *v1.TestRuleReq) (res *v1.TestRuleRes, err error)
	GetAutoQuotaPoolStats(ctx context.Context, req *v1.GetAutoQuotaPoolStatsReq) (res *v1.GetAutoQuotaPoolStatsRes, err error)
}
