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
	BatchQuotaPoolDisabled(ctx context.Context, req *v1.BatchQuotaPoolDisabledReq) (res *v1.BatchQuotaPoolDisabledRes, err error)
	GetQuotaPool(ctx context.Context, req *v1.GetQuotaPoolReq) (res *v1.GetQuotaPoolRes, err error)
	NewQuotaPool(ctx context.Context, req *v1.NewQuotaPoolReq) (res *v1.NewQuotaPoolRes, err error)
	EditQuotaPool(ctx context.Context, req *v1.EditQuotaPoolReq) (res *v1.EditQuotaPoolRes, err error)
	DeleteQuotaPool(ctx context.Context, req *v1.DeleteQuotaPoolReq) (res *v1.DeleteQuotaPoolRes, err error)
}
