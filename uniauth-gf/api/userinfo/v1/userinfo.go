package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type queryUserInfoReq struct {
	g.Meta `path:"/userinfo/{upn}" tags:"UserInfo" method:"get" summary:"根据upn，返回用户的所有信息。"`
	upn string `v:"required" dc:"UPN"`
}

type queryUserInfoRes struct {
	upn string `json:"upn"`
	message string `json:"message"`
}
