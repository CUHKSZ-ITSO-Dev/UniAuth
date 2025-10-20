package chat

import (
	"context"
	"encoding/json"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/openai/openai-go/v3"

	v1 "uniauth-gf/api/chat/v1"
)

// MCPAgent AI Agent with MCP tool support
type MCPAgent struct {
	chatService *ChatService
	mcpAdapter  *MCPAdapter
	maxRounds   int // 最大对话轮次，防止无限循环
}

// NewMCPAgent 创建MCP Agent
func NewMCPAgent(ctx context.Context, chatService *ChatService) (*MCPAgent, error) {
	// 直接使用进程内的MCP服务器，无需HTTP调用
	adapter, err := NewMCPAdapter(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "初始化MCP适配器失败")
	}

	return &MCPAgent{
		chatService: chatService,
		mcpAdapter:  adapter,
		maxRounds:   5, // 最多5轮对话（包括工具调用）
	}, nil
}

// Chat 带MCP工具支持的对话
func (a *MCPAgent) Chat(ctx context.Context, req *v1.ChatReq) (*v1.ChatRes, error) {
	messages := a.convertMessages(req.Messages)
	model := req.Model
	if model == "" {
		model = a.chatService.model
	}

	g.Log().Infof(ctx, "MCP Agent开始处理，可用工具: %v", a.mcpAdapter.GetToolNames())

	// 获取并输出工具定义（调试用）
	tools := a.mcpAdapter.ConvertToOpenAITools()
	g.Log().Infof(ctx, "传递给OpenAI的工具数量: %d", len(tools))

	// 输出所有工具的Schema
	for i, tool := range tools {
		toolJSON, _ := json.MarshalIndent(tool, "", "  ")
		g.Log().Infof(ctx, "工具[%d] 定义:\n%s", i, string(toolJSON))
	}

	// 多轮对话循环
	for round := 0; round < a.maxRounds; round++ {
		g.Log().Infof(ctx, "MCP Agent第 %d 轮对话", round+1)

		// 调用OpenAI API（带工具定义）
		params := openai.ChatCompletionNewParams{
			Model:    openai.ChatModel(model),
			Messages: messages,
			Tools:    tools,
		}

		completion, err := a.chatService.client.Chat.Completions.New(ctx, params)
		if err != nil {
			return nil, gerror.Wrapf(err, "调用OpenAI API失败")
		}

		if len(completion.Choices) == 0 {
			return nil, gerror.New("OpenAI返回空响应")
		}

		choice := completion.Choices[0]

		// 调试：输出完整的choice信息
		g.Log().Infof(ctx, "Choice FinishReason: %s", choice.FinishReason)
		g.Log().Infof(ctx, "Choice Message Content: %s", choice.Message.Content)
		g.Log().Infof(ctx, "ToolCalls 数量: %d", len(choice.Message.ToolCalls))

		// 检查是否需要调用工具
		if len(choice.Message.ToolCalls) == 0 {
			// 没有工具调用，返回最终答案
			res := &v1.ChatRes{
				Content: choice.Message.Content,
				Model:   string(completion.Model),
			}

			if completion.Usage.PromptTokens > 0 {
				res.Usage.PromptTokens = int(completion.Usage.PromptTokens)
				res.Usage.CompletionTokens = int(completion.Usage.CompletionTokens)
				res.Usage.TotalTokens = int(completion.Usage.TotalTokens)
			}

			g.Log().Infof(ctx, "MCP Agent完成，总轮次: %d", round+1)
			return res, nil
		}

		// 执行工具调用
		messages = append(messages, openai.AssistantMessage(choice.Message.Content))

		for _, toolCall := range choice.Message.ToolCalls {
			g.Log().Infof(ctx, "=== ToolCall 详情 ===")
			g.Log().Infof(ctx, "  ID: %s", toolCall.ID)
			g.Log().Infof(ctx, "  Type: %s", toolCall.Type)
			g.Log().Infof(ctx, "  Function.Name: %s", toolCall.Function.Name)
			g.Log().Infof(ctx, "  Function.Arguments (原始字符串): %s", toolCall.Function.Arguments)
			g.Log().Infof(ctx, "  Function.Arguments 长度: %d", len(toolCall.Function.Arguments))

			// 解析工具参数
			var arguments map[string]interface{}
			if toolCall.Function.Arguments != "" {
				if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &arguments); err != nil {
					g.Log().Errorf(ctx, "解析工具参数失败: %v, 原始参数: %s", err, toolCall.Function.Arguments)
					return nil, gerror.Wrapf(err, "解析工具参数失败")
				}
			}

			g.Log().Infof(ctx, "解析后的参数: %+v", arguments)

			// 执行MCP工具
			result, err := a.mcpAdapter.ExecuteTool(ctx, toolCall.Function.Name, arguments)
			if err != nil {
				g.Log().Errorf(ctx, "工具执行失败: %v", err)
				result = "工具执行失败: " + err.Error()
			}

			// 将工具结果添加到消息历史
			messages = append(messages, openai.ToolMessage(toolCall.ID, result))
			g.Log().Infof(ctx, "工具 %s 执行完成，结果长度: %d", toolCall.Function.Name, len(result))
		}

		// 继续下一轮对话，让AI根据工具结果生成答案
	}

	return nil, gerror.Newf("达到最大对话轮次 %d，可能存在循环调用", a.maxRounds)
}

