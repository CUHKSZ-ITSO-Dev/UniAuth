package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type CheckReq struct {
	g.Meta `path:"/check" tags:"Auth" method:"post" summary:"基础权限检查" dc:"给定sub obj act，查询是否有权限。"`
	Sub    string `json:"sub" v:"required" dc:"对象" example:"sadt@cuhk.edu.cn"`
	Obj    string `json:"obj" v:"required" dc:"资源" example:"platform"`
	Act    string `json:"act" v:"required" dc:"动作" example:"entry"`
}

type CheckRes struct {
	Allow bool `json:"allow"`
}

type CheckAndExplainReq struct {
	g.Meta `path:"/checkEx" tags:"Auth" method:"post" summary:"解释权限来源" dc:"给定sub obj act，如果允许，返回使其允许的规则。"`
	Sub    string `json:"sub" v:"required" dc:"对象" example:"sadt@cuhk.edu.cn"`
	Obj    string `json:"obj" v:"required" dc:"资源" example:"platform"`
	Act    string `json:"act" v:"required" dc:"动作" example:"entry"`
}
type CheckAndExplainRes struct {
	Allow  bool     `json:"allow"`
	Reason []string `json:"reason" dc:"注意只有 allow = true 的时候才会返回 [3]string, 按顺序依次是 sub, obj, act。" example:"[\"alice\",\"platform\",\"entry\"]"`
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

type GetAllRolesReq struct {
	g.Meta `path:"/admin/roles/all" tags:"Auth/Admin/Query" method:"get" summary:"获取所有 Roles"`
}
type GetAllRolesRes struct {
	Roles []string `json:"roles" dc:"Roles"`
}

type GetAllQuotaPoolsReq struct {
	g.Meta `path:"/quotaPools/all" tags:"Auth" method:"get" summary:"获取所属配额池" dc:"动态获取用户属于哪些配额池。"`
	Upn    string `json:"upn" v:"required" dc:"Upn" example:"sadt@cuhk.edu.cn"`
}
type GetAllQuotaPoolsRes struct {
	QuotaPools  []string     `json:"quotaPools" dc:"QuotaPools 列表。"`
	PersonalMap g.MapStrBool `json:"personalMap" dc:"PersonalMap。键为配额池名称，值为true时代表是自动配额池。"`
}

type GetAllUsersForQuotaPoolReq struct {
	g.Meta    `path:"/quotaPools/users" tags:"Auth" method:"get" summary:"获取所属配额池的用户" dc:"动态获取指定配额池的用户。"`
	QuotaPool string `json:"quotaPool" v:"required" dc:"QuotaPool" example:"student_pool"`
}
type GetAllUsersForQuotaPoolRes struct {
	g.Meta `resEg:"resource/interface/auth/get_all_users_for_quota_pool_res.json"`
	Users  []string `json:"users" dc:"Users 列表"`
}
