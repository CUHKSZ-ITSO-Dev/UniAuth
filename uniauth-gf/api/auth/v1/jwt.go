package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type CallbackReq struct {
	g.Meta `path:"/callback" tags:"Auth/JWT" method:"Get" summary:"SSO回调"`
	Code   string `json:"token" v:"required" dc:"Token" example:"abcdefg"`
}
type CallbackRes struct {
}
