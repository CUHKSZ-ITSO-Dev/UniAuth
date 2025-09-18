// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 23:32:05
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigSingleModelApproach is the golang structure of table config_single_model_approach for DAO operations like Where/Data.
type ConfigSingleModelApproach struct {
	g.Meta       `orm:"table:config_single_model_approach, do:true"`
	ApproachName any         //
	Pricing      *gjson.Json //
	Discount     any         //
	ClientType   any         //
	ClientArgs   *gjson.Json //
	RequestArgs  *gjson.Json //
	Servicewares []string    //
	UpdatedAt    *gtime.Time //
	CreatedAt    *gtime.Time //
}
