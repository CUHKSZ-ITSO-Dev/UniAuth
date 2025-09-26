package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type UniauthLoginReq struct {
    g.Meta   `path:"/public/uniauth/login" tags:"Auth/UniAuth" method:"post" summary:"UniAuth账号密码校验" dc:"UniAuth账号密码校验"`
    Account  string `json:"account" v:"required" example:"admin"`
    Password string `json:"password" v:"required" example:"123456"`
}
type UniauthLoginRes struct {
	Ok bool `json:"ok"`
}
