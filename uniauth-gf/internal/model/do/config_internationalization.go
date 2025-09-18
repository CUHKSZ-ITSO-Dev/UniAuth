// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-17 23:54:41
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigInternationalization is the golang structure of table config_internationalization for DAO operations like Where/Data.
type ConfigInternationalization struct {
	g.Meta      `orm:"table:config_internationalization, do:true"`
	LangCode    any         //
	Key         any         //
	Value       any         //
	Description any         //
	CreatedAt   *gtime.Time //
	UpdatedAt   *gtime.Time //
}
