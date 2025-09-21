// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-20 21:36:19
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// BillingCostRecords is the golang structure of table billing_cost_records for DAO operations like Where/Data.
type BillingCostRecords struct {
	g.Meta    `orm:"table:billing_cost_records, do:true"`
	Id        any         // 自增主键
	Upn       any         // UPN
	Svc       any         // 服务名称
	Product   any         // 产品名称
	Cost      any         // 费用
	Plan      any         // 计费方案
	Source    any         // 来源
	Remark    *gjson.Json // 备注信息
	CreatedAt *gtime.Time // 创建时间
}
