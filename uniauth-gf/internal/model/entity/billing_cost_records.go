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
	Id        int64           `json:"id"        orm:"id"         description:""`     //
	Upn       string          `json:"upn"       orm:"upn"        description:"UPN"`  // UPN
	Svc       string          `json:"svc"       orm:"svc"        description:"服务名称"` // 服务名称
	Product   string          `json:"product"   orm:"product"    description:"产品名称"` // 产品名称
	Cost      decimal.Decimal `json:"cost"      orm:"cost"       description:"费用"`   // 费用
	Plan      string          `json:"plan"      orm:"plan"       description:"计费方案"` // 计费方案
	Source    string          `json:"source"    orm:"source"     description:"来源"`   // 来源
	Remark    string          `json:"remark"    orm:"remark"     description:"备注信息"` // 备注信息
	CreatedAt *gtime.Time     `json:"createdAt" orm:"created_at" description:"创建时间"` // 创建时间
}
