package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// ==================== 规则评估接口 ====================

// ReevaluateAllRulesReq 重新评估所有规则
type ReevaluateAllRulesReq struct {
	g.Meta `path:"/autoQuotaPool/reevaluate" tags:"AutoQuotaPoolConfig" method:"post" summary:"重新评估所有规则"`
	DryRun bool `json:"dryRun" dc:"是否仅预览，不实际执行" default:"false"`
}

type ReevaluateAllRulesRes struct {
	Results []RuleEvaluationResult `json:"results" dc:"评估结果列表"`
	Total   int                    `json:"total" dc:"总匹配用户数"`
	OK      bool                   `json:"ok" dc:"是否成功"`
}

// RuleEvaluationResult 规则评估结果
type RuleEvaluationResult struct {
	RuleID          int64  `json:"ruleId" dc:"规则ID"`
	RuleName        string `json:"ruleName" dc:"规则名称"`
	MatchedUsers    int    `json:"matchedUsers" dc:"匹配用户数"`
	ExecutionTimeMs int    `json:"executionTimeMs" dc:"执行时间（毫秒）"`
}

// TestRuleReq 测试规则
type TestRuleReq struct {
	g.Meta         `path:"/autoQuotaPool/rules/test" tags:"AutoQuotaPoolConfig" method:"post" summary:"测试规则"`
	RuleName       string                   `json:"ruleName" v:"required|length:1,255" dc:"规则名称"`
	Description    string                   `json:"description" dc:"规则描述"`
	Enabled        bool                     `json:"enabled" dc:"是否启用"`
	Priority       int                      `json:"priority" v:"min:1" dc:"优先级"`
	QuotaPoolNames []string                 `json:"quotaPoolNames" v:"required|min-length:1" dc:"目标配额池名称列表"`
	Conditions     []AutoQuotaPoolCondition `json:"conditions" v:"required|min-length:1" dc:"条件列表"`
	TestUserUpns   []string                 `json:"testUserUpns" dc:"测试用户UPN列表（可选）"`
	MaxResults     int                      `json:"maxResults" v:"min:1|max:1000" dc:"最大结果数" default:"100"`
}

type TestRuleRes struct {
	MatchedUsers []string `json:"matchedUsers" dc:"匹配的用户UPN列表"`
	Total        int      `json:"total" dc:"总匹配数"`
	SQLQuery     string   `json:"sqlQuery" dc:"生成的SQL查询"`
	OK           bool     `json:"ok" dc:"是否成功"`
}

// ==================== 统计接口 ====================

// GetAutoQuotaPoolStatsReq 获取统计信息
type GetAutoQuotaPoolStatsReq struct {
	g.Meta `path:"/autoQuotaPool/stats" tags:"AutoQuotaPoolConfig" method:"get" summary:"获取统计信息"`
}

type GetAutoQuotaPoolStatsRes struct {
	TotalRules      int             `json:"totalRules" dc:"总规则数"`
	EnabledRules    int             `json:"enabledRules" dc:"启用规则数"`
	TotalMappings   int             `json:"totalMappings" dc:"总映射数"`
	TotalUsers      int             `json:"totalUsers" dc:"总用户数"`
	TotalQuotaPools int             `json:"totalQuotaPools" dc:"总配额池数"`
	LastEvaluatedAt *time.Time      `json:"lastEvaluatedAt" dc:"最后评估时间"`
	RuleStats       []RuleStat      `json:"ruleStats" dc:"规则统计"`
	QuotaPoolStats  []QuotaPoolStat `json:"quotaPoolStats" dc:"配额池统计"`
}

// RuleStat 规则统计
type RuleStat struct {
	RuleID          int64      `json:"ruleId" dc:"规则ID"`
	RuleName        string     `json:"ruleName" dc:"规则名称"`
	MatchedUsers    int        `json:"matchedUsers" dc:"匹配用户数"`
	QuotaPoolCount  int        `json:"quotaPoolCount" dc:"配额池数量"`
	LastEvaluatedAt *time.Time `json:"lastEvaluatedAt" dc:"最后评估时间"`
}

// QuotaPoolStat 配额池统计
type QuotaPoolStat struct {
	QuotaPoolName string `json:"quotaPoolName" dc:"配额池名称"`
	UserCount     int    `json:"userCount" dc:"用户数量"`
	RuleCount     int    `json:"ruleCount" dc:"规则数量"`
}
