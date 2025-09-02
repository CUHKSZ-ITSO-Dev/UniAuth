package v1

import "github.com/gogf/gf/v2/frame/g"

type AddGroupingPoliciesReq struct {
}
type AddGroupingPoliciesRes struct {
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
