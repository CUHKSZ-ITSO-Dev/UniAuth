package v1

import (
	userinfosv1 "uniauth-gf/api/userinfos/v1"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

type AutoQuotaPoolItem struct {
	Id                 int64           `json:"id"                 orm:"id"                   description:"自增主键"`         // 自增主键
	RuleName           string          `json:"ruleName"           orm:"rule_name"            description:"规则名称，唯一"`      // 规则名称，唯一
	Description        string          `json:"description"        orm:"description"          description:"规则说明"`         // 规则说明
	CronCycle          string          `json:"cronCycle"          orm:"cron_cycle"           description:"刷新周期"`         // 刷新周期
	RegularQuota       decimal.Decimal `json:"regularQuota"       orm:"regular_quota"        description:"定期配额"`         // 定期配额
	Enabled            bool            `json:"enabled"            orm:"enabled"              description:"是否启用该配额池"`     // 是否启用该配额池
	FilterGroup        *gjson.Json     `json:"filterGroup"        orm:"filter_group"         description:"过滤条件组"`        // 过滤条件组
	Priority           int             `json:"priority"           orm:"priority"             description:"优先级，数值越小优先匹配"` // 优先级，数值越小优先匹配
	LastEvaluatedAt    *gtime.Time     `json:"lastEvaluatedAt"    orm:"last_evaluated_at"    description:"该规则上次评估时间"`    // 该规则上次评估时间
	CreatedAt          *gtime.Time     `json:"createdAt"          orm:"created_at"           description:"创建时间"`         // 创建时间
	UpdatedAt          *gtime.Time     `json:"updatedAt"          orm:"updated_at"           description:"更新时间"`         // 更新时间
	DefaultCasbinRules *gjson.Json     `json:"defaultCasbinRules" orm:"default_casbin_rules" description:"默认Casbin规则"`   // 默认Casbin规则
}

type DefaultCasbinRule struct {
	Obj string `json:"obj" dc:"资源对象"`
	Act string `json:"act" dc:"动作"`
	Eft string `json:"eft" dc:"效果"`
}

type GetAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"获取自动配额池规则"`
}
type GetAutoQuotaPoolConfigRes struct {
	Items []AutoQuotaPoolItem `json:"items" dc:"自动配额池规则列表"`
}

type EditAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"put" summary:"编辑自动配额池规则"`
	// 规则名称（唯一，作为定位要编辑的规则）
	RuleName string `json:"ruleName" v:"required" dc:"规则名称（唯一）" example:"assign-student-daily"`
	// 刷新周期（标准 Cron 表达式，支持 5 字段）
	CronCycle string `json:"cronCycle" v:"required" dc:"刷新周期，Cron 表达式" example:"0 3 * * *"`
	// 定期配额（每周期重置）
	RegularQuota decimal.Decimal `json:"regularQuota" v:"required" dc:"定期配额（每周期重置）" example:"1000"`
	// 是否启用该配额池
	Enabled bool `json:"enabled" dc:"是否启用该配额池" d:"true" example:"true"`
	// 默认 Casbin 规则配置
	DefaultCasbinRules *[]*DefaultCasbinRule `json:"defaultCasbinRules" dc:"默认Casbin规则配置"`
	// 过滤条件组，满足条件的用户将应用该规则
	FilterGroup *userinfosv1.FilterGroup `json:"filterGroup" dc:"过滤条件组，满足条件的用户将应用该规则"`
	// 规则说明
	Description string `json:"description" dc:"规则说明" example:"为学生每日分配基础额度"`
	// 优先级，数值越小优先匹配
	Priority int `json:"priority" dc:"优先级，数值越小优先匹配" example:"10"`
}
type EditAutoQuotaPoolConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"delete" summary:"删除自动配额池规则"`
	// 规则名称（唯一）
	RuleName string `json:"ruleName" v:"required" dc:"规则名称（唯一）" example:"assign-student-daily"`
}
type DeleteAutoQuotaPoolConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type AddAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"新增自动配额池规则"`
	// 规则名称（唯一）
	RuleName string `json:"ruleName" v:"required" dc:"规则名称（唯一）" example:"assign-student-daily"`
	// 刷新周期（标准 Cron 表达式，支持 6 字段）
	CronCycle string `json:"cronCycle" v:"required" dc:"刷新周期，Cron 表达式" example:"0 0 3 * * *"`
	// 定期配额（每周期重置）
	RegularQuota decimal.Decimal `json:"regularQuota" v:"required" dc:"定期配额（每周期重置）" example:"1000"`
	// 是否启用该规则
	Enabled bool `json:"enabled" d:"true" dc:"是否启用该规则" example:"true"`
	// 默认 Casbin 规则配置
	DefaultCasbinRules *[]*DefaultCasbinRule `json:"defaultCasbinRules" dc:"默认Casbin规则配置"`
	// 过滤条件组，满足条件的用户将应用该规则
	FilterGroup *userinfosv1.FilterGroup `json:"filterGroup" d:"{}" dc:"过滤条件组，满足条件的用户将应用该规则"`
	// 规则说明
	Description string `json:"description" dc:"规则说明" example:"为学生每日分配基础额度"`
	// 优先级，数值越小优先匹配
	Priority int `json:"priority" dc:"优先级，数值越小优先匹配" example:"10"`
}
type AddAutoQuotaPoolConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type SyncAutoQuotaPoolUpnsCacheReq struct {
	g.Meta   `path:"/autoConfig/syncUpnsCache" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"手动同步自动配额池规则的 upns_cache"`
	RuleName []string `json:"ruleName" dc:"规则名称。不传或者传空数组会同步所有自动配额池的 UPNs Cache。"`
}
type SyncAutoQuotaPoolUpnsCacheRes struct {
	OK           bool `json:"ok" v:"required" dc:"是否成功"`
	UpdatedCount int  `json:"updatedCount" v:"required" dc:"批量刷新时，这个值是一共更改了多少个自动配额池的缓存；指定配额池刷新时，这个值是这个配额池有多少个用户"`
}

// ==================== Auto Quota Pool User Count Stats ====================
type AutoQuotaPoolUserCountStatsReq struct {
	g.Meta `path:"/stats/userCount" tags:"Config/AutoQuotaPoolConfig" method:"GET" summary:"自动配额池用户数统计" dc:"按自动配额池统计用户总数"`
}

type AutoQuotaPoolUserCountStatsRes struct {
	g.Meta         `resEg:"resource/interface/config/autoquotapool/auto_quota_pool_user_count_stats_res.json"`
	QuotaPoolStats *gjson.Json `json:"quotaPoolStats" dc:"统计数据，按自动配额池分组显示用户数量"`
}

type QueryUpnsCacheItem struct {
	RuleName      string `json:"ruleName" dc:"规则名称"`
	Upn           string `json:"upn" dc:"UPN"`
	IsInUpnsCache bool   `json:"isInUpnsCache" dc:"是否在自动配额池规则的upns_cache中"`
}

type QueryUpnsCacheReq struct {
	g.Meta    `path:"/autoConfig/queryUpnsCache" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"查询指定 UPN 列表是否在指定自动配额池规则的 upns_cache 中"`
	Upns      []string `json:"upns" v:"required" dc:"UPN列表"`
	RuleNames []string `json:"ruleNames" v:"required" dc:"规则名称列表"`
}

type QueryUpnsCacheRes struct {
	Items []QueryUpnsCacheItem `json:"items" dc:"查询结果列表"`
}
