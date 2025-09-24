// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-16 12:07:45
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

// QuotapoolQuotaPool is the golang structure for table quotapool_quota_pool.
type QuotapoolQuotaPool struct {
	Id             int64           `json:"id"             orm:"id"              description:"自增主键"`      // 自增主键
	QuotaPoolName  string          `json:"quotaPoolName"  orm:"quota_pool_name" description:"配额池名称"`     // 配额池名称
	CronCycle      string          `json:"cronCycle"      orm:"cron_cycle"      description:"刷新周期"`      // 刷新周期
	RegularQuota   decimal.Decimal `json:"regularQuota"   orm:"regular_quota"   description:"定期配额"`      // 定期配额
	RemainingQuota decimal.Decimal `json:"remainingQuota" orm:"remaining_quota" description:"剩余配额"`      // 剩余配额
	LastResetAt    *gtime.Time     `json:"lastResetAt"    orm:"last_reset_at"   description:"上次刷新时间"`    // 上次刷新时间
	ExtraQuota     decimal.Decimal `json:"extraQuota"     orm:"extra_quota"     description:"加油包"`       // 加油包
	Personal       bool            `json:"personal"       orm:"personal"        description:"是否个人配额池"`   // 是否个人配额池
	Disabled       bool            `json:"disabled"       orm:"disabled"        description:"是否禁用"`      // 是否禁用
	UserinfosRules *gjson.Json     `json:"userinfosRules" orm:"userinfos_rules" description:"ITTools规则"` // ITTools规则
	CreatedAt      *gtime.Time     `json:"createdAt"      orm:"created_at"      description:"创建时间"`      // 创建时间
	UpdatedAt      *gtime.Time     `json:"updatedAt"      orm:"updated_at"      description:"修改时间"`      // 修改时间
}
