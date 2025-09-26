package v1

import (
	"uniauth-gf/internal/model/entity"

	"github.com/gogf/gf/v2/frame/g"
)

// ==================== GetOne ====================
type GetOneReq struct {
    g.Meta `path:"/internal/get" tags:"UserInfo" method:"get" summary:"查询用户信息" dc:"根据UPN，返回用户的所有信息。"`
    Upn    string `json:"upn" v:"required" dc:"UPN" example:"sadt@cuhk.edu.cn"`
}
type GetOneRes struct {
	*entity.UserinfosUserInfos
}

// ==================== AdminGet (alias of GetOne) ====================
type AdminGetReq struct {
    g.Meta `path:"/admin/get" tags:"UserInfo" method:"get" summary:"查询用户信息（对外别名）" dc:"与 /internal/get 行为一致。"`
    Upn    string `json:"upn" v:"required" dc:"UPN" example:"sadt@cuhk.edu.cn"`
}

// ==================== Filter ====================
// FilterCondition 表示单个过滤条件
type FilterCondition struct {
	Field string `json:"field" v:"required|length:1,50" dc:"字段名"`
	Op    string `json:"op" v:"required|in:eq,neq,gt,gte,lt,lte,like,ilike,in,notin,contains,notcontains,startswith,endswith,isnull,isnotnull" dc:"操作符: eq(等于), neq(不等于), gt(大于), gte(大于等于), lt(小于), lte(小于等于), like(模糊匹配), ilike(不区分大小写模糊匹配), in(包含), notin(不包含), contains(包含子串), notcontains(不包含子串), startswith(以...开头), endswith(以...结尾), isnull(为空), isnotnull(不为空)"`
	Value *g.Var `json:"value" dc:"条件值，根据操作符类型可以是字符串、数字、数组等"`
}

// FilterGroup 表示一组过滤条件，支持嵌套
type FilterGroup struct {
	Logic      string             `json:"logic" v:"in:and,or" dc:"逻辑关系: and(且), or(或)"`
	Conditions []*FilterCondition `json:"conditions" dc:"过滤条件列表"`
	Groups     []*FilterGroup     `json:"groups" dc:"嵌套的条件组，支持复杂逻辑"`
}

// SortCondition 表示排序条件
type SortCondition struct {
	Field string `json:"field" v:"required|length:1,50" dc:"排序字段"`
	Order string `json:"order" v:"in:asc,desc" dc:"排序方向: asc(升序), desc(降序)"`
}

// PaginationReq 分页请求参数
type PaginationReq struct {
	Page     int  `json:"page" v:"min:1" dc:"页码，从1开始" default:"1"`
	PageSize int  `json:"pageSize" v:"min:1|max:1000" dc:"每页条数，最大1000" default:"20"`
	All      bool `json:"all" dc:"是否返回全部数据，true时忽略分页参数，但仍有最大限制保护"`
}

type FilterReq struct {
    g.Meta     `path:"/admin/filter" tags:"UserInfo" method:"post" summary:"自定义筛选用户信息" dc:"根据过滤条件，返回用户的所有信息。支持复杂条件查询、排序和分页。"`
    Filter     *FilterGroup     `json:"filter" v:"required#需要filter" dc:"过滤条件，支持复杂的逻辑组合查询"`
    Sort       []*SortCondition `json:"sort" dc:"排序条件，支持多字段排序"`
    Pagination *PaginationReq   `json:"pagination" dc:"分页参数，支持分页或查询全部"`
    Verbose    bool             `json:"verbose" dc:"是否返回详细用户信息，false时仅返回UPN列表"`
}

type FilterRes struct {
	UserUpns   []string    `json:"userUpns" dc:"用户UPN列表" example:"['122020255@link.cuhk.edu.cn']"`
	UserInfos  []GetOneRes `json:"userInfos,omitempty" dc:"详细用户信息（verbose=true时返回）"`
	Total      int         `json:"total" dc:"总记录数"`
	Page       int         `json:"page" dc:"当前页码"`
	PageSize   int         `json:"pageSize" dc:"每页条数"`
	TotalPages int         `json:"totalPages" dc:"总页数"`
	IsAll      bool        `json:"isAll" dc:"是否为全部数据查询"`
}
