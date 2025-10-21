package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type LoginReq struct {
	g.Meta `path:"/login" tags:"Auth/JWT" method:"Get" summary:"获取登录页"`
}
type LoginRes struct {
}

type CallbackReq struct {
	g.Meta `path:"/callback" tags:"Auth/JWT" method:"Get" summary:"SSO回调"`
	Code   string `v:"required" dc:"Token" example:"abcdefg"`
	State  string `v:"required" dc:"State" example:"123456"`
}
type CallbackRes struct {
}
