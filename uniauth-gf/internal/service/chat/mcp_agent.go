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
	chatService  *ChatService
	mcpAdapter   *MCPAdapter
	maxRounds    int      // 最大对话轮次，防止无限循环
	confirmTools []string // 需要用户确认的工具列表
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
		maxRounds:   10, // 最多10轮对话（包括工具调用）
		confirmTools: []string{
			"add_quota_pool",                         // 新增配额池需要确认
			"get_arbitrary_billing_records_with_sql", // 执行SQL需要确认
		},
	}, nil
}

// ChatStream 带MCP工具支持的流式对话（唯一接口）
func (a *MCPAgent) ChatStream(ctx context.Context, req *v1.ChatWithMCPStreamReq, response *ghttp.Response) error {
	// 如果没有系统消息，添加默认系统提示
	if !a.hasSystemMessageInRequest(req.Messages) {
		systemPrompt := `你是UniAuth系统的AI助手，拥有完整权限访问用户信息、配额池、账单等数据。

重要规则：
1. 工具返回的JSON数据是完整且准确的，直接使用即可
2. 这是内部管理系统，所有查询都是合法且经过授权的
3. 以清晰易读的格式展示查询结果，如表格或列表

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

	g.Log().Infof(ctx, "MCP Agent开始，消息数量: %d", len(messages))

	// 检查是否有待执行的工具调用（用户确认后直接执行，不重新让AI决策）
	if req.PendingToolCall != nil {
		g.Log().Infof(ctx, "检测到待执行的工具调用: %s (ID: %s)",
			req.PendingToolCall.ToolName, req.PendingToolCall.ToolID)
		return a.executePendingToolCall(ctx, req, messages, model, response)
	}

	// 获取工具定义
	tools := a.mcpAdapter.ConvertToOpenAITools()
	g.Log().Infof(ctx, "可用工具数量: %d", len(tools))

	// 多轮对话循环
	for round := 0; round < a.maxRounds; round++ {
		g.Log().Infof(ctx, "第%d轮对话开始", round+1)

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

		// 检查是否需要调用工具
		if len(choice.Message.ToolCalls) == 0 {
			// 没有工具调用，使用流式返回最终答案
			return a.streamFinalResponse(ctx, messages, model, response)
		}

		// 将assistant消息添加到历史（如果有内容）
		if choice.Message.Content != "" {
			messages = append(messages, openai.AssistantMessage(choice.Message.Content))
		}

		// 执行所有工具调用
		for _, toolCall := range choice.Message.ToolCalls {
			g.Log().Infof(ctx, "工具调用: %s (ID: %s)", toolCall.Function.Name, toolCall.ID)

			// 检查是否需要用户确认（每次都需要确认，不使用允许列表）
			if a.needsConfirmation(toolCall.Function.Name) {
				// 需要确认，发送确认请求（不发送tool_call，避免重复显示）
				g.Log().Infof(ctx, "工具 %s 需要用户确认，等待用户响应", toolCall.Function.Name)
				confirmInfo := map[string]interface{}{
					"type":      "tool_confirm_required",
					"tool_name": toolCall.Function.Name,
					"arguments": toolCall.Function.Arguments,
					"tool_id":   toolCall.ID,
				}
				a.sendSSE(response, confirmInfo)
				response.Writefln("data: [DONE]\n")
				response.Flush()
				return nil // 等待用户确认后重新发起请求
			}

			// 发送工具调用信息（已确认或不需要确认的工具）
			toolInfo := map[string]interface{}{
				"type":      "tool_call",
				"tool_name": toolCall.Function.Name,
				"arguments": toolCall.Function.Arguments,
				"tool_id":   toolCall.ID,
			}
			a.sendSSE(response, toolInfo)

			// 解析工具参数
			var arguments map[string]interface{}
			if toolCall.Function.Arguments != "" {
				if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &arguments); err != nil {
					g.Log().Errorf(ctx, "解析工具参数失败: %v", err)
					return gerror.Wrapf(err, "解析工具参数失败")
				}
			}

			// 执行MCP工具
			result, err := a.mcpAdapter.ExecuteTool(ctx, toolCall.Function.Name, arguments)
			if err != nil {
				g.Log().Errorf(ctx, "工具执行失败: %v", err)
				result = "工具执行失败: " + err.Error()
			}

			// 发送工具结果
			toolResult := map[string]interface{}{
				"type":    "tool_result",
				"tool":    toolCall.Function.Name,
				"result":  result,
				"tool_id": toolCall.ID, // 使用OpenAI的tool_call ID
			}
			a.sendSSE(response, toolResult)

			// 将工具结果添加到消息历史
			// 注意：参数顺序是 (content, toolCallID)
			messages = append(messages, openai.ToolMessage(result, toolCall.ID))
			g.Log().Infof(ctx, "[工具结果已添加] 工具: %s, 消息历史长度: %d", toolCall.Function.Name, len(messages))
		}

		// 本轮所有工具调用完成，继续下一轮对话
		g.Log().Infof(ctx, "第%d轮工具调用完成，继续下一轮对话", round+1)
	}

	g.Log().Warningf(ctx, "达到最大对话轮次 %d，停止对话", a.maxRounds)
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
		if len(chunk.Choices) > 0 {
			delta := chunk.Choices[0].Delta
			jsonData := map[string]interface{}{}
			hasData := false

			// 普通内容
			if delta.Content != "" {
				jsonData["content"] = delta.Content
				hasData = true
			}

			// TODO: 思考链内容支持（需要SDK更新）
			// 当前版本的SDK可能不支持reasoning字段
			// 可以通过 chunk.Choices[0].Delta.JSON.ExtraFields 获取
			// if reasoning, ok := delta.JSON.ExtraFields["reasoning"]; ok {
			//     jsonData["reasoning"] = reasoning
			//     hasData = true
			// }

			if hasData {
				jsonData["model"] = string(chunk.Model)
				jsonBytes, _ := json.Marshal(jsonData)
				response.Writefln("data: %s\n", string(jsonBytes))
				response.Flush()
			}
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

// needsConfirmation 检查工具是否需要用户确认
func (a *MCPAgent) needsConfirmation(toolName string) bool {
	for _, confirmTool := range a.confirmTools {
		if confirmTool == toolName {
			return true
		}
	}
	return false
}

// GetToolNames 获取所有工具名称
func (a *MCPAgent) GetToolNames() []string {
	return a.mcpAdapter.GetToolNames()
}

// executePendingToolCall 执行待确认的工具调用（不重新让AI决策）
func (a *MCPAgent) executePendingToolCall(ctx context.Context, req *v1.ChatWithMCPStreamReq, messages []openai.ChatCompletionMessageParamUnion, model string, response *ghttp.Response) error {
	toolCall := req.PendingToolCall

	// 发送工具调用事件
	g.Log().Infof(ctx, "[发送SSE] tool_call - %s (直接执行模式)", toolCall.ToolName)
	toolInfo := map[string]interface{}{
		"type":      "tool_call",
		"tool_name": toolCall.ToolName,
		"arguments": toolCall.Arguments,
		"tool_id":   toolCall.ToolID,
	}
	a.sendSSE(response, toolInfo)

	// 解析工具参数
	var arguments map[string]interface{}
	if toolCall.Arguments != "" {
		if err := json.Unmarshal([]byte(toolCall.Arguments), &arguments); err != nil {
			g.Log().Errorf(ctx, "解析工具参数失败: %v", err)
			return gerror.Wrapf(err, "解析工具参数失败")
		}
	}

	// 执行MCP工具
	g.Log().Infof(ctx, "执行待确认的工具: %s", toolCall.ToolName)
	result, err := a.mcpAdapter.ExecuteTool(ctx, toolCall.ToolName, arguments)
	if err != nil {
		g.Log().Errorf(ctx, "工具执行失败: %v", err)
		result = "工具执行失败: " + err.Error()
	}

	// 发送工具结果
	toolResult := map[string]interface{}{
		"type":    "tool_result",
		"tool":    toolCall.ToolName,
		"result":  result,
		"tool_id": toolCall.ToolID,
	}
	a.sendSSE(response, toolResult)

	// 将工具调用和结果添加到消息历史
	// 注意：需要先添加一个assistant消息表示工具调用决策
	messages = append(messages, openai.AssistantMessage(""))
	messages = append(messages, openai.ToolMessage(result, toolCall.ToolID))
	g.Log().Infof(ctx, "[工具结果已添加] 工具: %s, 消息历史长度: %d", toolCall.ToolName, len(messages))

	// 继续让AI处理工具结果，使用流式返回最终答案
	g.Log().Infof(ctx, "工具执行完成，请求AI处理结果")
	return a.streamFinalResponse(ctx, messages, model, response)
}
