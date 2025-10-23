package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

type BillingRecordReq struct {
	// g.Meta `path:"/record" tags:"Billing" method:"post" summary:"计费接口" dc:"上传计费请求，完成配额池的扣费。"`
	g.Meta `path:"/record" tags:"Billing" method:"post" summary:"计费接口" dc:"上传计费请求，完成配额池的扣费。" resEg:"resource/interface/billing/billing_record_req.json"`

	Upn     string `json:"upn" v:"required"`
	Service string `json:"service" v:"required"`
	Product string `json:"product" v:"required"`
	Source  string `json:"source" v:"required"`

	CNYCost decimal.Decimal `json:"cny_cost"`
	USDCost decimal.Decimal `json:"usd_cost"`

	Remark *gjson.Json `json:"detail"`
}
type BillingRecordRes struct {
	Ok bool `json:"ok" v:"required"`
}

type CheckBalanceReq struct {
	g.Meta    `path:"/check" tags:"Billing" method:"post" summary:"检查余额" dc:"刷新、检查配额池的余额。"`
	QuotaPool string `json:"quotaPool" v:"required" example:"itso-deep-research-vip"`
}
type CheckBalanceRes struct {
	Ok bool `json:"ok" v:"required" example:"true"`
}

type CheckTokensUsageReq struct {
	g.Meta    `path:"/checkTokensUsage" tags:"Billing" method:"post" summary:"检查Tokens使用情况" dc:"检查Tokens使用情况"`
	Upn       string `json:"upn" v:"required" example:"122020255@link.cuhk.edu.cn"`
	QuotaPool string `json:"quotaPool" v:"required" example:"itso-deep-research-vip"`
	NDays     int    `json:"nDays" v:"required|integer" d:"7"`
}
type CheckTokensUsageRes struct {
	// 这个是对话前端下面的柱状图，最近7天
	g.Meta      `resEg:"resource/interface/billing/check_tokens_usage_res.json"`
	TokensUsage *gjson.Json `json:"tokensUsage" v:"required"`
}

type GetBillingOptionsReq struct {
	g.Meta    `path:"/options" tags:"Billing" method:"post" summary:"获取计费选项" dc:"获取指定配额池的所有服务和产品类型选项"`
	QuotaPool string `json:"quotaPool" v:"required" example:"itso-deep-research-vip"`
}
type GetBillingOptionsRes struct {
	Services []string `json:"services" example:"[\"openai\", \"claude\", \"gemini\"]" dc:"该配额池存在的所有服务类型"`
	Products []string `json:"products" example:"[\"gpt-4\", \"gpt-3.5-turbo\", \"claude-3-opus\"]" dc:"该配额池存在的所有产品类型"`
}

type DepartmentQuestionCountStatsReq struct {
	g.Meta `path:"/stats/department/questionCount" tags:"Billing" method:"GET" summary:"分部门提问次数统计" dc:"按日期和部门统计提问次数"`
	NDays  int `d:"7" example:"7" dc:"数据跨度天数"`
}

type DepartmentQuestionCountStatsRes struct {
	g.Meta             `resEg:"resource/interface/billing/department_question_count_stats_res.json"`
	QuestionCountStats *gjson.Json `json:"questionCountStats" dc:"统计数据，按日期和部门分组"`
}

type DepartmentUsageStatsReq struct {
	g.Meta `path:"/stats/department/usage" tags:"Billing" method:"GET" summary:"分部门使用统计" dc:"按日期和部门统计使用情况"`
	NDays  int `d:"7" example:"7" dc:"数据跨度天数"`
}

type DepartmentUsageStatsRes struct {
	g.Meta    `resEg:"resource/interface/billing/department_usage_stats_res.json"`
	StatsData *gjson.Json `json:"statsData" dc:"统计数据，按日期和部门分组"`
}
