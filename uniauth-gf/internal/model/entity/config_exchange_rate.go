// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT. Created at 2025-09-20 21:36:19
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/shopspring/decimal"
)

// ConfigExchangeRate is the golang structure for table config_exchange_rate.
type ConfigExchangeRate struct {
	Date      *gtime.Time     `json:"date"      orm:"date"       description:"汇率日期"`               // 汇率日期
	F         string          `json:"f"         orm:"f"          description:"本位货币"`               // 本位货币
	T         string          `json:"t"         orm:"t"          description:"标的货币"`               // 标的货币
	Rate      decimal.Decimal `json:"rate"      orm:"rate"       description:"1 本位货币 = rate 标的货币"` // 1 本位货币 = rate 标的货币
	CreatedAt *gtime.Time     `json:"createdAt" orm:"created_at" description:""`                   //
}
