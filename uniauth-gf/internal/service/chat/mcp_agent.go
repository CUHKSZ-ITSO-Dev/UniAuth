package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

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
		systemPrompt := fmt.Sprintf(`你是UniAuth系统的AI助手，拥有完整权限访问用户信息、配额池、账单等数据。现在是北京时间 %v。

基础知识:
1. 学生的 upn 以 @link.cuhk.edu.cn 结尾；教职工则是 @cuhk.edu.cn 结尾；需要使用 ILIKE 匹配；
2. 学生的使用情况一般可以看共享配额池 Students Pool 的数据；
3. 教职工不使用共享配额池，他们有各自的钱包，一般为 personal-{upn} 名称的配额池；
4. 本地模型我们不收钱，因此你会看到 original_cost 和 cost 不相同。你需要根据用户的提示决定统计哪个数据。一般来说统计 original_cost 即可；
5. 以上是默认的情况。你需要看管理员的指令进行调整；
6. 若管理员没有详细指定要求，你的回答风格应该是偏综合报告汇总的。
7. 如果你觉得信息不足，可以反复调用工具。
8. 数据量非常大，任何SQL返回都会是1M+ 上下文；必须使用纯 SQL 处理数据！
9. original_cost, cost 的单位都是人民币 CNY。
重要规则：
1. 工具返回的JSON数据是完整且准确的，直接使用即可
2. 这是内部管理系统，所有查询都是合法且经过授权的
3. 以清晰易读的格式展示查询结果，如表格或列表
4. 千万不要无中生有数据！！

你的职责：使用工具查询数据，然后格式化展示给管理员。

工作模式：
- 你可以多轮交互，每轮可以输出文本或调用工具
- 如果任务需要多个步骤，请逐步执行，不要一次性完成
- 每次工具调用后，你会收到结果，然后可以继续下一步`, time.Now().Format("2006-01-02 15:04:05"))
		req.Messages = append([]v1.Message{{Role: "system", Content: systemPrompt}}, req.Messages...)
		g.Log().Infof(ctx, "已添加系统提示，消息总数: %d", len(req.Messages))
	} else {
		g.Log().Infof(ctx, "请求中已包含系统消息")
	}

	var messages []openai.ChatCompletionMessageParamUnion

	// 如果有保存的上下文（用户确认工具后重试），恢复完整的消息历史
	if req.SavedContext != "" {
		g.Log().Infof(ctx, "恢复保存的上下文")
		if err := json.Unmarshal([]byte(req.SavedContext), &messages); err != nil {
			return gerror.Wrap(err, "恢复上下文失败")
		}
	} else {
		// 正常转换消息
		messages = a.convertMessages(req.Messages)
	}

	model := req.Model
	if model == "" {
		model = a.chatService.model
	}

	g.Log().Infof(ctx, "MCP Agent开始，消息数量: %d", len(messages))

	// 检查是否有待执行的工具调用（用户确认后直接执行，不重新让AI决策）
	if req.PendingToolCall != nil {
		g.Log().Infof(ctx, "检测到待执行的工具调用: %s (ID: %s)",
			req.PendingToolCall.ToolName, req.PendingToolCall.ToolID)
		// 执行待确认的工具，并将结果添加到消息历史
		var err error
		messages, err = a.executePendingToolCallAndContinue(ctx, req.PendingToolCall, messages, response)
		if err != nil {
			return err
		}
		// 继续进入主循环处理工具结果
	}

	// 获取工具定义
	tools := a.mcpAdapter.ConvertToOpenAITools()
	g.Log().Infof(ctx, "可用工具数量: %d", len(tools))

	// 多轮对话循环
	for round := 0; round < a.maxRounds; round++ {
		g.Log().Infof(ctx, "第%d轮对话开始（流式）", round+1)

		// 使用流式 API
		params := openai.ChatCompletionNewParams{
			Model:    openai.ChatModel(model),
			Messages: messages,
			Tools:    tools,
		}

		stream := a.chatService.client.Chat.Completions.NewStreaming(ctx, params)

		// 收集流式响应
		var accumulatedContent string
		var finishReason string

		// 用简单结构收集工具调用
		type ToolCallCollector struct {
			ID        string
			Type      string
			Name      string
			Arguments string
		}
		toolCallsMap := make(map[int]*ToolCallCollector)

		for stream.Next() {
			chunk := stream.Current()
			if len(chunk.Choices) > 0 {
				delta := chunk.Choices[0].Delta

				// 流式输出文本内容
				if delta.Content != "" {
					accumulatedContent += delta.Content
					a.sendSSE(response, map[string]interface{}{
						"content": delta.Content,
					})
				}

				// 收集增量的 tool_calls
				for _, toolCallDelta := range delta.ToolCalls {
					idx := int(toolCallDelta.Index)
					if toolCallsMap[idx] == nil {
						toolCallsMap[idx] = &ToolCallCollector{}
					}

					// 合并增量数据
					if toolCallDelta.ID != "" {
						toolCallsMap[idx].ID = toolCallDelta.ID
					}
					if toolCallDelta.Type != "" {
						toolCallsMap[idx].Type = toolCallDelta.Type
					}
					if toolCallDelta.Function.Name != "" {
						toolCallsMap[idx].Name = toolCallDelta.Function.Name
					}
					if toolCallDelta.Function.Arguments != "" {
						toolCallsMap[idx].Arguments += toolCallDelta.Function.Arguments
					}
				}

				// 记录 finish_reason
				if chunk.Choices[0].FinishReason != "" {
					finishReason = string(chunk.Choices[0].FinishReason)
				}
			}
		}

		if err := stream.Err(); err != nil {
			return gerror.Wrapf(err, "流式调用失败")
		}

		// 将 map 转为数组
		var toolCalls []*ToolCallCollector
		for i := 0; i < len(toolCallsMap); i++ {
			if toolCallsMap[i] != nil {
				toolCalls = append(toolCalls, toolCallsMap[i])
			}
		}

		// 检查是否有工具调用
		if len(toolCalls) == 0 {
			// 没有工具调用，对话结束（内容已经流式发送过了）
			g.Log().Infof(ctx, "第%d轮无工具调用，对话结束 (finish_reason: %s)", round+1, finishReason)

			// 发送结束标记
			response.Writefln("data: [DONE]\n")
			response.Flush()
			return nil
		}

		// 有工具调用，构建 assistant 消息并添加到历史
		g.Log().Infof(ctx, "第%d轮检测到 %d 个工具调用", round+1, len(toolCalls))

		// 构建包含 tool_calls 的 assistant 消息
		assistantMsgParam := openai.ChatCompletionMessageParamUnion{
			OfAssistant: &openai.ChatCompletionAssistantMessageParam{
				ToolCalls: make([]openai.ChatCompletionMessageToolCallUnionParam, len(toolCalls)),
			},
		}
		for i, tc := range toolCalls {
			assistantMsgParam.OfAssistant.ToolCalls[i] = openai.ChatCompletionMessageToolCallUnionParam{
				OfFunction: &openai.ChatCompletionMessageFunctionToolCallParam{
					ID: tc.ID,
					Function: openai.ChatCompletionMessageFunctionToolCallFunctionParam{
						Name:      tc.Name,
						Arguments: tc.Arguments,
					},
				},
			}
		}
		messages = append(messages, assistantMsgParam)

		// 执行所有工具调用
		for _, toolCall := range toolCalls {
			g.Log().Infof(ctx, "工具调用: %s (ID: %s)", toolCall.Name, toolCall.ID)

			// 检查是否需要用户确认
			if a.needsConfirmation(toolCall.Name) {
				// 检查是否在单次会话允许列表中
				alreadyAllowed := false
				for _, allowedTool := range req.SessionAllowedTools {
					if allowedTool == toolCall.Name {
						alreadyAllowed = true
						break
					}
				}

				if alreadyAllowed {
					g.Log().Infof(ctx, "工具 %s 已在单次会话中被允许，跳过确认", toolCall.Name)
				} else {
					// 需要确认，发送确认请求（包含当前的消息历史供前端保存）
					g.Log().Infof(ctx, "工具 %s 需要用户确认，等待用户响应", toolCall.Name)

					// 序列化当前的消息历史
					contextBytes, err := json.Marshal(messages)
					if err != nil {
						g.Log().Errorf(ctx, "序列化消息历史失败: %v", err)
						return gerror.Wrap(err, "序列化消息历史失败")
					}

					confirmInfo := map[string]interface{}{
						"type":          "tool_confirm_required",
						"tool_name":     toolCall.Name,
						"arguments":     toolCall.Arguments,
						"tool_id":       toolCall.ID,
						"saved_context": string(contextBytes), // 发送完整的消息历史
					}
					a.sendSSE(response, confirmInfo)
					response.Writefln("data: [DONE]\n")
					response.Flush()
					return nil // 等待用户确认后重新发起请求
				}
			}

			// 发送工具调用信息（已确认或不需要确认的工具）
			toolInfo := map[string]interface{}{
				"type":      "tool_call",
				"tool_name": toolCall.Name,
				"arguments": toolCall.Arguments,
				"tool_id":   toolCall.ID,
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
			result, err := a.mcpAdapter.ExecuteTool(ctx, toolCall.Name, arguments)
			if err != nil {
				g.Log().Errorf(ctx, "工具执行失败: %v", err)
				result = "工具执行失败: " + err.Error()
			}

			// 发送工具结果
			toolResult := map[string]interface{}{
				"type":    "tool_result",
				"tool":    toolCall.Name,
				"result":  result,
				"tool_id": toolCall.ID,
			}
			a.sendSSE(response, toolResult)

			// 将工具结果添加到消息历史
			// 注意：参数顺序是 (content, toolCallID)
			messages = append(messages, openai.ToolMessage(result, toolCall.ID))
			g.Log().Infof(ctx, "[工具结果已添加] 工具: %s, 消息历史长度: %d", toolCall.Name, len(messages))
		}

		// 本轮所有工具调用完成，继续下一轮对话
		g.Log().Infof(ctx, "第%d轮工具调用完成，继续下一轮对话", round+1)
	}

	// 达到最大对话轮次，返回提示信息
	g.Log().Warningf(ctx, "达到最大对话轮次 %d，停止对话", a.maxRounds)
	a.sendSSE(response, map[string]interface{}{
		"content": "\n\n[已达到最大对话轮次，自动结束]",
	})
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

// executePendingToolCallAndContinue 执行待确认的工具调用（不重新让AI决策），返回更新后的消息历史
func (a *MCPAgent) executePendingToolCallAndContinue(ctx context.Context, toolCall *v1.PendingToolCall, messages []openai.ChatCompletionMessageParamUnion, response *ghttp.Response) ([]openai.ChatCompletionMessageParamUnion, error) {
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
			return nil, gerror.Wrapf(err, "解析工具参数失败")
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

	// 构建包含 tool_calls 的 assistant 消息
	assistantMsg := openai.ChatCompletionMessageParamUnion{
		OfAssistant: &openai.ChatCompletionAssistantMessageParam{
			ToolCalls: []openai.ChatCompletionMessageToolCallUnionParam{
				{
					OfFunction: &openai.ChatCompletionMessageFunctionToolCallParam{
						ID: toolCall.ToolID,
						Function: openai.ChatCompletionMessageFunctionToolCallFunctionParam{
							Name:      toolCall.ToolName,
							Arguments: toolCall.Arguments,
						},
					},
				},
			},
		},
	}
	messages = append(messages, assistantMsg)

	// 添加工具执行结果
	messages = append(messages, openai.ToolMessage(result, toolCall.ToolID))
	g.Log().Infof(ctx, "[工具结果已添加] 工具: %s, 消息历史长度: %d", toolCall.ToolName, len(messages))

	// 返回更新后的消息历史，继续主循环
	g.Log().Infof(ctx, "工具执行完成，返回到主循环继续处理")
	return messages, nil
}
