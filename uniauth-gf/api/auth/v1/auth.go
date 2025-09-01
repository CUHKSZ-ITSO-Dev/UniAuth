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