package chat

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "uniauth-gf/api/chat/v1"
	"uniauth-gf/internal/service/chat"
)

// ChatWithMCPStream 带MCP工具支持的流式对话接口（唯一推荐使用的接口）
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

	// 直接传递请求（类型已经匹配）
	err = agent.ChatStream(ctx, req, response)
	if err != nil {
		g.Log().Errorf(ctx, "MCP Agent stream error: %v", err)
		// 发送错误事件
		response.Writefln("data: {\"error\":\"%s\"}\n", err.Error())
		response.Flush()
	}

	return &v1.ChatWithMCPStreamRes{}, nil
}
