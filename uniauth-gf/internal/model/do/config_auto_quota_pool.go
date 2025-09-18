// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 16:51:00
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigAutoQuotaPool is the golang structure of table config_auto_quota_pool for DAO operations like Where/Data.
type ConfigAutoQuotaPool struct {
	g.Meta          `orm:"table:config_auto_quota_pool, do:true"`
	Id              any         // 自增主键
	RuleName        any         // 规则名称，唯一
	Description     any         // 规则说明
	Enabled         any         // 是否启用该规则
	Priority        any         // 优先级，数值越小优先匹配
	RuleExpression  any         // 规则表达式字符串
	QuotaPools      []string    // 目标配额池名称集合（文本数组，对应 quotapool_quota_pool.quota_pool_name）
	LastEvaluatedAt *gtime.Time // 该规则上次评估时间
	CreatedAt       *gtime.Time // 创建时间
	UpdatedAt       *gtime.Time // 更新时间
}
