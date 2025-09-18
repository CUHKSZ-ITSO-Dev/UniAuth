package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

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

// ==================== 条件管理接口 ====================

// GetAutoQuotaPoolConditionsReq 获取规则的条件列表
type GetAutoQuotaPoolConditionsReq struct {
	g.Meta `path:"/autoQuotaPool/rules/{ruleId}/conditions" tags:"AutoQuotaPoolConfig/Conditions" method:"get" summary:"获取规则的条件列表"`
	RuleID int64 `json:"ruleId" v:"required" dc:"规则ID"`
}

type GetAutoQuotaPoolConditionsRes struct {
	Conditions []AutoQuotaPoolCondition `json:"conditions" dc:"条件列表"`
}

// AddAutoQuotaPoolConditionReq 新增条件
type AddAutoQuotaPoolConditionReq struct {
	g.Meta            `path:"/autoQuotaPool/rules/{ruleId}/conditions" tags:"AutoQuotaPoolConfig/Conditions" method:"post" summary:"新增条件"`
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
	g.Meta            `path:"/autoQuotaPool/conditions/{id}" tags:"AutoQuotaPoolConfig/Conditions" method:"put" summary:"编辑条件"`
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
	g.Meta `path:"/autoQuotaPool/conditions/{id}" tags:"AutoQuotaPoolConfig/Conditions" method:"delete" summary:"删除条件"`
	ID     int64 `json:"id" v:"required" dc:"条件ID"`
}

type DeleteAutoQuotaPoolConditionRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}
