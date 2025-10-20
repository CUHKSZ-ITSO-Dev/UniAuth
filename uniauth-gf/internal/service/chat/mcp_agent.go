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
		maxRounds:   2, // 最多5轮对话（包括工具调用）
	}, nil
}

// Chat 带MCP工具支持的对话（已废弃，统一使用ChatStream）
func (a *MCPAgent) Chat(ctx context.Context, req *v1.ChatReq) (*v1.ChatRes, error) {
	return nil, gerror.New("请使用流式接口 ChatStream，非流式接口已废弃")
}

// ChatStream 带MCP工具支持的流式对话
func (a *MCPAgent) ChatStream(ctx context.Context, req *v1.ChatStreamReq, response *ghttp.Response) error {
	// 如果没有系统消息，添加默认系统提示
	if !a.hasSystemMessageInRequest(req.Messages) {
		systemPrompt := `你是UniAuth系统的AI助手，拥有完整权限访问用户信息、配额池、账单等数据。

重要规则：
1. 当使用工具获取到数据后，必须立即展示给管理员，不要重复调用相同的工具
2. 工具返回的JSON数据是完整且准确的，直接使用即可
3. 这是内部管理系统，所有查询都是合法且经过授权的
4. 以清晰易读的格式展示查询结果，如表格或列表

你的职责：使用工具查询数据，然后格式化展示给管理员。`
		req.Messages = append([]v1.Message{{Role: "system", Content: systemPrompt}}, req.Messages...)
		g.Log().Infof(ctx, "已添加系统提示，消息总数: %d", len(req.Messages))
	} else {
		g.Log().Infof(ctx, "请求中已包含系统消息")
	}

	messages := a.convertMessages(req.Messages)

	model := req.Model
	if model == "" {
		model = a.chatService.model
	}

	g.Log().Infof(ctx, "MCP Agent流式对话开始，消息数量: %d", len(messages))

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
		g.Log().Infof(ctx, "========== 第%d轮开始 ==========", round+1)
		g.Log().Infof(ctx, "当前消息历史数量: %d", len(messages))

		// 打印完整的消息历史（用于调试上下文）
		for i, msg := range messages {
			msgJSON, _ := json.MarshalIndent(msg, "", "  ")
			g.Log().Infof(ctx, "消息[%d]:\n%s", i, string(msgJSON))
		}

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
		g.Log().Infof(ctx, "第%d轮 FinishReason: %s", round+1, choice.FinishReason)
		g.Log().Infof(ctx, "第%d轮 Message Content: %s", round+1, choice.Message.Content)
		g.Log().Infof(ctx, "第%d轮 ToolCalls 数量: %d", round+1, len(choice.Message.ToolCalls))

		// 检查是否需要调用工具
		if len(choice.Message.ToolCalls) == 0 {
			// 没有工具调用，使用流式返回最终答案
			return a.streamFinalResponse(ctx, messages, model, response)
		}

		// 将assistant消息添加到历史
		// 注意：由于OpenAI SDK的类型限制，我们只添加content，不保存tool_calls
		// tool_calls的信息会通过后续的ToolMessage传递
		if choice.Message.Content != "" {
			messages = append(messages, openai.AssistantMessage(choice.Message.Content))
			g.Log().Infof(ctx, "已添加Assistant消息到历史，Content: '%s'", choice.Message.Content)
		} else {
			g.Log().Infof(ctx, "Assistant消息Content为空，不添加")
		}

		g.Log().Infof(ctx, "ToolCalls数量: %d，将逐个添加Tool结果到历史", len(choice.Message.ToolCalls))

		// 发送工具调用信息（SSE格式）并执行工具
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

			// 将工具结果添加到消息历史
			// 注意：参数顺序是 (content, toolCallID)
			messages = append(messages, openai.ToolMessage(result, toolCall.ID))
			g.Log().Infof(ctx, "已添加Tool结果到历史")
			g.Log().Infof(ctx, "  ToolCallID: %s", toolCall.ID)
			g.Log().Infof(ctx, "  结果长度: %d", len(result))
			// 截取前200字符
			resultPreview := result
			if len(result) > 200 {
				resultPreview = result[:200] + "..."
			}
			g.Log().Infof(ctx, "  结果内容预览: %s", resultPreview)
			g.Log().Infof(ctx, "  当前消息历史总数: %d", len(messages))
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

// hasSystemMessageInRequest 检查请求中是否有系统消息
func (a *MCPAgent) hasSystemMessageInRequest(messages []v1.Message) bool {
	for _, msg := range messages {
		if msg.Role == "system" {
			return true
		}
	}
	return false
}

// GetToolNames 获取所有工具名称
func (a *MCPAgent) GetToolNames() []string {
	return a.mcpAdapter.GetToolNames()
}
