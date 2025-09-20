// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-19 15:40:33
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

// ConfigSingleModelApproach is the golang structure for table config_single_model_approach.
type ConfigSingleModelApproach struct {
	ApproachName string          `json:"approachName" orm:"approach_name" description:"模型名称"`        // 模型名称
	Pricing      *gjson.Json     `json:"pricing"      orm:"pricing"       description:"定价配置（JSON）"`  // 定价配置（JSON）
	Discount     decimal.Decimal `json:"discount"     orm:"discount"      description:"折扣"`          // 折扣
	ClientType   string          `json:"clientType"   orm:"client_type"   description:"客户端类型"`       // 客户端类型
	ClientArgs   *gjson.Json     `json:"clientArgs"   orm:"client_args"   description:"客户端参数（JSON）"` // 客户端参数（JSON）
	RequestArgs  *gjson.Json     `json:"requestArgs"  orm:"request_args"  description:"请求参数（JSON）"`  // 请求参数（JSON）
	Servicewares []string        `json:"servicewares" orm:"servicewares"  description:"服务项标识"`       // 服务项标识
	CreatedAt    *gtime.Time     `json:"createdAt"    orm:"created_at"    description:"创建时间"`        // 创建时间
	UpdatedAt    *gtime.Time     `json:"updatedAt"    orm:"updated_at"    description:"更新时间"`        // 更新时间
}
