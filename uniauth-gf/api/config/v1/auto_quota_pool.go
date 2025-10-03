package v1

import (
	userinfosv1 "uniauth-gf/api/userinfos/v1"
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

type AutoQuotaPoolItem struct {
	entity.ConfigAutoQuotaPool
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
	// 刷新周期（标准 Cron 表达式，支持 6 字段）
	CronCycle string `json:"cronCycle" v:"required" dc:"刷新周期，Cron 表达式" example:"0 0 3 * *"`
	// 定期配额（每周期重置）
	RegularQuota decimal.Decimal `json:"regularQuota" v:"required" dc:"定期配额（每周期重置）" example:"1000"`
	// 是否启用该配额池
	Enabled bool `json:"enabled" dc:"是否启用该配额池" d:"true" example:"true"`
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
	CronCycle string `json:"cronCycle" v:"required" dc:"刷新周期，Cron 表达式" example:"0 0 3 * *"`
	// 定期配额（每周期重置）
	RegularQuota decimal.Decimal `json:"regularQuota" v:"required" dc:"定期配额（每周期重置）" example:"1000"`
	// 是否启用该规则
	Enabled bool `json:"enabled" d:"true" dc:"是否启用该规则" example:"true"`
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

// ==================== Sync UpnsCache ====================
type SyncAutoQuotaPoolUpnsCacheReq struct {
    g.Meta  `path:"/autoConfig/syncUpnsCache" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"手动同步自动配额池规则的UPN缓存(upns_cache)"`
    // 若提供，仅同步该规则；否则同步所有规则
    RuleName string `json:"ruleName" dc:"规则名称（可选，留空时同步所有规则）"`
}
type SyncAutoQuotaPoolUpnsCacheRes struct {
    OK               bool              `json:"ok" dc:"是否成功"`
    UpdatedRules     []string          `json:"updatedRules" dc:"已同步的规则名称列表"`
    MatchedUserCount map[string]int    `json:"matchedUserCount" dc:"每个规则匹配到的UPN数量"`
}
