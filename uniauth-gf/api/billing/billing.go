// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package billing

import (
	"context"

	"uniauth-gf/api/billing/v1"
)

type IBillingV1 interface {
	GetOnesBillRecord(ctx context.Context, req *v1.GetOnesBillRecordReq) (res *v1.GetOnesBillRecordRes, err error)
	BillingRecord(ctx context.Context, req *v1.BillingRecordReq) (res *v1.BillingRecordRes, err error)
	Check(ctx context.Context, req *v1.CheckReq) (res *v1.CheckRes, err error)
}
