package chat

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/chat/v1"
	"uniauth-gf/internal/service/chat"
)

// Chat 普通对话接口
func (c *ControllerV1) Chat(ctx context.Context, req *v1.ChatReq) (res *v1.ChatRes, err error) {
	// 获取ChatService
	chatService, err := chat.GetChatService(ctx)
	if err != nil {
		return nil, err
	}

	// 调用服务层处理对话
	res, err = chatService.Chat(ctx, req)
	if err != nil {
		g.Log().Errorf(ctx, "Chat error: %v", err)
		return nil, gerror.Wrap(err, "对话请求失败")
	}

	return res, nil
}

// ChatStream 流式对话接口
func (c *ControllerV1) ChatStream(ctx context.Context, req *v1.ChatStreamReq) (res *v1.ChatStreamRes, err error) {
	// 获取ChatService
	chatService, err := chat.GetChatService(ctx)
	if err != nil {
		return nil, err
	}

	// 获取Response对象
	response := g.RequestFromCtx(ctx).Response

	// 调用服务层处理流式对话
	err = chatService.ChatStream(ctx, req, response)
	if err != nil {
		g.Log().Errorf(ctx, "ChatStream error: %v", err)
		return nil, gerror.Wrap(err, "流式对话请求失败")
	}

	return &v1.ChatStreamRes{}, nil
}
