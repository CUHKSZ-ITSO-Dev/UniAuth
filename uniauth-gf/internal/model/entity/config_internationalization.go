// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// ConfigInternationalization is the golang structure for table config_internationalization.
type ConfigInternationalization struct {
	Key         string      `json:"key"         orm:"key"         ` //
	AppId       string      `json:"appId"       orm:"app_id"      ` //
	ZhCn        string      `json:"zhCn"        orm:"zh_cn"       ` //
	EnUs        string      `json:"enUs"        orm:"en_us"       ` //
	Description string      `json:"description" orm:"description" ` //
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"  ` //
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"  ` //
}
