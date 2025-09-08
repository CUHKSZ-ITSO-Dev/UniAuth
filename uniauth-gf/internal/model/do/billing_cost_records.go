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
	Upn       interface{} // UPN
	Svc       interface{} // 服务名称
	Product   interface{} // 产品名称
	Cost      interface{} // 费用
	Plan      interface{} // 计费方案
	Source    interface{} // 来源
	Remark    interface{} // 备注信息
	CreatedAt *gtime.Time // 创建时间
}
