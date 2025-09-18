// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-18 00:51:49
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
	ApproachName any         // 模型名称
	Pricing      *gjson.Json // 定价配置（JSON）
	Discount     any         // 折扣（0-1 之间的小数，例：0.1、0.2、1）
	ClientType   any         // 客户端类型（如：web、ios、android、server 等）
	ClientArgs   *gjson.Json // 客户端参数（JSON）
	RequestArgs  *gjson.Json // 请求参数（JSON）
	Servicewares []string    // 服务项标识
	CreatedAt    *gtime.Time // 创建时间
	UpdatedAt    *gtime.Time // 更新时间
}
