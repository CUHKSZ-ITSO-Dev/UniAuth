package v1

import "github.com/gogf/gf/v2/frame/g"

type AddPoliciesReq struct {
	g.Meta   `path:"/admin/policies/add" tags:"Auth/Admin/CRUD" method:"post" summary:"添加 Policies"`
	Policies [][]string `json:"policies" v:"required" dc:"Policies" example:"[['sub1', 'obj1', 'act1'], ['sub2', 'obj2', 'act2']]"`
	Skip     bool       `json:"skip" d:"true" dc:"开启时，当规则已经存在时自动跳过，不返回错误；否则会返回错误，并回退所有操作"`
}
type AddPoliciesRes struct {
}

type EditPolicyReq struct {
	g.Meta    `path:"/admin/policies/edit" tags:"Auth/Admin/CRUD" method:"post" summary:"编辑 Policy" dc:"编辑 Policy。需要提供老的 Policy。<br>注意顺序是 Sub Obj Act。"`
	OldPolicy []string `json:"oldPolicy" v:"required" dc:"旧的 Policy" example:"['alice','chat_production','platform','entry']"`
	NewPolicy []string `json:"newPolicy" v:"required" dc:"新的 Policy" example:"[\"alice\",\"chat_production\",\"platform\",\"entry/no\"]"`
}
type EditPolicyRes struct {
}

type DeletePoliciesReq struct {
	g.Meta   `path:"/admin/policies/delete" tags:"Auth/Admin/CRUD" method:"post" summary:"删除 Policies" dc:"删除 Policies。原子性操作，当规则中有一条和数据库中的规则不匹配，立即回滚所有操作并返回错误。"`
	Policies [][]string `json:"policies" v:"required" dc:"Policies" examples:"[['sub1', 'obj1', 'act1'], ['sub2', 'obj2', 'act2']]"`
}
type DeletePoliciesRes struct {
}

type FilterPoliciesReq struct {
	g.Meta   `path:"/admin/policies/filter" tags:"Auth/Admin/Query" method:"post" summary:"筛选 Policies" dc:"模糊匹配。根据给定的条件，返回Policy。留空的字段（传空 Array）将被忽略。"`
	Sub      string `json:"sub" dc:"Subject"`
	Obj      string `json:"obj" dc:"Object"`
	Act      string `json:"act" dc:"Action"`
	Eft      string `json:"eft" dc:"Effect"`
	Rule     string `json:"rule" dc:"Rule"`
	Page     int    `json:"page" d:"1" dc:"分页。当前页码。"`
	PageSize int    `json:"pageSize" d:"10" dc:"分页。每页条数。"`
}
type FilterPoliciesRes struct {
	g.Meta     `mime:"application/json"`
	Policies   [][]string `json:"policies"`
	Total      int        `json:"total" dc:"总条数。"`
	Page       int        `json:"page" dc:"当前页码。"`
	PageSize   int        `json:"pageSize" dc:"每页条数。"`
	TotalPages int        `json:"totalPages" dc:"总页数。"`
}

type AddGroupingReq struct {
	g.Meta `path:"/admin/groupings/add" tags:"Auth/Admin/CRUD" method:"post" summary:"添加 Grouping Policies" dc:"允许批量添加 Grouping Policies。"`
	Groupings [][]string `json:"groupings" v:"required" dc:"Groupings" example:"[['student', 'staff'], ['student', 'staff']]"`
	Skip     bool       `json:"skip" d:"true" dc:"开启时，当规则已经存在时自动跳过，不返回错误；否则会返回错误，并回退所有操作"`
}
type AddGroupingRes struct {
}

type EditGroupingReq struct {
	g.Meta `path:"/admin/groupings/edit" tags:"Auth/Admin/CRUD" method:"post" summary:"编辑 Grouping Policies" dc:"编辑 Grouping Policies。需要提供老的 Grouping。"`
	OldGrouping []string `json:"oldGrouping" v:"required" dc:"旧的 Grouping" example:"['student', 'staff']"`
	NewGrouping []string `json:"newGrouping" v:"required" dc:"新的 Grouping" example:"['student', 'staff']"`
}
type EditGroupingRes struct {
}

type DeleteGroupingReq struct {
	g.Meta `path:"/admin/groupings/delete" tags:"Auth/Admin/CRUD" method:"post" summary:"删除 Grouping Policies" dc:"允许批量删除 Grouping Policies。原子性操作，当规则中有一条和数据库中的规则不匹配，立即回滚所有操作并返回错误。"`
	Groupings [][]string `json:"groupings" v:"required" dc:"Groupings" example:"[['student', 'staff'], ['student', 'staff']]"`
}
type DeleteGroupingRes struct {
}

type FilterGroupingsReq struct {
	g.Meta   `path:"/admin/groupings/filter" tags:"Auth/Admin/Query" method:"post" summary:"筛选 Grouping Policies" dc:"根据给定的条件，返回 Grouping Policies 角色继承关系。留空的字段（传空 Array）将被忽略。"`
	G1       string `json:"g1" dc:"G1 列表"`
	G2       string `json:"g2" dc:"G2 列表"`
	Rule     string `json:"rule" dc:"Rule"`
	Page     int    `json:"page" d:"1" dc:"分页。当前页码。"`
	PageSize int    `json:"pageSize" d:"10" dc:"分页。每页条数。"`
}
type FilterGroupingsRes struct {
	g.Meta     `mime:"application/json"`
	Groupings  [][]string `json:"groups"`
	Total      int        `json:"total" dc:"总条数。"`
	Page       int        `json:"page" dc:"当前页码。"`
	PageSize   int        `json:"pageSize" dc:"每页条数。"`
	TotalPages int        `json:"totalPages" dc:"总页数。"`
}
