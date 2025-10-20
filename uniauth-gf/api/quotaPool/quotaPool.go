// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package quotaPool

import (
	"context"

	"uniauth-gf/api/quotaPool/v1"
)

type IQuotaPoolV1 interface {
	ResetBalance(ctx context.Context, req *v1.ResetBalanceReq) (res *v1.ResetBalanceRes, err error)
	BatchModifyQuotaPool(ctx context.Context, req *v1.BatchModifyQuotaPoolReq) (res *v1.BatchModifyQuotaPoolRes, err error)
	GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error)
	FilterQuotaPool(ctx context.Context, req *v1.FilterQuotaPoolReq) (res *v1.FilterQuotaPoolRes, err error)
	NewQuotaPool(ctx context.Context, req *v1.NewQuotaPoolReq) (res *v1.NewQuotaPoolRes, err error)
	EditQuotaPool(ctx context.Context, req *v1.EditQuotaPoolReq) (res *v1.EditQuotaPoolRes, err error)
	DeleteQuotaPool(ctx context.Context, req *v1.DeleteQuotaPoolReq) (res *v1.DeleteQuotaPoolRes, err error)
	EnsurePersonalQuotaPool(ctx context.Context, req *v1.EnsurePersonalQuotaPoolReq) (res *v1.EnsurePersonalQuotaPoolRes, err error)
	RefreshUsersOfQuotaPool(ctx context.Context, req *v1.RefreshUsersOfQuotaPoolReq) (res *v1.RefreshUsersOfQuotaPoolRes, err error)
	QuotaPoolUserCountStats(ctx context.Context, req *v1.QuotaPoolUserCountStatsReq) (res *v1.QuotaPoolUserCountStatsRes, err error)
}
