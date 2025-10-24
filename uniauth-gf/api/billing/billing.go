// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package billing

import (
	"context"

	"uniauth-gf/api/billing/v1"
)

type IBillingV1 interface {
	ExportBillRecord(ctx context.Context, req *v1.ExportBillRecordReq) (res *v1.ExportBillRecordRes, err error)
	GetBillRecord(ctx context.Context, req *v1.GetBillRecordReq) (res *v1.GetBillRecordRes, err error)
	GetBillAmount(ctx context.Context, req *v1.GetBillAmountReq) (res *v1.GetBillAmountRes, err error)
	BillingRecord(ctx context.Context, req *v1.BillingRecordReq) (res *v1.BillingRecordRes, err error)
	CheckBalance(ctx context.Context, req *v1.CheckBalanceReq) (res *v1.CheckBalanceRes, err error)
	CheckTokensUsage(ctx context.Context, req *v1.CheckTokensUsageReq) (res *v1.CheckTokensUsageRes, err error)
	GetBillingOptions(ctx context.Context, req *v1.GetBillingOptionsReq) (res *v1.GetBillingOptionsRes, err error)
	NDaysProductUsageChart(ctx context.Context, req *v1.NDaysProductUsageChartReq) (res *v1.NDaysProductUsageChartRes, err error)
	NDaysProductUsageGroup(ctx context.Context, req *v1.NDaysProductUsageGroupReq) (res *v1.NDaysProductUsageGroupRes, err error)
}