// ChatStream 带MCP工具支持的流式对话
func (a *MCPAgent) ChatStream(ctx context.Context, req *v1.ChatStreamReq, response *ghttp.Response) error {
	messages := a.convertMessages(req.Messages)
	model := req.Model
	if model == "" {
		model = a.chatService.model
	}

	g.Log().Infof(ctx, "MCP Agent流式对话开始")

	// 获取并输出工具定义（调试用）
	tools := a.mcpAdapter.ConvertToOpenAITools()
	g.Log().Infof(ctx, "传递给OpenAI的工具数量: %d", len(tools))

	// 输出所有工具的Schema（特别关注get_user_info）
	for i, tool := range tools {
		toolJSON, _ := json.MarshalIndent(tool, "", "  ")
		g.Log().Infof(ctx, "工具[%d] 定义:\n%s", i, string(toolJSON))
	}

	// 多轮对话循环
	for round := 0; round < a.maxRounds; round++ {
		// 调用OpenAI API（带工具定义）
		params := openai.ChatCompletionNewParams{
			Model:    openai.ChatModel(model),
			Messages: messages,
			Tools:    tools,
		}

		completion, err := a.chatService.client.Chat.Completions.New(ctx, params)
		if err != nil {
			return gerror.Wrapf(err, "调用OpenAI API失败")
		}

		if len(completion.Choices) == 0 {
			return gerror.New("OpenAI返回空响应")
		}

		choice := completion.Choices[0]

		// 调试：输出完整的choice信息
		g.Log().Infof(ctx, "Choice FinishReason: %s", choice.FinishReason)
		g.Log().Infof(ctx, "Choice Message Content: %s", choice.Message.Content)
		g.Log().Infof(ctx, "ToolCalls 数量: %d", len(choice.Message.ToolCalls))

		// 检查是否需要调用工具
		if len(choice.Message.ToolCalls) == 0 {
			// 没有工具调用，使用流式返回最终答案
			return a.streamFinalResponse(ctx, messages, model, response)
		}

		// 发送工具调用信息（SSE格式）
		for _, toolCall := range choice.Message.ToolCalls {
			// 添加详细调试日志
			g.Log().Infof(ctx, "=== ToolCall 详情（流式） ===")
			g.Log().Infof(ctx, "  ID: %s", toolCall.ID)
			g.Log().Infof(ctx, "  Type: %s", toolCall.Type)
			g.Log().Infof(ctx, "  Function.Name: %s", toolCall.Function.Name)
			g.Log().Infof(ctx, "  Function.Arguments (原始): '%s'", toolCall.Function.Arguments)
			g.Log().Infof(ctx, "  Function.Arguments 长度: %d", len(toolCall.Function.Arguments))

			toolInfo := map[string]interface{}{
				"type":      "tool_call",
				"tool_name": toolCall.Function.Name,
				"arguments": toolCall.Function.Arguments,
			}
			a.sendSSE(response, toolInfo)

			// 解析工具参数
			var arguments map[string]interface{}
			if toolCall.Function.Arguments != "" {
				if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &arguments); err != nil {
					g.Log().Errorf(ctx, "解析工具参数失败: %v, 原始参数: %s", err, toolCall.Function.Arguments)
					return gerror.Wrapf(err, "解析工具参数失败")
				}
			}

			g.Log().Infof(ctx, "  解析后的参数: %+v", arguments)

			// 执行MCP工具
			result, err := a.mcpAdapter.ExecuteTool(ctx, toolCall.Function.Name, arguments)
			if err != nil {
				g.Log().Errorf(ctx, "工具执行失败: %v", err)
				result = "工具执行失败: " + err.Error()
			}

			// 发送工具结果
			toolResult := map[string]interface{}{
				"type":   "tool_result",
				"tool":   toolCall.Function.Name,
				"result": result,
			}
			a.sendSSE(response, toolResult)

			// 将结果添加到消息历史
			messages = append(messages, openai.AssistantMessage(choice.Message.Content))
			messages = append(messages, openai.ToolMessage(toolCall.ID, result))
		}
	}

	return gerror.Newf("达到最大对话轮次 %d", a.maxRounds)
}

// streamFinalResponse 流式返回最终答案
func (a *MCPAgent) streamFinalResponse(ctx context.Context, messages []openai.ChatCompletionMessageParamUnion, model string, response *ghttp.Response) error {
	params := openai.ChatCompletionNewParams{
		Model:    openai.ChatModel(model),
		Messages: messages,
	}

	stream := a.chatService.client.Chat.Completions.NewStreaming(ctx, params)

	for stream.Next() {
		chunk := stream.Current()
		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			content := chunk.Choices[0].Delta.Content
			jsonData := map[string]interface{}{
				"content": content,
				"model":   string(chunk.Model),
			}
			jsonBytes, _ := json.Marshal(jsonData)
			response.Writefln("data: %s\n", string(jsonBytes))
			response.Flush()
		}
	}

	if err := stream.Err(); err != nil {
		return gerror.Wrapf(err, "流式调用失败")
	}

	response.Writefln("data: [DONE]\n")
	response.Flush()
	return nil
}

// sendSSE 发送SSE事件
func (a *MCPAgent) sendSSE(response *ghttp.Response, data interface{}) {
	jsonBytes, _ := json.Marshal(data)
	response.Writefln("data: %s\n", string(jsonBytes))
	response.Flush()
}

// convertMessages 转换消息格式
func (a *MCPAgent) convertMessages(messages []v1.Message) []openai.ChatCompletionMessageParamUnion {
	result := make([]openai.ChatCompletionMessageParamUnion, 0, len(messages))
	for _, msg := range messages {
		switch msg.Role {
		case "system":
			result = append(result, openai.SystemMessage(msg.Content))
		case "user":
			result = append(result, openai.UserMessage(msg.Content))
		case "assistant":
			result = append(result, openai.AssistantMessage(msg.Content))
		}
	}
	return result
}

// GetToolNames 获取所有工具名称
func (a *MCPAgent) GetToolNames() []string {
	return a.mcpAdapter.GetToolNames()
}
