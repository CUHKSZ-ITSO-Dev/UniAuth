package v1

import (
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/shopspring/decimal"
)

// ==================== Filter ====================
// FilterCondition 表示单个过滤条件
type FilterCondition struct {
	Field string `json:"field" v:"required|length:1,50" dc:"字段名"`
	Op    string `json:"op" v:"required|in:eq,neq,gt,gte,lt,lte,like,ilike,in,notin,contains,notcontains,startswith,endswith,isnull,isnotnull" dc:"操作符"`
	Value *g.Var `json:"value" dc:"条件值"`
}

// FilterGroup 表示一组过滤条件，支持嵌套
type FilterGroup struct {
	Logic      string             `json:"logic" v:"in:and,or" dc:"逻辑关系: and(且), or(或)"`
	Conditions []*FilterCondition `json:"conditions" dc:"过滤条件列表"`
	Groups     []*FilterGroup     `json:"groups" dc:"嵌套的条件组"`
}

// SortCondition 表示排序条件
type SortCondition struct {
	Field string `json:"field" v:"required|length:1,50" dc:"排序字段"`
	Order string `json:"order" v:"in:asc,desc" dc:"排序方向"`
}

// PaginationReq 分页请求参数
type PaginationReq struct {
	Page     int  `json:"page" v:"min:1" dc:"页码，从1开始" default:"1"`
	PageSize int  `json:"pageSize" v:"min:1|max:1000" dc:"每页条数，最大1000" default:"20"`
	All      bool `json:"all" dc:"是否返回全部数据"`
}

type GetQuotaPoolReq struct {
	g.Meta        `path:"/" tags:"QuotaPool" method:"get" summary:"获取单个配额池详细配置"`
	QuotaPoolName string `json:"quotaPoolName" v:"required" dc:"配额池名称"`
}
type GetQuotaPoolRes = entity.QuotapoolQuotaPool

type FilterQuotaPoolReq struct {
	g.Meta     `path:"/filter" tags:"QuotaPool" method:"post" summary:"筛选配额池" dc:"根据过滤条件筛选配额池，支持复杂条件查询、排序和分页"`
	Filter     *FilterGroup     `json:"filter" dc:"过滤条件，支持复杂的逻辑组合查询"`
	Sort       []*SortCondition `json:"sort" dc:"排序条件，支持多字段排序"`
	Pagination *PaginationReq   `json:"pagination" dc:"分页参数"`
}

type FilterQuotaPoolRes struct {
	Items      []entity.QuotapoolQuotaPool `json:"items" dc:"配额池列表"`
	Total      int                         `json:"total" dc:"总记录数"`
	Page       int                         `json:"page" dc:"当前页码"`
	PageSize   int                         `json:"pageSize" dc:"每页条数"`
	TotalPages int                         `json:"totalPages" dc:"总页数"`
	IsAll      bool                        `json:"isAll" dc:"是否为全部数据查询"`
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
	g.Meta         `path:"/" tags:"QuotaPool" method:"put" summary:"编辑配额池" dc:"除了 quotaPoolName 字段必传之外，其他字段可以不传。不传的字段不会更新。"`
	QuotaPoolName  string           `json:"quotaPoolName" v:"required"`
	CronCycle      *string          `json:"cronCycle"`
	RegularQuota   *decimal.Decimal `json:"regularQuota"`
	Personal       *bool            `json:"personal"`
	Disabled       *bool            `json:"disabled"`
	ExtraQuota     *decimal.Decimal `json:"extraQuota"`
	UserinfosRules *gjson.Json      `json:"userinfosRules"`
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

type EnsurePersonalQuotaPoolReq struct {
	g.Meta `path:"/ensure" tags:"QuotaPool" method:"post" summary:"确保个人配额池存在"`
	Upn    string `json:"upn" v:"required" example:"122020255@link.cuhk.edu.cn"`
}
type EnsurePersonalQuotaPoolRes struct {
	OK    bool `json:"ok" v:"required" dc:"是否成功"`
	IsNew bool `json:"isNew" v:"required" dc:"是否新建"`
}

type RefreshUsersOfQuotaPoolReq struct {
	g.Meta     `path:"/refreshUsers" tags:"QuotaPool" method:"post" summary:"刷新配额池的用户" dc:"给定配额池名称列表，根据配额池配置中的 UserInfos Rules，在 Casbin 中刷新组权限继承关系。'不传参数'则刷新所有配额池。如果传空数组，则没有任何操作！"`
	QPNameList *[]string `json:"qpNameList" example:"['itso-deep-research-vip', 'itso-deep-research-vip-2']"`
}
type RefreshUsersOfQuotaPoolRes struct {
	OK bool `json:"ok" v:"required" dc:"是否成功"`
}
