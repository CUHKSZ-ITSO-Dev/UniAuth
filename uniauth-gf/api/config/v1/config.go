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
	ApproachName string          `json:"approachName" v:"required" dc:"模型名称（唯一）"`
	Pricing      *gjson.Json     `json:"pricing" dc:"定价配置（JSON）"`
	Discount     decimal.Decimal `json:"discount" dc:"折扣（0-1 之间的小数）"`
	ClientType   string          `json:"clientType" dc:"客户端类型（如：web、ios、android、server 等）"`
	ClientArgs   *gjson.Json     `json:"clientArgs" dc:"客户端参数（JSON）"`
	RequestArgs  *gjson.Json     `json:"requestArgs" dc:"请求参数（JSON）"`
	Servicewares []string        `json:"servicewares" dc:"服务项标识"`
}
type AddModelConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type EditModelConfigReq struct {
	g.Meta       `path:"/model" tags:"Config/Model" method:"put" summary:"编辑模型配置" dc:"编辑模型配置。"`
	ApproachName string          `json:"approachName" v:"required" dc:"模型名称（作为定位键）"`
	Pricing      *gjson.Json     `json:"pricing" dc:"定价配置（JSON）"`
	Discount     decimal.Decimal `json:"discount" dc:"折扣（0-1 之间的小数）"`
	ClientType   string          `json:"clientType" dc:"客户端类型（如：web、ios、android、server 等）"`
	ClientArgs   *gjson.Json     `json:"clientArgs" dc:"客户端参数（JSON）"`
	RequestArgs  *gjson.Json     `json:"requestArgs" dc:"请求参数（JSON）"`
	Servicewares []string        `json:"servicewares" dc:"服务项标识"`
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

type GetI18nConfigReq struct {
	g.Meta `path:"/i18n/:lang" tags:"Config/I18n" method:"get" summary:"获取i18n" dc:"获取一个语言的所有翻译配置"`
	Lang   string `json:"lang" v:"required" dc:"语言" example:"en-US"`
}
type GetI18nConfigRes struct {
	g.Meta `mime:"application/json" dc:"返回某个指定语言的所有翻译配置"`
	Config *gjson.Json
}

type AddI18nItemReq struct {
	g.Meta `path:"/i18n" tags:"Config/I18n" method:"post" summary:"添加i18n" dc:"添加一项i18n一个语言的配置"`
	Lang   string `json:"lang" v:"required" dc:"语言" example:"en-US"`
	Key    string `json:"key" v:"required" dc:"键" example:"navBar.title"`
	Value  string `json:"value" v:"required" dc:"值" example:"统一鉴权"`
}
type AddI18nItemRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type EditI18nItemReq struct {
	g.Meta `path:"/i18n" tags:"Config/I18n" method:"put" summary:"编辑i18n" dc:"编辑一项i18n一个语言的配置"`
	Lang   string `json:"lang" v:"required" dc:"语言" example:"en-US"`
	Key    string `json:"key" v:"required" dc:"键" example:"navBar.title"`
	Value  string `json:"value" v:"required" dc:"值" example:"统一鉴权"`
}
type EditI18nItemRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteI18ConfigReq struct {
	g.Meta `path:"/i18n" tags:"Config/I18n" method:"delete" summary:"删除i18n" dc:"删除指定Key的所有语言配置。"`
	Key    string `json:"key" v:"required" dc:"键" example:"navBar.title"`
}
type DeleteI18ConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type GetAllLangsReq struct {
	g.Meta `path:"/i18n" tags:"Config/I18n" method:"get" summary:"获取所有语言的列表"`
}
type GetAllLangsRes struct {
	Langs []string `json:"langs" dc:"语言列表" example:"['en-US', 'zh-CN']"`
}
