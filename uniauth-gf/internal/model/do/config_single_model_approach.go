// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-19 15:40:33
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
	Discount     any         // 折扣
	ClientType   any         // 客户端类型
	ClientArgs   *gjson.Json // 客户端参数（JSON）
	RequestArgs  *gjson.Json // 请求参数（JSON）
	Servicewares []string    // 服务项标识
	CreatedAt    *gtime.Time // 创建时间
	UpdatedAt    *gtime.Time // 更新时间
}
