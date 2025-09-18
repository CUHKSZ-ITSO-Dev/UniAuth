// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 16:51:00
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigAutoQuotaPool is the golang structure for table config_auto_quota_pool.
type ConfigAutoQuotaPool struct {
	Id              int64       `json:"id"              orm:"id"                description:"自增主键"`                                                    // 自增主键
	RuleName        string      `json:"ruleName"        orm:"rule_name"         description:"规则名称，唯一"`                                                 // 规则名称，唯一
	Description     string      `json:"description"     orm:"description"       description:"规则说明"`                                                    // 规则说明
	Enabled         bool        `json:"enabled"         orm:"enabled"           description:"是否启用该规则"`                                                 // 是否启用该规则
	Priority        int         `json:"priority"        orm:"priority"          description:"优先级，数值越小优先匹配"`                                            // 优先级，数值越小优先匹配
	RuleExpression  string      `json:"ruleExpression"  orm:"rule_expression"   description:"规则表达式字符串"`                                                // 规则表达式字符串
	QuotaPools      []string    `json:"quotaPools"      orm:"quota_pools"       description:"目标配额池名称集合（文本数组，对应 quotapool_quota_pool.quota_pool_name）"` // 目标配额池名称集合（文本数组，对应 quotapool_quota_pool.quota_pool_name）
	LastEvaluatedAt *gtime.Time `json:"lastEvaluatedAt" orm:"last_evaluated_at" description:"该规则上次评估时间"`                                               // 该规则上次评估时间
	CreatedAt       *gtime.Time `json:"createdAt"       orm:"created_at"        description:"创建时间"`                                                    // 创建时间
	UpdatedAt       *gtime.Time `json:"updatedAt"       orm:"updated_at"        description:"更新时间"`                                                    // 更新时间
}
