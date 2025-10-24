// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package chat

import (
	"context"

	v1 "uniauth-gf/api/chat/v1"
)

type IChatV1 interface {
	ChatWithMCPStream(ctx context.Context, req *v1.ChatWithMCPStreamReq) (res *v1.ChatWithMCPStreamRes, err error)
}
