package v1

import "github.com/gogf/gf/v2/frame/g"

type FilterGroupingsReq struct {
	g.Meta  `path:"/admin/groupings/filter" tags:"Auth/Admin/Query" method:"post" summary:"筛选 Grouping Polices" dc:"根据给定的条件，返回 Grouping Polices 角色继承关系。留空的字段（传空 Array）将被忽略。"`
	Upns   []string `json:"users" dc:"Upn 列表" example:"['122020255@link.cuhk.edu.cn', 'sadt@cuhk.edu.cn']"`
	Roles   []string `json:"roles" dc:"Roles 列表" example:"['student', 'staff']"`
	Domains []string `json:"domains" dc:"Domains 列表" example:"['production', 'test']"`
}
type FilterGroupingsRes struct {
	g.Meta    `mime:"application/json"`
	Groupings [][]string `json:"groups"`
}
