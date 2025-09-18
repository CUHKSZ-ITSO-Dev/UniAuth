package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

type GetI18nConfigReq struct {
	g.Meta `path:"/i18n/:lang" tags:"Config/I18n" method:"get" summary:"获取i18n" dc:"获取一个语言的所有翻译配置"`
	Lang   string `json:"lang" v:"required" dc:"语言" example:"en-US"`
}

type GetI18nConfigRes struct {
	g.Meta `mime:"application/json" dc:"返回某个指定语言的所有翻译配置"`
	Config *gjson.Json
}

type AddI18nItemReq struct {
	g.Meta      `path:"/i18n" tags:"Config/I18n" method:"post" summary:"添加i18n" dc:"添加一项i18n一个语言的配置"`
	Lang        string `json:"lang" v:"required" dc:"语言" example:"en-US"`
	Key         string `json:"key" v:"required" dc:"键" example:"navBar.title"`
	Value       string `json:"value" v:"required" dc:"值" example:"统一鉴权"`
	Description string `json:"description" dc:"描述" example:"导航栏标题"`
}

type AddI18nItemRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type EditI18nItemReq struct {
	g.Meta      `path:"/i18n" tags:"Config/I18n" method:"put" summary:"编辑i18n" dc:"编辑一项i18n一个语言的配置"`
	Lang        string `json:"lang" v:"required" dc:"语言" example:"en-US"`
	Key         string `json:"key" v:"required" dc:"键" example:"navBar.title"`
	Value       string `json:"value" v:"required" dc:"值" example:"统一鉴权"`
	Description string `json:"description" dc:"描述" example:"导航栏标题"`
}

type EditI18nItemRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteI18ConfigReq struct {
	g.Meta `path:"/i18n" tags:"Config/I18n" method:"delete" summary:"删除i18n" dc:"删除指定Key的所有语言配置。"`
	Key    string `json:"key" v:"required" dc:"键" example:"navBar.title"`
}

type DeleteI18ConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type GetAllLangsReq struct {
	g.Meta `path:"/i18n" tags:"Config/I18n" method:"get" summary:"获取所有语言的列表"`
}

type GetAllLangsRes struct {
	Langs []string `json:"langs" dc:"语言列表" example:"['en-US', 'zh-CN']"`
}

// ==================== I18n Filter ====================
// I18nFilterCondition 表示单个过滤条件
type I18nFilterCondition struct {
	Field string `json:"field" v:"required|length:1,50" dc:"字段名"`
	Op    string `json:"op" v:"required|in:eq,neq,gt,gte,lt,lte,like,ilike,in,notin,contains,notcontains,startswith,endswith,isnull,isnotnull" dc:"操作符: eq(等于), neq(不等于), gt(大于), gte(大于等于), lt(小于), lte(小于等于), like(模糊匹配), ilike(不区分大小写模糊匹配), in(包含), notin(不包含), contains(包含子串), notcontains(不包含子串), startswith(以...开头), endswith(以...结尾), isnull(为空), isnotnull(不为空)"`
	Value *g.Var `json:"value" dc:"条件值，根据操作符类型可以是字符串、数字、数组等"`
}

// I18nFilterGroup 表示一组过滤条件，支持嵌套
type I18nFilterGroup struct {
	Logic      string                 `json:"logic" v:"in:and,or" dc:"逻辑关系: and(且), or(或)"`
	Conditions []*I18nFilterCondition `json:"conditions" dc:"过滤条件列表"`
	Groups     []*I18nFilterGroup     `json:"groups" dc:"嵌套的条件组，支持复杂逻辑"`
}

// I18nSortCondition 表示排序条件
type I18nSortCondition struct {
	Field string `json:"field" v:"required|length:1,50" dc:"排序字段"`
	Order string `json:"order" v:"in:asc,desc" dc:"排序方向: asc(升序), desc(降序)"`
}

// I18nPaginationReq 分页请求参数
type I18nPaginationReq struct {
	Page     int  `json:"page" v:"min:1" dc:"页码，从1开始" default:"1"`
	PageSize int  `json:"pageSize" v:"min:1|max:1000" dc:"每页条数，最大1000" default:"20"`
	All      bool `json:"all" dc:"是否返回全部数据，true时忽略分页参数，但仍有最大限制保护"`
}

// I18nItem 表示单个i18n条目
type I18nItem struct {
	LangCode    string `json:"langCode" dc:"语言代码" example:"en-US"`
	Key         string `json:"key" dc:"键" example:"navBar.title"`
	Value       string `json:"value" dc:"值" example:"统一鉴权"`
	Description string `json:"description" dc:"描述"`
	CreatedAt   string `json:"createdAt" dc:"创建时间"`
	UpdatedAt   string `json:"updatedAt" dc:"更新时间"`
}

type FilterI18nReq struct {
	g.Meta     `path:"/i18n/filter" tags:"Config/I18n" method:"post" summary:"自定义筛选i18n配置" dc:"根据过滤条件，返回i18n配置。支持复杂条件查询、排序和分页。"`
	Filter     *I18nFilterGroup     `json:"filter" v:"required#需要filter" dc:"过滤条件，支持复杂的逻辑组合查询"`
	Sort       []*I18nSortCondition `json:"sort" dc:"排序条件，支持多字段排序"`
	Pagination *I18nPaginationReq   `json:"pagination" dc:"分页参数，支持分页或查询全部"`
	Verbose    bool                 `json:"verbose" dc:"是否返回详细i18n信息，false时仅返回键值对"`
}

type FilterI18nRes struct {
	I18nKeys   []string   `json:"i18nKeys" dc:"i18n键列表" example:"['navBar.title', 'sidebar.title']"`
	I18nItems  []I18nItem `json:"i18nItems,omitempty" dc:"详细i18n信息（verbose=true时返回）"`
	Total      int        `json:"total" dc:"总记录数"`
	Page       int        `json:"page" dc:"当前页码"`
	PageSize   int        `json:"pageSize" dc:"每页条数"`
	TotalPages int        `json:"totalPages" dc:"总页数"`
	IsAll      bool       `json:"isAll" dc:"是否为全部数据查询"`
}
