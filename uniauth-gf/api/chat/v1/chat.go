package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// Message 对话消息结构
type Message struct {
	Role    string `json:"role"`    // system, user, assistant
	Content string `json:"content"` // 消息内容
}

// PendingToolCall 待执行的工具调用（用户确认后直接执行，不重新让AI决策）
type PendingToolCall struct {
	ToolID    string `json:"tool_id" dc:"工具调用ID"`
	ToolName  string `json:"tool_name" dc:"工具名称"`
	Arguments string `json:"arguments" dc:"工具参数（JSON字符串）"`
}

// ChatWithMCPStreamReq 带MCP工具的流式对话请求
type ChatWithMCPStreamReq struct {
	g.Meta          `path:"/mcp/stream" tags:"Chat" method:"post" summary:"AI流式对话接口（支持MCP工具）"`
	Messages        []Message        `json:"messages" v:"required" dc:"对话消息列表"`
	Model           string           `json:"model" dc:"模型名称，不填使用默认模型"`
	AllowedTools    []string         `json:"allowed_tools" dc:"用户已确认允许执行的工具列表"`
	PendingToolCall *PendingToolCall `json:"pending_tool_call" dc:"待执行的工具调用（用户确认后直接执行）"`
}

// ChatWithMCPStreamRes 带MCP工具的流式对话响应
type ChatWithMCPStreamRes struct {
}
