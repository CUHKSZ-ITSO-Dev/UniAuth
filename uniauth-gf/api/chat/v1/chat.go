package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// Message 对话消息结构
type Message struct {
	Role    string `json:"role"`    // system, user, assistant
	Content string `json:"content"` // 消息内容
}

// ChatReq 普通对话请求
type ChatReq struct {
	g.Meta   `path:"/" tags:"Chat" method:"post" summary:"AI对话接口"`
	Messages []Message `json:"messages" v:"required" dc:"对话消息列表"`
	Model    string    `json:"model" dc:"模型名称，不填使用默认模型"`
}

// ChatRes 普通对话响应
type ChatRes struct {
	Content string `json:"content" dc:"AI回复内容"`
	Model   string `json:"model" dc:"使用的模型"`
	Usage   struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage" dc:"Token使用情况"`
}

// ChatStreamReq 流式对话请求
type ChatStreamReq struct {
	g.Meta   `path:"/stream" tags:"Chat" method:"post" summary:"AI流式对话接口"`
	Messages []Message `json:"messages" v:"required" dc:"对话消息列表"`
	Model    string    `json:"model" dc:"模型名称，不填使用默认模型"`
}

// ChatStreamRes 流式对话响应（SSE格式）
type ChatStreamRes struct {
}

// ChatWithMCPReq 带MCP工具的对话请求
type ChatWithMCPReq struct {
	g.Meta   `path:"/mcp" tags:"Chat" method:"post" summary:"AI对话接口（支持MCP工具）"`
	Messages []Message `json:"messages" v:"required" dc:"对话消息列表"`
	Model    string    `json:"model" dc:"模型名称，不填使用默认模型"`
}

// ChatWithMCPRes 带MCP工具的对话响应
type ChatWithMCPRes struct {
	Content   string   `json:"content" dc:"AI回复内容"`
	Model     string   `json:"model" dc:"使用的模型"`
	ToolCalls []string `json:"tool_calls,omitempty" dc:"调用的工具列表"`
	Usage     struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage" dc:"Token使用情况"`
}

// ChatWithMCPStreamReq 带MCP工具的流式对话请求
type ChatWithMCPStreamReq struct {
	g.Meta   `path:"/mcp/stream" tags:"Chat" method:"post" summary:"AI流式对话接口（支持MCP工具）"`
	Messages []Message `json:"messages" v:"required" dc:"对话消息列表"`
	Model    string    `json:"model" dc:"模型名称，不填使用默认模型"`
}

// ChatWithMCPStreamRes 带MCP工具的流式对话响应
type ChatWithMCPStreamRes struct {
}
