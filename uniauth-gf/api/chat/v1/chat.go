package v1

import (
	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
)

type ChatReq struct {
	g.Meta `path:"/chat" tags:"Chat" method:"post" summary:"AI对话接口"`
	Messages *gjson.Json `json:"messages" v:"required"`
}
type ChatRes struct {
}
