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
	Plan    string `json:"plan" v:"required|in:Included,Quota Pool"`
	Source  string `json:"source" v:"required"`

	CNYCost decimal.Decimal `json:"cny_cost"`
	USDCost decimal.Decimal `json:"usd_cost"`

	Remark *gjson.Json `json:"detail"`
}
type BillingRecordRes struct {
	Ok bool `json:"ok"`
}

type CheckBalanceReq struct {
	g.Meta    `path:"/check" tags:"Billing" method:"post" summary:"检查是否可以使用某个产品" dc:"根据给定的参数，检查是否可以使用某个产品。"`
	Upn       string `json:"upn" v:"required"`
	Svc       string `json:"svc" v:"required"`
	Product   string `json:"product" v:"required"`
	QuotaPool string `json:"quotaPool" v:"required"`
}
type CheckBalanceRes struct {
	Ok  bool   `json:"ok"`
	Err string `json:"err"`
}

type CheckTokensUsageReq struct {
	g.Meta    `path:"/checkTokensUsage" tags:"Billing" method:"post" summary:"检查Tokens使用情况" dc:"检查Tokens使用情况"`
	Upn       string `json:"upn" v:"required"`
	QuotaPool string `json:"quotaPool" v:"required"`
}
type CheckTokensUsageRes struct {
	// 这个是对话前端下面的柱状图，最近7天
	TokensUsage *gjson.Json `json:"tokensUsage"`
}
