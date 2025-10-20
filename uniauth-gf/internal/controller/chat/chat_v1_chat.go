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

	// 获取Request和Response对象
	request := g.RequestFromCtx(ctx)
	response := request.Response

	// 设置响应头
	response.Header().Set("Content-Type", "text/event-stream")
	response.Header().Set("Cache-Control", "no-cache")
	response.Header().Set("Connection", "keep-alive")
	response.Header().Set("X-Accel-Buffering", "no")

	// 立即发送一个空的SSE注释行以建立连接
	response.Writeln(": connected")
	response.Flush()

	// 调用服务层处理流式对话
	err = chatService.ChatStream(ctx, req, response)
	if err != nil {
		g.Log().Errorf(ctx, "ChatStream error: %v", err)
		// 流式响应出错时，发送错误事件
		response.Writefln("data: {\"error\":\"%s\"}\n", err.Error())
		response.Flush()
	}

	// 不返回错误，因为响应已经发送了
	return &v1.ChatStreamRes{}, nil
}
