package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

type GetModelConfigReq struct {
	g.Meta `path:"/model/all" tags:"Config/Model" method:"get" summary:"获取配置"`
}
type GetModelConfigRes struct {
	Config string `json:"config" dc:"配置"`
}

type AddModelConfigReq struct {
	g.Meta `path:"/model" tags:"Config/Model" method:"post" summary:"添加模型配置"`
}
type AddModelConfigRes struct {
	Config string `json:"config" dc:"配置"`
}

type EditModelConfigReq struct {
	g.Meta       `path:"/model" tags:"Config/Model" method:"put" summary:"编辑模型配置" dc:"编辑模型配置。"`
	ApproachName string          `json:"approachName" v:"required" dc:"模型名称" example:"gpt-4o"`
	Pricing      *gjson.Json     `json:"pricing" v:"required" dc:"定价配置"`
	Discount     decimal.Decimal `json:"discount" d:"1" dc:"折扣" example:"1.0"`
	ClientType   string          `json:"clientType" v:"required|in:AsyncAzureOpenAI,AsyncOpenAI" dc:"客户端类型"`
	ClientArgs   *gjson.Json     `json:"clientArgs" dc:"客户端参数"`
	RequestArgs  *gjson.Json     `json:"requestArgs" dc:"请求参数"`
	Servicewares []string        `json:"servicewares" d:"[]" dc:"服务中间件标识"`
}
type EditModelConfigRes struct {
	Config string `json:"config" dc:"配置"`
	OK     bool   `json:"ok" dc:"是否成功"`
}

type DeleteModelConfigReq struct {
	g.Meta       `path:"/model" tags:"Config/Model" method:"delete" summary:"删除模型配置"`
	ApproachName string `json:"ApproachName" v:"required" dc:"Approach 名称"`
}
type DeleteModelConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}
type GetAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"get" summary:"获取自动配额池规则"`
}
type GetAutoQuotaPoolConfigRes struct {
	AutoQuotaPoolConfigs []string `json:"autoQuotaPoolConfigs" dc:"自动配额池规则"`
}

type EditAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"put" summary:"编辑自动配额池规则"`
	// Conditions UserInfos.Filter
	// DefaultValue
}
type EditAutoQuotaPoolConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"delete" summary:"删除自动配额池规则"`
}
type DeleteAutoQuotaPoolConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type AddAutoQuotaPoolConfigReq struct {
	g.Meta `path:"/autoConfig" tags:"Config/AutoQuotaPoolConfig" method:"post" summary:"新增自动配额池规则"`
}
type AddAutoQuotaPoolConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}
