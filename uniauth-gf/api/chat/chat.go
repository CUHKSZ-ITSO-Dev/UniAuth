// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package chat

import (
	"context"

	v1 "uniauth-gf/api/chat/v1"
)

type IChatV1 interface {
	Chat(ctx context.Context, req *v1.ChatReq) (res *v1.ChatRes, err error)
	ChatStream(ctx context.Context, req *v1.ChatStreamReq) (res *v1.ChatStreamRes, err error)
	ChatWithMCP(ctx context.Context, req *v1.ChatWithMCPReq) (res *v1.ChatWithMCPRes, err error)
	ChatWithMCPStream(ctx context.Context, req *v1.ChatWithMCPStreamReq) (res *v1.ChatWithMCPStreamRes, err error)
}
