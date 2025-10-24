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

// VerifyJwtReq JWT验证请求（用于Nginx Ingress鉴权）
type VerifyJwtReq struct {
	g.Meta `path:"/verify" method:"get" summary:"验证JWT并设置响应头" tags:"Auth"`
}
type VerifyJwtRes struct {
	// 响应头会通过 r.Response.Header() 设置
	// X-External-Request: {jti}
}

type LogoutReq struct {
	g.Meta `path:"/logout" method:"get" summary:"退出登录" tags:"Auth"`
}
type LogoutRes struct {
}

type RefreshReq struct {
	g.Meta `path:"/refresh" method:"get" summary:"刷新Token" tags:"Auth"`
}
type RefreshRes struct {
}
