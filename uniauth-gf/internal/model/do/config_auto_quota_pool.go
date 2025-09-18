// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-18 00:51:49
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigAutoQuotaPool is the golang structure of table config_auto_quota_pool for DAO operations like Where/Data.
type ConfigAutoQuotaPool struct {
	g.Meta          `orm:"table:config_auto_quota_pool, do:true"`
	Id              any         // 自增主键
	RuleName        any         // 规则名称，唯一
	Description     any         // 规则说明
	CronCycle       any         // 刷新周期
	RegularQuota    any         // 定期配额
	Enabled         any         // 是否启用该规则
	FilterGroup     *gjson.Json // 过滤条件组
	Priority        any         // 优先级，数值越小优先匹配
	LastEvaluatedAt *gtime.Time // 该规则上次评估时间
	CreatedAt       *gtime.Time // 创建时间
	UpdatedAt       *gtime.Time // 更新时间
}
