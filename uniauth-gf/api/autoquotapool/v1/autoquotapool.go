package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// ==================== 自动配额池规则管理 ====================

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

// AutoQuotaPoolCondition 自动配额池条件结构
type AutoQuotaPoolCondition struct {
	ID                int64      `json:"id" dc:"条件ID"`
	RuleID            int64      `json:"ruleId" dc:"规则ID"`
	ParentConditionID *int64     `json:"parentConditionId" dc:"父条件ID"`
	ConditionType     string     `json:"conditionType" dc:"条件类型：field/group"`
	LogicalOperator   string     `json:"logicalOperator" dc:"逻辑操作符：AND/OR"`
	FieldName         string     `json:"fieldName" dc:"字段名"`
	Operator          string     `json:"operator" dc:"操作符"`
	FieldValue        string     `json:"fieldValue" dc:"单个字段值"`
	FieldValues       []string   `json:"fieldValues" dc:"多个字段值"`
	SortOrder         int        `json:"sortOrder" dc:"排序"`
	CreatedAt         *time.Time `json:"createdAt" dc:"创建时间"`
}

// AutoQuotaPoolMapping 用户配额池映射结构
type AutoQuotaPoolMapping struct {
	ID            int64      `json:"id" dc:"映射ID"`
	UserUpn       string     `json:"userUpn" dc:"用户UPN"`
	QuotaPoolName string     `json:"quotaPoolName" dc:"配额池名称"`
	RuleID        int64      `json:"ruleId" dc:"规则ID"`
	RuleName      string     `json:"ruleName" dc:"规则名称"`
	MatchedAt     *time.Time `json:"matchedAt" dc:"匹配时间"`
	CreatedAt     *time.Time `json:"createdAt" dc:"创建时间"`
	// 用户信息（查询时返回）
	DisplayName  string `json:"displayName,omitempty" dc:"用户显示名"`
	Department   string `json:"department,omitempty" dc:"部门"`
	IdentityType string `json:"identityType,omitempty" dc:"身份类型"`
}

// ==================== 规则管理接口 ====================

// GetAutoQuotaPoolRulesReq 获取自动配额池规则列表
type GetAutoQuotaPoolRulesReq struct {
	g.Meta       `path:"/autoQuotaPool/rules" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"获取自动配额池规则列表"`
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
	g.Meta `path:"/autoQuotaPool/rules/{id}" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"获取自动配额池规则详情"`
	ID     int64 `json:"id" v:"required" dc:"规则ID"`
}

type GetAutoQuotaPoolRuleRes struct {
	Rule       AutoQuotaPoolRule        `json:"rule" dc:"规则详情"`
	Conditions []AutoQuotaPoolCondition `json:"conditions" dc:"条件列表"`
}

// AddAutoQuotaPoolRuleReq 新增自动配额池规则
type AddAutoQuotaPoolRuleReq struct {
	g.Meta         `path:"/autoQuotaPool/rules" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"新增自动配额池规则"`
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
	g.Meta         `path:"/autoQuotaPool/rules/{id}" tags:"Config/AutoQuotaPoolConfig" method:"put" summary:"编辑自动配额池规则"`
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
	g.Meta `path:"/autoQuotaPool/rules/{id}" tags:"Config/AutoQuotaPoolConfig" method:"delete" summary:"删除自动配额池规则"`
	ID     int64 `json:"id" v:"required" dc:"规则ID"`
}

type DeleteAutoQuotaPoolRuleRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

// ==================== 条件管理接口 ====================

// GetAutoQuotaPoolConditionsReq 获取规则的条件列表
type GetAutoQuotaPoolConditionsReq struct {
	g.Meta `path:"/autoQuotaPool/rules/{ruleId}/conditions" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"获取规则的条件列表"`
	RuleID int64 `json:"ruleId" v:"required" dc:"规则ID"`
}

type GetAutoQuotaPoolConditionsRes struct {
	Conditions []AutoQuotaPoolCondition `json:"conditions" dc:"条件列表"`
}

// AddAutoQuotaPoolConditionReq 新增条件
type AddAutoQuotaPoolConditionReq struct {
	g.Meta            `path:"/autoQuotaPool/rules/{ruleId}/conditions" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"新增条件"`
	RuleID            int64    `json:"ruleId" v:"required" dc:"规则ID"`
	ParentConditionID *int64   `json:"parentConditionId" dc:"父条件ID"`
	ConditionType     string   `json:"conditionType" v:"required|in:field,group" dc:"条件类型"`
	LogicalOperator   string   `json:"logicalOperator" v:"in:AND,OR" dc:"逻辑操作符" default:"AND"`
	FieldName         string   `json:"fieldName" dc:"字段名"`
	Operator          string   `json:"operator" dc:"操作符"`
	FieldValue        string   `json:"fieldValue" dc:"单个字段值"`
	FieldValues       []string `json:"fieldValues" dc:"多个字段值"`
	SortOrder         int      `json:"sortOrder" dc:"排序" default:"0"`
}

