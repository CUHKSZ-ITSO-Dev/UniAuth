// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

// BillingCostRecords is the golang structure for table billing_cost_records.
type BillingCostRecords struct {
	Id        int64           `json:"id"        orm:"id"         description:""` //
	Upn       string          `json:"upn"       orm:"upn"        description:""` //
	Svc       string          `json:"svc"       orm:"svc"        description:""` //
	Product   string          `json:"product"   orm:"product"    description:""` //
	Cost      decimal.Decimal `json:"cost"      orm:"cost"       description:""` //
	Plan      string          `json:"plan"      orm:"plan"       description:""` //
	Source    string          `json:"source"    orm:"source"     description:""` //
	Remark    string          `json:"remark"    orm:"remark"     description:""` //
	CreatedAt *gtime.Time     `json:"createdAt" orm:"created_at" description:""` //
}
