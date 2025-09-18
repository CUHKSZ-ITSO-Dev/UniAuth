// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 16:51:00
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// QuotapoolQuotaPool is the golang structure of table quotapool_quota_pool for DAO operations like Where/Data.
type QuotapoolQuotaPool struct {
	g.Meta         `orm:"table:quotapool_quota_pool, do:true"`
	Id             any         // 自增主键
	QuotaPoolName  any         // 配额池名称
	CronCycle      any         // 刷新周期
	RegularQuota   any         // 定期配额
	RemainingQuota any         // 剩余配额
	LastResetAt    *gtime.Time // 上次刷新时间
	ExtraQuota     any         // 加油包
	Personal       any         // 是否个人配额池
	Disabled       any         // 是否禁用
	UserinfosRules *gjson.Json // ITTools规则
	CreatedAt      *gtime.Time // 创建时间
	UpdatedAt      *gtime.Time // 修改时间
}
