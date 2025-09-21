package v1

import (
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

type ModelConfigItem struct {
	entity.ConfigSingleModelApproach
}

type GetModelConfigReq struct {
	g.Meta `path:"/model/all" tags:"Config/Model" method:"get" summary:"获取配置"`
}
type GetModelConfigRes struct {
	Items []ModelConfigItem `json:"items" dc:"模型配置列表"`
}

type AddModelConfigReq struct {
	g.Meta       `path:"/model" tags:"Config/Model" method:"post" summary:"添加模型配置"`
	ApproachName string          `json:"approachName" v:"required" dc:"模型名称" example:"gpt-4o"`
	Pricing      *gjson.Json     `json:"pricing" v:"required" dc:"定价配置"`
	Discount     decimal.Decimal `json:"discount" d:"1" dc:"折扣" example:"1.0"`
	ClientType   string          `json:"clientType" v:"required|in:AsyncAzureOpenAI,AsyncOpenAI" dc:"客户端类型"`
	ClientArgs   *gjson.Json     `json:"clientArgs" dc:"客户端参数"`
	RequestArgs  *gjson.Json     `json:"requestArgs" dc:"请求参数"`
	Servicewares []string        `json:"servicewares" d:"[]" dc:"服务中间件标识"`
}
type AddModelConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type EditModelConfigReq struct {
	g.Meta       `path:"/model" tags:"Config/Model" method:"put" summary:"编辑模型配置" dc:"编辑模型配置。"`
	ApproachName string           `json:"approachName" v:"required" dc:"模型名称"`
	Pricing      *gjson.Json      `json:"pricing" dc:"定价配置"`
	Discount     *decimal.Decimal `json:"discount" dc:"折扣"`
	ClientType   *string          `json:"clientType" dc:"客户端类型"`
	ClientArgs   *gjson.Json      `json:"clientArgs" dc:"客户端参数"`
	RequestArgs  *gjson.Json      `json:"requestArgs" dc:"请求参数"`
	Servicewares []string         `json:"servicewares" dc:"服务项标识"`
}
type EditModelConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteModelConfigReq struct {
	g.Meta       `path:"/model" tags:"Config/Model" method:"delete" summary:"删除模型配置"`
	ApproachName string `json:"approachName" dc:"模型名称（唯一）"`
}
type DeleteModelConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}
