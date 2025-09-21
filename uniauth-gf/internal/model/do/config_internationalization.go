// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-16 12:07:45
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigInternationalization is the golang structure of table config_internationalization for DAO operations like Where/Data.
type ConfigInternationalization struct {
	g.Meta      `orm:"table:config_internationalization, do:true"`
	Key         any         //
	ZhCn        any         //
	EnUs        any         //
	Description any         //
	CreatedAt   *gtime.Time //
	UpdatedAt   *gtime.Time //
}
