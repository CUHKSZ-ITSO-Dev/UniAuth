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

// ChatWithMCP 带MCP工具支持的对话接口
func (c *ControllerV1) ChatWithMCP(ctx context.Context, req *v1.ChatWithMCPReq) (res *v1.ChatWithMCPRes, err error) {
	// 获取ChatService
	chatService, err := chat.GetChatService(ctx)
	if err != nil {
		return nil, err
	}

	// 创建MCP Agent（进程内直接调用，无需HTTP）
	agent, err := chat.NewMCPAgent(ctx, chatService)
	if err != nil {
		return nil, gerror.Wrap(err, "创建MCP Agent失败")
	}

	// 转换请求
	chatReq := &v1.ChatReq{
		Messages: req.Messages,
		Model:    req.Model,
	}

	// 调用Agent处理
	chatRes, err := agent.Chat(ctx, chatReq)
	if err != nil {
		g.Log().Errorf(ctx, "MCP Agent error: %v", err)
		return nil, gerror.Wrap(err, "MCP对话请求失败")
	}

	// 转换响应
	res = &v1.ChatWithMCPRes{
		Content: chatRes.Content,
		Model:   chatRes.Model,
		Usage:   chatRes.Usage,
	}

	return res, nil
}

// ChatWithMCPStream 带MCP工具支持的流式对话接口
func (c *ControllerV1) ChatWithMCPStream(ctx context.Context, req *v1.ChatWithMCPStreamReq) (res *v1.ChatWithMCPStreamRes, err error) {
	// 获取ChatService
	chatService, err := chat.GetChatService(ctx)
	if err != nil {
		return nil, err
	}

	// 创建MCP Agent（进程内直接调用）
	agent, err := chat.NewMCPAgent(ctx, chatService)
	if err != nil {
		return nil, gerror.Wrap(err, "创建MCP Agent失败")
	}

	// 获取Response对象
	request := g.RequestFromCtx(ctx)
	response := request.Response

	// 设置响应头
	response.Header().Set("Content-Type", "text/event-stream")
	response.Header().Set("Cache-Control", "no-cache")
	response.Header().Set("Connection", "keep-alive")
	response.Header().Set("X-Accel-Buffering", "no")

	// 立即发送连接确认
	response.Writeln(": connected")
	response.Flush()

	// 转换请求
	streamReq := &v1.ChatStreamReq{
		Messages: req.Messages,
		Model:    req.Model,
	}

	// 调用Agent处理流式对话
	err = agent.ChatStream(ctx, streamReq, response)
	if err != nil {
		g.Log().Errorf(ctx, "MCP Agent stream error: %v", err)
		// 发送错误事件
		response.Writefln("data: {\"error\":\"%s\"}\n", err.Error())
		response.Flush()
	}

	return &v1.ChatWithMCPStreamRes{}, nil
}
