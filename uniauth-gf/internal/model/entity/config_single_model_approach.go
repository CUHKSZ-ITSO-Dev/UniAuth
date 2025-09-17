// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-16 12:07:45
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

// ConfigSingleModelApproach is the golang structure for table config_single_model_approach.
type ConfigSingleModelApproach struct {
	ApproachName string          `json:"approachName" orm:"approach_name" description:""` //
	Pricing      *gjson.Json     `json:"pricing"      orm:"pricing"       description:""` //
	Discount     decimal.Decimal `json:"discount"     orm:"discount"      description:""` //
	ClientType   string          `json:"clientType"   orm:"client_type"   description:""` //
	ClientArgs   *gjson.Json     `json:"clientArgs"   orm:"client_args"   description:""` //
	RequestArgs  *gjson.Json     `json:"requestArgs"  orm:"request_args"  description:""` //
	Servicewares []string        `json:"servicewares" orm:"servicewares"  description:""` //
	UpdatedAt    *gtime.Time     `json:"updatedAt"    orm:"updated_at"    description:""` //
	CreatedAt    *gtime.Time     `json:"createdAt"    orm:"created_at"    description:""` //
}
