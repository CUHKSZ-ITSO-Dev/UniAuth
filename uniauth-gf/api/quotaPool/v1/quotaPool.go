package v1

import (
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

// PaginationReq 分页请求参数
type PaginationReq struct {
	Page     int  `json:"page" v:"min:1" dc:"页码，从1开始" default:"1"`
	PageSize int  `json:"pageSize" v:"min:1|max:1000" dc:"每页条数，最大1000" default:"20"`
	All      bool `json:"all" dc:"是否返回全部数据，true时忽略分页参数，但仍有最大限制保护"`
}
type GetQuotaPoolReq struct {
	g.Meta        `path:"/" tags:"QuotaPool" method:"get" summary:"获取配额池的详细配置"`
	QuotaPoolName string         `json:"quotaPoolName" dc:"指定配额池名称（可选）"`
	Pagination    *PaginationReq `json:"pagination" dc:"分页参数，支持分页或查询全部"`
}

type QuotaPoolItem struct {
	entity.QuotapoolQuotaPool
}

type GetQuotaPoolRes struct {
	Total      int             `json:"total" dc:"总记录数"`
	Page       int             `json:"page" dc:"当前页码"`
	PageSize   int             `json:"pageSize" dc:"每页条数"`
	TotalPages int             `json:"totalPages" dc:"总页数"`
	IsAll      bool            `json:"isAll" dc:"是否为全部数据查询"`
	Items      []QuotaPoolItem `json:"items" dc:"配额池列表或单个配置"`
}

type NewQuotaPoolReq struct {
	g.Meta `path:"/" tags:"QuotaPool" method:"post" summary:"新建配额池"`
	// 配额池名称（唯一）
	QuotaPoolName string `json:"quotaPoolName" v:"required" example:"itso-deep-research-vip"`
	// 刷新周期（标准 Cron 表达式，支持 6 字段）
	CronCycle string `json:"cronCycle" v:"required" example:"0 0 3 * *"`
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
	g.Meta        `path:"/" tags:"QuotaPool" method:"delete" summary:"删除配额池"`
	QuotaPoolName string `json:"quotaPoolName" v:"required"`
}

type DeleteQuotaPoolRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}
