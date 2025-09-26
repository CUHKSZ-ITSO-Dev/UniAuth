package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

type GetI18nConfigReq struct {
    g.Meta `path:"/public/i18n/lang" tags:"Config/I18n" method:"get" summary:"获取i18n语言包" dc:"获取指定语言的所有翻译配置"`
    Lang   string `json:"lang" v:"required|in:zh-CN,en-US" dc:"语言代码" example:"zh-CN"`
}

type GetI18nConfigRes struct {
	g.Meta   `mime:"application/json" dc:"返回指定语言的所有翻译配置"`
	Langpack *gjson.Json `json:"langpack" dc:"语言包键值对，支持嵌套结构"`
}

type AddI18nItemReq struct {
    g.Meta      `path:"/admin/i18n" tags:"Config/I18n" method:"post" summary:"添加i18n项目" dc:"添加一项i18n配置，包含多个语言的翻译"`
    Key         string `json:"key" v:"required" dc:"翻译键" example:"navBar.title"`
    ZhCn        string `json:"zh_cn" dc:"中文翻译" example:"统一鉴权"`
    EnUs        string `json:"en_us" dc:"英文翻译" example:"Unified Auth"`
    Description string `json:"description" dc:"描述" example:"导航栏标题"`
}

type AddI18nItemRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type EditI18nItemReq struct {
    g.Meta      `path:"/admin/i18n" tags:"Config/I18n" method:"put" summary:"编辑i18n项目" dc:"编辑一项i18n配置的翻译"`
    Key         string `json:"key" v:"required" dc:"翻译键" example:"navBar.title"`
    ZhCn        string `json:"zh_cn" dc:"中文翻译" example:"统一鉴权"`
    EnUs        string `json:"en_us" dc:"英文翻译" example:"Unified Auth"`
    Description string `json:"description" dc:"描述" example:"导航栏标题"`
}

type EditI18nItemRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type DeleteI18ConfigReq struct {
    g.Meta `path:"/admin/i18n" tags:"Config/I18n" method:"delete" summary:"删除i18n配置" dc:"删除指定Key的i18n配置项"`
    Key    string `json:"key" v:"required" dc:"翻译键" example:"navBar.title"`
}

type DeleteI18ConfigRes struct {
	OK bool `json:"ok" dc:"是否成功"`
}

type GetAllLangsReq struct {
    g.Meta `path:"/public/i18n/langs" tags:"Config/I18n" method:"get" summary:"获取所有支持的语言列表" dc:"获取系统支持的所有语言代码"`
}

type GetAllLangsRes struct {
	Langs []string `json:"langs" dc:"语言代码列表" example:"[\"zh-cn\", \"en-us\"]"`
}

// ==================== I18n Filter ====================
// I18nSortCondition 表示排序条件
type I18nSortCondition struct {
	Field string `json:"field" v:"required|length:1,50" dc:"排序字段"`
	Order string `json:"order" v:"in:asc,desc" dc:"排序方向: asc(升序), desc(降序)"`
}

// I18nPaginationReq 分页请求参数
type I18nPaginationReq struct {
	Page     int `json:"page" v:"min:1" dc:"页码，从1开始" default:"1"`
	PageSize int `json:"pageSize" v:"min:1|max:1000" dc:"每页条数，最大1000" default:"10"`
}

// I18nItem 表示单个i18n配置项
type I18nItem struct {
	Key         string `json:"key" dc:"翻译键" example:"navBar.title"`
	ZhCn        string `json:"zh_cn" dc:"中文翻译" example:"统一鉴权"`
	EnUs        string `json:"en_us" dc:"英文翻译" example:"Unified Auth"`
	Description string `json:"description" dc:"描述" example:"导航栏标题"`
	CreatedAt   string `json:"created_at" dc:"创建时间"`
	UpdatedAt   string `json:"updated_at" dc:"更新时间"`
}

type FilterI18nReq struct {
    g.Meta     `path:"/admin/i18n/filter" tags:"Config/I18n" method:"post" summary:"筛选i18n配置" dc:"根据关键词筛选i18n配置，支持排序和分页"`
    Keyword    string               `json:"keyword" dc:"搜索关键词，对key、zh_cn、en_us、description字段进行模糊匹配"`
    Sort       []*I18nSortCondition `json:"sort" dc:"排序条件，支持多字段排序"`
    Pagination *I18nPaginationReq   `json:"pagination" dc:"分页参数，支持分页或查询全部"`
    Verbose    bool                 `json:"verbose" dc:"是否返回详细i18n信息，false时仅返回键列表"`
}

type FilterI18nRes struct {
	I18nKeys   []string   `json:"i18n_keys" dc:"i18n键列表" example:"[\"navBar.title\", \"sidebar.title\"]"`
	I18nItems  []I18nItem `json:"i18n_items,omitempty" dc:"详细i18n信息（verbose=true时返回）"`
	Total      int        `json:"total" dc:"总记录数"`
	Page       int        `json:"page" dc:"当前页码"`
	PageSize   int        `json:"page_size" dc:"每页条数"`
	TotalPages int        `json:"total_pages" dc:"总页数"`
}
