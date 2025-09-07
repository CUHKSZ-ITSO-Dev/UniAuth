package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

type BillingRecordReq struct {
	g.Meta  `path:"/record" tags:"Billing" method:"post" summary:"计费接口" dc:"xxxxxxxx计费接口"`
	Upn     string `json:"upn" v:"required"`
	Service string `json:"service" v:"required"`
	Product string `json:"product" v:"required"`

	CNYCost decimal.Decimal `json:"cny_cost"`
	USDCost decimal.Decimal `json:"usd_cost"`

	Extra *gjson.Json `json:"extra"`
}

type BillingRecordRes struct {
	Ok bool `json:"ok"`
}

type CheckReq struct {
	g.Meta `path:"/check" tags:"Billing" method:"post" summary:"检查余额" dc:"xxxxxxxx检查余额"`
	Upn    string `json:"upn" v:"required"`
}

type CheckRes struct {
	Ok bool `json:"ok"`
}
