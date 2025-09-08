// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// QuotapoolQuotaPool is the golang structure of table quotapool_quota_pool for DAO operations like Where/Data.
type QuotapoolQuotaPool struct {
	g.Meta         `orm:"table:quotapool_quota_pool, do:true"`
	Id             interface{} // 自增主键
	QuotaPoolName  interface{} // 配额池名称
	CronCycle      interface{} // 刷新周期
	RegularQuota   interface{} // 定期配额
	RemainingQuota interface{} // 剩余配额
	LastResetAt    *gtime.Time // 上次刷新时间
	ExtraQuota     interface{} // 加油包
	Personal       interface{} // 是否个人配额池
	Disabled       interface{} // 是否禁用
	UserinfosRules interface{} // ITTools规则
	CreatedAt      *gtime.Time // 创建时间
}
