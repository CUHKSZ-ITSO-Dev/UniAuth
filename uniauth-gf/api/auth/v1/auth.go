package v1

import "github.com/gogf/gf/v2/frame/g"

type CheckReq struct {
	g.Meta `path:"/enforce" tags:"Auth" method:"post" summary:"基础权限检查" dc:"给定sub obj act dom，查询是否有权限。"`
	Sub    string `v:"required" dc:"用户的UPN"`
	Obj    string `v:"required" dc:"资源"`
	Act    string `v:"required" dc:"动作"`
	Dom    string `v:"required" dc:"域"`
}

type CheckRes struct {
	Allow bool `json:"allow"`
}
