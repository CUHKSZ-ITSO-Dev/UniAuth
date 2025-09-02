package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type GetAllSubjectsReq struct {
	g.Meta `path:"/admin/subjects/all" tags:"Auth/Admin/Query" method:"get" summary:"获取所有Subjects"`
}
type GetAllSubjectsRes struct {
	Subjects []string `json:"subjects" dc:"Subjects"`
}

type GetAllObjectsReq struct {
	g.Meta `path:"/admin/objects/all" tags:"Auth/Admin/Query" method:"get" summary:"获取所有Objects"`
}
type GetAllObjectsRes struct {
	Objects []string `json:"objects" dc:"Objects"`
}

type GetAllActionsReq struct {
	g.Meta `path:"/admin/actions/all" tags:"Auth/Admin/Query" method:"get" summary:"获取所有Actions"`
}
type GetAllActionsRes struct {
	Actions []string `json:"actions" dc:"Actions"`
}

type GetAllDomainsReq struct {
	g.Meta `path:"/admin/domains/all" tags:"Auth/Admin/Query" method:"get" summary:"获取所有 Domains"`
}
type GetAllDomainsRes struct {
	Domains []string `json:"domains" dc:"Domains"`
}

type GetAllRolesReq struct {
	g.Meta `path:"/admin/roles/all" tags:"Auth/Admin/Query" method:"get" summary:"获取所有 Roles"`
}
type GetAllRolesRes struct {
	Roles []string `json:"roles" dc:"Roles"`
}

type FilterPoliciesReq struct {
	g.Meta `path:"/admin/policies/filter" tags:"Auth/Admin/Query" method:"post" summary:"筛选 Policies" dc:"根据给定的条件，返回Policy。留空的字段（传空 Array）将被忽略。"`
	Subs   []string `json:"subs" dc:"Subjects 列表"`
	Doms   []string `json:"doms" dc:"Domains 列表"`
	Objs   []string `json:"objs" dc:"Objects 列表"`
	Acts   []string `json:"acts" dc:"Actions 列表"`
}
type FilterPoliciesRes struct {
	g.Meta   `mime:"application/json"`
	Policies [][]string `json:"policies"`
}

type FilterGroupingsReq struct {
	g.Meta  `path:"/admin/groupings/filter" tags:"Auth/Admin/Query" method:"post" summary:"筛选 Grouping Polices" dc:"根据给定的条件，返回 Grouping Polices 角色继承关系。留空的字段（传空 Array）将被忽略。"`
	Users   []string `json:"users" dc:"Users 列表"`
	Roles   []string `json:"roles" dc:"Roles 列表"`
	Domains []string `json:"domains" dc:"Domains 列表"`
}
type FilterGroupingsRes struct {
	g.Meta    `mime:"application/json"`
	Groupings [][]string `json:"groups"`
}
