// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-20 21:36:19
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigInternationalization is the golang structure for table config_internationalization.
type ConfigInternationalization struct {
	Key         string      `json:"key"         orm:"key"         description:""` //
	ZhCn        string      `json:"zhCn"        orm:"zh_cn"       description:""` //
	EnUs        string      `json:"enUs"        orm:"en_us"       description:""` //
	Description string      `json:"description" orm:"description" description:""` //
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"  description:""` //
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"  description:""` //
}
