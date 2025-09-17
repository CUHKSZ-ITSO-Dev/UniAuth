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
	g.Meta    `path:"/admin/policies/edit" tags:"Auth/Admin/CRUD" method:"post" summary:"编辑 Policy" dc:"编辑 Policy。需要提供老的 Policy。<br>注意顺序是 Sub Dom Obj Act。"`
	OldPolicy []string `json:"oldPolicy" v:"required" dc:"旧的 Policy" example:"['alice','chat_production','platform','entry']"`
	NewPolicy []string `json:"newPolicy" v:"required" dc:"新的 Policy" example:"[\"alice\",\"chat_production\",\"platform\",\"entry/no\"]"`
}
type EditPolicyRes struct {
}

type DeletePoliciesReq struct {
	g.Meta   `path:"/admin/policies/delete" tags:"Auth/Admin/CRUD" method:"post" summary:"删除 Policies" dc:"删除 Policies。原子性操作，当规则中有一条和数据库中的规则不匹配，立即回滚所有操作并返回错误。"`
	Policies [][]string `json:"polices" v:"required" dc:"Polices" examples:"[['sub1', 'dom1', 'obj1', 'act1'], ['sub2', 'dom2', 'obj2', 'act2']]"`
}
type DeletePoliciesRes struct {
}

type FilterPoliciesReq struct {
	g.Meta `path:"/admin/policies/filter" tags:"Auth/Admin/Query" method:"post" summary:"筛选 Policies" dc:"根据给定的条件，返回Policy。留空的字段（传空 Array）将被忽略。"`
	Subs   []string `json:"subs" dc:"Subjects 列表"`
	Objs   []string `json:"objs" dc:"Objects 列表"`
	Acts   []string `json:"acts" dc:"Actions 列表"`
}
type FilterPoliciesRes struct {
	g.Meta   `mime:"application/json"`
	Policies [][]string `json:"policies"`
}

type FilterGroupingsReq struct {
	g.Meta `path:"/admin/groupings/filter" tags:"Auth/Admin/Query" method:"post" summary:"筛选 Grouping Polices" dc:"根据给定的条件，返回 Grouping Polices 角色继承关系。留空的字段（传空 Array）将被忽略。"`
	Upns   []string `json:"users" dc:"Upn 列表" example:"['122020255@link.cuhk.edu.cn', 'sadt@cuhk.edu.cn']"`
	Roles  []string `json:"roles" dc:"Roles 列表" example:"['student', 'staff']"`
}
type FilterGroupingsRes struct {
	g.Meta    `mime:"application/json"`
	Groupings [][]string `json:"groups"`
}
