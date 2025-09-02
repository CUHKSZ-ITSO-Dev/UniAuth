package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type CheckReq struct {
	g.Meta `path:"/check" tags:"Auth" method:"post" summary:"基础权限检查" dc:"给定sub obj act dom，查询是否有权限。"`
	Sub    string `json:"sub" v:"required" dc:"对象"`
	Dom    string `json:"dom" v:"required" dc:"域"`
	Obj    string `json:"obj" v:"required" dc:"资源"`
	Act    string `json:"act" v:"required" dc:"动作"`
}

type CheckRes struct {
	Allow bool `json:"allow"`
}

type CheckAndExplainReq struct {
	g.Meta `path:"/checkEx" tags:"Auth" method:"post" summary:"解释权限来源" dc:"给定sub obj act dom，如果允许，返回使其允许的规则。"`
	Sub    string `json:"sub" v:"required" dc:"对象"`
	Dom    string `json:"dom" v:"required" dc:"域"`
	Obj    string `json:"obj" v:"required" dc:"资源"`
	Act    string `json:"act" v:"required" dc:"动作"`
}
type CheckAndExplainRes struct {
	Allow  bool     `json:"allow"`
	Reason []string `json:"reason" dc:"返回 [4]string, 按顺序依次是 sub, dom, obj, act。" example:"[\"alice\",\"chat_production\",\"platform\",\"entry\"]"`
}

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
