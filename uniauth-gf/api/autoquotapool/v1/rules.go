package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// AutoQuotaPoolRule 自动配额池规则结构
type AutoQuotaPoolRule struct {
	ID                int64      `json:"id" dc:"规则ID"`
	RuleName          string     `json:"ruleName" dc:"规则名称"`
	Description       string     `json:"description" dc:"规则描述"`
	Enabled           bool       `json:"enabled" dc:"是否启用"`
	Priority          int        `json:"priority" dc:"优先级"`
	QuotaPoolNames    []string   `json:"quotaPoolNames" dc:"目标配额池名称列表"`
	LastEvaluatedAt   *time.Time `json:"lastEvaluatedAt" dc:"上次评估时间"`
	CreatedAt         *time.Time `json:"createdAt" dc:"创建时间"`
	UpdatedAt         *time.Time `json:"updatedAt" dc:"更新时间"`
	MatchedUsersCount int        `json:"matchedUsersCount,omitempty" dc:"匹配用户数量（查询时返回）"`
}

// ==================== 规则管理接口 ====================

// GetAutoQuotaPoolRulesReq 获取自动配额池规则列表
type GetAutoQuotaPoolRulesReq struct {
	g.Meta       `path:"/autoQuotaPool/rules" tags:"AutoQuotaPoolConfig/Rules" method:"get" summary:"获取自动配额池规则列表"`
	Enabled      *bool  `json:"enabled" dc:"是否启用（可选过滤）"`
	RuleName     string `json:"ruleName" dc:"规则名称（可选模糊搜索）"`
	Page         int    `json:"page" v:"min:1" dc:"页码" default:"1"`
	PageSize     int    `json:"pageSize" v:"min:1|max:100" dc:"每页条数" default:"20"`
	IncludeStats bool   `json:"includeStats" dc:"是否包含统计信息"`
}

type GetAutoQuotaPoolRulesRes struct {
	Rules      []AutoQuotaPoolRule `json:"rules" dc:"规则列表"`
	Total      int                 `json:"total" dc:"总记录数"`
	Page       int                 `json:"page" dc:"当前页码"`
	PageSize   int                 `json:"pageSize" dc:"每页条数"`
	TotalPages int                 `json:"totalPages" dc:"总页数"`
}

// GetAutoQuotaPoolRuleReq 获取单个自动配额池规则详情
type GetAutoQuotaPoolRuleReq struct {
	g.Meta `path:"/autoQuotaPool/rules/{id}" tags:"AutoQuotaPoolConfig/Rules" method:"get" summary:"获取自动配额池规则详情"`
	ID     int64 `json:"id" v:"required" dc:"规则ID"`
}

type GetAutoQuotaPoolRuleRes struct {
	Rule       AutoQuotaPoolRule        `json:"rule" dc:"规则详情"`
	Conditions []AutoQuotaPoolCondition `json:"conditions" dc:"条件列表"`
}

// AddAutoQuotaPoolRuleReq 新增自动配额池规则
type AddAutoQuotaPoolRuleReq struct {
	g.Meta         `path:"/autoQuotaPool/rules" tags:"AutoQuotaPoolConfig/Rules" method:"post" summary:"新增自动配额池规则"`
	RuleName       string                   `json:"ruleName" v:"required|length:1,255" dc:"规则名称"`
	Description    string                   `json:"description" dc:"规则描述"`
	Enabled        bool                     `json:"enabled" dc:"是否启用" default:"true"`
	Priority       int                      `json:"priority" v:"min:1" dc:"优先级" default:"100"`
	QuotaPoolNames []string                 `json:"quotaPoolNames" v:"required|min-length:1" dc:"目标配额池名称列表"`
	Conditions     []AutoQuotaPoolCondition `json:"conditions" v:"required|min-length:1" dc:"条件列表"`
}

type AddAutoQuotaPoolRuleRes struct {
	RuleID int64 `json:"ruleId" dc:"新创建的规则ID"`
	OK     bool  `json:"ok" dc:"是否成功"`
}

// EditAutoQuotaPoolRuleReq 编辑自动配额池规则
type EditAutoQuotaPoolRuleReq struct {
	g.Meta         `path:"/autoQuotaPool/rules/{id}" tags:"AutoQuotaPoolConfig/Rules" method:"put" summary:"编辑自动配额池规则"`
	ID             int64                    `json:"id" v:"required" dc:"规则ID"`
	RuleName       string                   `json:"ruleName" v:"required|length:1,255" dc:"规则名称"`
	Description    string                   `json:"description" dc:"规则描述"`
	Enabled        bool                     `json:"enabled" dc:"是否启用"`
	Priority       int                      `json:"priority" v:"min:1" dc:"优先级"`
	QuotaPoolNames []string                 `json:"quotaPoolNames" v:"required|min-length:1" dc:"目标配额池名称列表"`
	Conditions     []AutoQuotaPoolCondition `json:"conditions" v:"required|min-length:1" dc:"条件列表"`
}

type EditAutoQuotaPoolRuleRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

// DeleteAutoQuotaPoolRuleReq 删除自动配额池规则
type DeleteAutoQuotaPoolRuleReq struct {
	g.Meta `path:"/autoQuotaPool/rules/{id}" tags:"AutoQuotaPoolConfig/Rules" method:"delete" summary:"删除自动配额池规则"`
	ID     int64 `json:"id" v:"required" dc:"规则ID"`
}

type DeleteAutoQuotaPoolRuleRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}