type AddAutoQuotaPoolConditionRes struct {
	ConditionID int64 `json:"conditionId" dc:"新创建的条件ID"`
	OK          bool  `json:"ok" dc:"是否成功"`
}

// EditAutoQuotaPoolConditionReq 编辑条件
type EditAutoQuotaPoolConditionReq struct {
	g.Meta            `path:"/autoQuotaPool/conditions/{id}" tags:"Config/AutoQuotaPoolConfig" method:"put" summary:"编辑条件"`
	ID                int64    `json:"id" v:"required" dc:"条件ID"`
	ParentConditionID *int64   `json:"parentConditionId" dc:"父条件ID"`
	ConditionType     string   `json:"conditionType" v:"required|in:field,group" dc:"条件类型"`
	LogicalOperator   string   `json:"logicalOperator" v:"in:AND,OR" dc:"逻辑操作符"`
	FieldName         string   `json:"fieldName" dc:"字段名"`
	Operator          string   `json:"operator" dc:"操作符"`
	FieldValue        string   `json:"fieldValue" dc:"单个字段值"`
	FieldValues       []string `json:"fieldValues" dc:"多个字段值"`
	SortOrder         int      `json:"sortOrder" dc:"排序"`
}

type EditAutoQuotaPoolConditionRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

// DeleteAutoQuotaPoolConditionReq 删除条件
type DeleteAutoQuotaPoolConditionReq struct {
	g.Meta `path:"/autoQuotaPool/conditions/{id}" tags:"Config/AutoQuotaPoolConfig" method:"delete" summary:"删除条件"`
	ID     int64 `json:"id" v:"required" dc:"条件ID"`
}

type DeleteAutoQuotaPoolConditionRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

// ==================== 映射查询接口 ====================

// GetUserQuotaPoolsReq 根据用户查询配额池
type GetUserQuotaPoolsReq struct {
	g.Meta  `path:"/autoQuotaPool/user/{upn}/quotaPools" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"根据用户查询配额池"`
	UserUpn string `json:"upn" v:"required" dc:"用户UPN"`
}

type GetUserQuotaPoolsRes struct {
	UserUpn    string                 `json:"userUpn" dc:"用户UPN"`
	QuotaPools []AutoQuotaPoolMapping `json:"quotaPools" dc:"配额池列表"`
	Total      int                    `json:"total" dc:"总数量"`
}

// GetQuotaPoolUsersReq 根据配额池查询用户
type GetQuotaPoolUsersReq struct {
	g.Meta        `path:"/autoQuotaPool/quotaPool/{quotaPoolName}/users" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"根据配额池查询用户"`
	QuotaPoolName string `json:"quotaPoolName" v:"required" dc:"配额池名称"`
	Page          int    `json:"page" v:"min:1" dc:"页码" default:"1"`
	PageSize      int    `json:"pageSize" v:"min:1|max:1000" dc:"每页条数" default:"20"`
}

type GetQuotaPoolUsersRes struct {
	QuotaPoolName string                 `json:"quotaPoolName" dc:"配额池名称"`
	Users         []AutoQuotaPoolMapping `json:"users" dc:"用户列表"`
	Total         int                    `json:"total" dc:"总记录数"`
	Page          int                    `json:"page" dc:"当前页码"`
	PageSize      int                    `json:"pageSize" dc:"每页条数"`
	TotalPages    int                    `json:"totalPages" dc:"总页数"`
}

// GetAutoQuotaPoolMappingsReq 获取映射列表
type GetAutoQuotaPoolMappingsReq struct {
	g.Meta        `path:"/autoQuotaPool/mappings" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"获取映射列表"`
	UserUpn       string `json:"userUpn" dc:"用户UPN（可选过滤）"`
	QuotaPoolName string `json:"quotaPoolName" dc:"配额池名称（可选过滤）"`
	RuleID        *int64 `json:"ruleId" dc:"规则ID（可选过滤）"`
	Page          int    `json:"page" v:"min:1" dc:"页码" default:"1"`
	PageSize      int    `json:"pageSize" v:"min:1|max:1000" dc:"每页条数" default:"20"`
}

type GetAutoQuotaPoolMappingsRes struct {
	Mappings   []AutoQuotaPoolMapping `json:"mappings" dc:"映射列表"`
	Total      int                    `json:"total" dc:"总记录数"`
	Page       int                    `json:"page" dc:"当前页码"`
	PageSize   int                    `json:"pageSize" dc:"每页条数"`
	TotalPages int                    `json:"totalPages" dc:"总页数"`
}

// ==================== 规则评估接口 ====================

// ReevaluateAllRulesReq 重新评估所有规则
type ReevaluateAllRulesReq struct {
	g.Meta `path:"/autoQuotaPool/reevaluate" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"重新评估所有规则"`
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
	g.Meta         `path:"/autoQuotaPool/rules/test" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"测试规则"`
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
	g.Meta `path:"/autoQuotaPool/stats" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"获取统计信息"`
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
