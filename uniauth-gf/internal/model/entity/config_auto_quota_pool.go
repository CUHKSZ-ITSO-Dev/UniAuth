// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-10-03 12:30:21
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

// ConfigAutoQuotaPool is the golang structure for table config_auto_quota_pool.
type ConfigAutoQuotaPool struct {
	Id                 int64           `json:"id"                 orm:"id"                   description:"自增主键"`         // 自增主键
	RuleName           string          `json:"ruleName"           orm:"rule_name"            description:"规则名称，唯一"`      // 规则名称，唯一
	Description        string          `json:"description"        orm:"description"          description:"规则说明"`         // 规则说明
	CronCycle          string          `json:"cronCycle"          orm:"cron_cycle"           description:"刷新周期"`         // 刷新周期
	RegularQuota       decimal.Decimal `json:"regularQuota"       orm:"regular_quota"        description:"定期配额"`         // 定期配额
	Enabled            bool            `json:"enabled"            orm:"enabled"              description:"是否启用该配额池"`     // 是否启用该配额池
	FilterGroup        *gjson.Json     `json:"filterGroup"        orm:"filter_group"         description:"过滤条件组"`        // 过滤条件组
	UpnsCache          []string        `json:"upnsCache"          orm:"upns_cache"           description:"UPN缓存列表"`      // UPN缓存列表
	Priority           int             `json:"priority"           orm:"priority"             description:"优先级，数值越小优先匹配"` // 优先级，数值越小优先匹配
	LastEvaluatedAt    *gtime.Time     `json:"lastEvaluatedAt"    orm:"last_evaluated_at"    description:"该规则上次评估时间"`    // 该规则上次评估时间
	CreatedAt          *gtime.Time     `json:"createdAt"          orm:"created_at"           description:"创建时间"`         // 创建时间
	UpdatedAt          *gtime.Time     `json:"updatedAt"          orm:"updated_at"           description:"更新时间"`         // 更新时间
	DefaultCasbinRules *gjson.Json     `json:"defaultCasbinRules" orm:"default_casbin_rules" description:"默认Casbin规则"`   // 默认Casbin规则
}
