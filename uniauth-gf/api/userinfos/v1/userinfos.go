package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// ==================== GetOne ====================
type GetOneReq struct {
	g.Meta `path:"/userinfo/:upn" tags:"UserInfo" method:"get" summary:"根据UPN，返回用户的所有信息。"`
	Upn    string `json:"upn" v:"required" dc:"UPN"`
}

type GetOneRes struct {
	Upn                        string    `json:"upn"`
	DisplayName                string    `json:"displayName"`
	UniqueName                 string    `json:"uniqueName"`
	SamAccountName             string    `json:"samAccountName"`
	Email                      string    `json:"email"`
	SchoolStatus               string    `json:"schoolStatus"`
	IdentityType               string    `json:"identityType"`
	EmployeeId                 string    `json:"employeeId"`
	Name                       string    `json:"name"`
	Department                 string    `json:"department"`
	Title                      string    `json:"title"`
	Office                     string    `json:"office"`
	OfficePhone                string    `json:"officePhone"`
	EmployeeType               string    `json:"employeeType"`
	FundingTypeOrAdmissionYear string    `json:"fundingTypeOrAdmissionYear"`
	StudentCategoryPrimary     string    `json:"studentCategoryPrimary"`
	StudentCategoryDetail      string    `json:"studentCategoryDetail"`
	StudentNationalityType     string    `json:"studentNationalityType"`
	ResidentialCollege         string    `json:"residentialCollege"`
	StaffRole                  string    `json:"staffRole"`
	MailNickname               string    `json:"mailNickname"`
	Tags                       []string  `json:"tags"`
	CreatedAt                  time.Time `json:"createdAt"`
	UpdatedAt                  time.Time `json:"updatedAt"`
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
	g.Meta     `path:"/userinfo/filter" tags:"UserInfo" method:"post" summary:"根据过滤条件，返回用户的所有信息。支持复杂条件查询、排序和分页。"`
	Filter     *FilterGroup     `json:"filter" v:"required#需要filter" dc:"过滤条件，支持复杂的逻辑组合查询"`
	Sort       []*SortCondition `json:"sort" dc:"排序条件，支持多字段排序"`
	Pagination *PaginationReq   `json:"pagination" dc:"分页参数，支持分页或查询全部"`
	Verbose    bool             `json:"verbose" dc:"是否返回详细用户信息，false时仅返回UPN列表"`
}

type FilterRes struct {
	UserUpns   []string    `json:"userUpns" dc:"用户UPN列表"`
	UserInfos  []GetOneRes `json:"userInfos,omitempty" dc:"详细用户信息（verbose=true时返回）"`
	Total      int         `json:"total" dc:"总记录数"`
	Page       int         `json:"page" dc:"当前页码"`
	PageSize   int         `json:"pageSize" dc:"每页条数"`
	TotalPages int         `json:"totalPages" dc:"总页数"`
	IsAll      bool        `json:"isAll" dc:"是否为全部数据查询"`
}
