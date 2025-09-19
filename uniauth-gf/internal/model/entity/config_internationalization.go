// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-19 20:51:46
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigInternationalization is the golang structure for table config_internationalization.
type ConfigInternationalization struct {
	Key          string      `json:"key"          orm:"key"          description:""` //
	Translations *gjson.Json `json:"translations" orm:"translations" description:""` //
	Description  string      `json:"description"  orm:"description"  description:""` //
	CreatedAt    *gtime.Time `json:"createdAt"    orm:"created_at"   description:""` //
	UpdatedAt    *gtime.Time `json:"updatedAt"    orm:"updated_at"   description:""` //
}
