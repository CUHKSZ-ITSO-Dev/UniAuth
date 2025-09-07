// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// BillingCostRecords is the golang structure of table billing_cost_records for DAO operations like Where/Data.
type BillingCostRecords struct {
	g.Meta    `orm:"table:billing_cost_records, do:true"`
	Id        interface{} //
	Upn       interface{} //
	Svc       interface{} //
	Product   interface{} //
	Cost      interface{} //
	Plan      interface{} //
	Source    interface{} //
	Remark    interface{} //
	CreatedAt *gtime.Time //
}
