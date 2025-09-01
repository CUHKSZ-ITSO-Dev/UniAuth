package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type AddPolicyReq struct {
	g.Meta `path:"/admin/policies/add" tags:"Auth/Admin/CRUD" method:"post" summary:"添加 Policy" dc:"添加 Policy。"`
	Sub    string `json:"sub" v:"required" dc:"Subject"`
	Dom    string `json:"dom" v:"required" dc:"Domain"`
	Obj    string `json:"obj" v:"required" dc:"Object"`
	Act    string `json:"act" v:"required" dc:"Action"`
}
type AddPolicyRes struct {
}

type EditPolicyReq struct {
	g.Meta    `path:"/admin/policies/edit" tags:"Auth/Admin/CRUD" method:"post" summary:"编辑 Policy" dc:"编辑 Policy。需要提供老的 Policy。<br>注意顺序是 Sub Dom Obj Act。"`
	OldPolicy []string `json:"oldPolicy" v:"required" dc:"旧的 Policy" example:"[\"alice\",\"chat_production\",\"platform\",\"entry\"]"`
	NewPolicy []string `json:"newPolicy" v:"required" dc:"新的 Policy" example:"[\"alice\",\"chat_production\",\"platform\",\"entry/no\"]"`
}
type EditPolicyRes struct {
}

type DeletePolicyReq struct {
	g.Meta    `path:"/admin/policies/delete" tags:"Auth/Admin/CRUD" method:"post" summary:"删除 Policy" dc:"删除 Policy。"`
	Sub    string `json:"sub" v:"required" dc:"Subject"`
	Dom    string `json:"dom" v:"required" dc:"Domain"`
	Obj    string `json:"obj" v:"required" dc:"Object"`
	Act    string `json:"act" v:"required" dc:"Action"`
}
type DeletePolicyRes struct {
}
