// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-18 00:51:49
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigExchangeRate is the golang structure of table config_exchange_rate for DAO operations like Where/Data.
type ConfigExchangeRate struct {
	g.Meta    `orm:"table:config_exchange_rate, do:true"`
	Date      *gtime.Time // 汇率日期
	F         any         // 本位货币
	T         any         // 标的货币
	Rate      any         // 1 本位货币 = rate 标的货币
	CreatedAt *gtime.Time //
}
