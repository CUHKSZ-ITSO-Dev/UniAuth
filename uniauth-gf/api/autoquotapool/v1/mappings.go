package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// AutoQuotaPoolMapping 用户配额池映射结构
type AutoQuotaPoolMapping struct {
	ID            int64      `json:"id" dc:"映射ID"`
	UserUpn       string     `json:"userUpn" dc:"用户UPN"`
	QuotaPoolName string     `json:"quotaPoolName" dc:"配额池名称"`
	RuleID        int64      `json:"ruleId" dc:"规则ID"`
	RuleName      string     `json:"ruleName" dc:"规则名称"`
	MatchedAt     *time.Time `json:"matchedAt" dc:"匹配时间"`
	CreatedAt     *time.Time `json:"createdAt" dc:"创建时间"`
	// 用户信息（查询时返回）
	DisplayName  string `json:"displayName,omitempty" dc:"用户显示名"`
	Department   string `json:"department,omitempty" dc:"部门"`
	IdentityType string `json:"identityType,omitempty" dc:"身份类型"`
}

// ==================== 映射查询接口 ====================

// GetUserQuotaPoolsReq 根据用户查询配额池
type GetUserQuotaPoolsReq struct {
	g.Meta  `path:"/autoQuotaPool/user/{upn}/quotaPools" tags:"AutoQuotaPoolConfig/Mappings" method:"get" summary:"根据用户查询配额池"`
	UserUpn string `json:"upn" v:"required" dc:"用户UPN"`
}

type GetUserQuotaPoolsRes struct {
	UserUpn    string                 `json:"userUpn" dc:"用户UPN"`
	QuotaPools []AutoQuotaPoolMapping `json:"quotaPools" dc:"配额池列表"`
	Total      int                    `json:"total" dc:"总数量"`
}

// GetQuotaPoolUsersReq 根据配额池查询用户
type GetQuotaPoolUsersReq struct {
	g.Meta        `path:"/autoQuotaPool/quotaPool/{quotaPoolName}/users" tags:"AutoQuotaPoolConfig/Mappings" method:"get" summary:"根据配额池查询用户"`
	QuotaPoolName string `json:"quotaPoolName" v:"required" dc:"配额池名称"`
	Page          int    `json:"page" v:"min:1" dc:"页码" default:"1"`
	PageSize      int    `json:"pageSize" v:"min:1|max:1000" dc:"每页条数" default:"20"`
}

type GetQuotaPoolUsersRes struct {
	QuotaPoolName string                 `json:"quotaPoolName" dc:"配额池名称"`
	Users         []AutoQuotaPoolMapping `json:"users" dc:"用户列表"`
	Total         int                    `json:"total" dc:"总记录数"`
	Page          int                    `json:"page" dc:"当前页码"`
	PageSize      int                    `json:"pageSize" dc:"每页条数"`
	TotalPages    int                    `json:"totalPages" dc:"总页数"`
}

// GetAutoQuotaPoolMappingsReq 获取映射列表
type GetAutoQuotaPoolMappingsReq struct {
	g.Meta        `path:"/autoQuotaPool/mappings" tags:"AutoQuotaPoolConfig/Mappings" method:"get" summary:"获取映射列表"`
	UserUpn       string `json:"userUpn" dc:"用户UPN（可选过滤）"`
	QuotaPoolName string `json:"quotaPoolName" dc:"配额池名称（可选过滤）"`
	RuleID        *int64 `json:"ruleId" dc:"规则ID（可选过滤）"`
	Page          int    `json:"page" v:"min:1" dc:"页码" default:"1"`
	PageSize      int    `json:"pageSize" v:"min:1|max:1000" dc:"每页条数" default:"20"`
}

type GetAutoQuotaPoolMappingsRes struct {
	Mappings   []AutoQuotaPoolMapping `json:"mappings" dc:"映射列表"`
	Total      int                    `json:"total" dc:"总记录数"`
	Page       int                    `json:"page" dc:"当前页码"`
	PageSize   int                    `json:"pageSize" dc:"每页条数"`
	TotalPages int                    `json:"totalPages" dc:"总页数"`
}
