package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

type GetQuotaPoolReq struct {
	g.Meta        `path:"/" tags:"QuotaPool" method:"get" summary:"获取配额池的详细配置"`
	QuotaPoolName string `json:"quotaPoolName" dc:"指定配额池名称（可选）"`
}

type QuotaPoolItem struct {
	Id             int64           `json:"id"`
	QuotaPoolName  string          `json:"quotaPoolName"`
	CronCycle      string          `json:"cronCycle"`
	RegularQuota   decimal.Decimal `json:"regularQuota"`
	RemainingQuota decimal.Decimal `json:"remainingQuota"`
	LastResetAt    string          `json:"lastResetAt"`
	ExtraQuota     decimal.Decimal `json:"extraQuota"`
	Personal       bool            `json:"personal"`
	Disabled       bool            `json:"disabled"`
	UserinfosRules *gjson.Json     `json:"userinfosRules"`
	CreatedAt      string          `json:"createdAt"`
	UpdatedAt      string          `json:"updatedAt"`
}

type GetQuotaPoolRes struct {
	Items []QuotaPoolItem `json:"items" dc:"配额池列表或单个配置"`
}

type NewQuotaPoolReq struct {
	g.Meta `path:"/" tags:"QuotaPool" method:"post" summary:"新建配额池"`
	// 配额池名称（唯一）
	QuotaPoolName string `json:"quotaPoolName" v:"required" example:"itso-deep-research-vip"`
	// 刷新周期（标准 Cron 表达式，支持 6 字段）
	CronCycle string `json:"cronCycle" v:"required" example:"0 0 3 * * *"`
	// 定期配额（每周期重置）
	RegularQuota decimal.Decimal `json:"regularQuota" v:"required" example:"1000"`
	// 是否个人配额池
	Personal bool `json:"personal" v:"required" example:"false"`
	// 是否禁用
	Disabled bool `json:"disabled" d:"false" example:"false"`
	// 初始加油包
	ExtraQuota decimal.Decimal `json:"extraQuota" d:"0" example:"0"`
	// ITTools 规则（可选）
	UserinfosRules *gjson.Json `json:"userinfosRules"`
}

type NewQuotaPoolRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type EditQuotaPoolReq struct {
	g.Meta         `path:"/" tags:"QuotaPool" method:"put" summary:"编辑配额池"`
	QuotaPoolName  string          `json:"quotaPoolName" v:"required"`
	CronCycle      string          `json:"cronCycle" v:"required"`
	RegularQuota   decimal.Decimal `json:"regularQuota" v:"required"`
	Personal       bool            `json:"personal" v:"required"`
	Disabled       bool            `json:"disabled"`
	ExtraQuota     decimal.Decimal `json:"extraQuota"`
	UserinfosRules *gjson.Json     `json:"userinfosRules"`
}

type EditQuotaPoolRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteQuotaPoolReq struct {
	g.Meta `path:"/" tags:"QuotaPool" method:"delete" summary:"删除配额池"`
}

type DeleteQuotaPoolRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}
