package chat

import (
	"context"
	"encoding/json"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"

	v1 "uniauth-gf/api/chat/v1"
)

type ChatService struct {
	client *openai.Client
	model  string
}

var (
	chatServiceInstance *ChatService
)

// GetChatService 获取ChatService单例
func GetChatService(ctx context.Context) (*ChatService, error) {
	if chatServiceInstance != nil {
		return chatServiceInstance, nil
	}

	// 从配置文件读取OpenAI配置
	apiKey := g.Cfg().MustGet(ctx, "openai.apiKey").String()
	baseURL := g.Cfg().MustGet(ctx, "openai.baseURL").String()
	model := g.Cfg().MustGet(ctx, "openai.model").String()

	if apiKey == "" || apiKey == "your-api-key-here" {
		return nil, gerror.New("OpenAI API Key未配置，请在配置文件中设置 openai.apiKey")
	}

	// 创建OpenAI客户端
	opts := []option.RequestOption{
		option.WithAPIKey(apiKey),
	}

	if baseURL != "" {
		opts = append(opts, option.WithBaseURL(baseURL))
	}

	client := openai.NewClient(opts...)

	chatServiceInstance = &ChatService{
		client: &client,
		model:  model,
	}

	return chatServiceInstance, nil
}

// Chat 普通对话（非流式）
func (s *ChatService) Chat(ctx context.Context, req *v1.ChatReq) (*v1.ChatRes, error) {
	// 转换消息格式
	messages := make([]openai.ChatCompletionMessageParamUnion, 0, len(req.Messages))
	for _, msg := range req.Messages {
		switch msg.Role {
		case "system":
			messages = append(messages, openai.SystemMessage(msg.Content))
		case "user":
			messages = append(messages, openai.UserMessage(msg.Content))
		case "assistant":
			messages = append(messages, openai.AssistantMessage(msg.Content))
		default:
			return nil, gerror.Newf("不支持的消息角色: %s", msg.Role)
		}
	}

	// 确定使用的模型
	model := req.Model
	if model == "" {
		model = s.model
	}

	// 调用OpenAI API
	params := openai.ChatCompletionNewParams{
		Model:    openai.ChatModel(model),
		Messages: messages,
	}

	completion, err := s.client.Chat.Completions.New(ctx, params)
	if err != nil {
		return nil, gerror.Wrapf(err, "调用OpenAI API失败")
	}

	// 构造响应
	res := &v1.ChatRes{
		Model: string(completion.Model),
	}

	if len(completion.Choices) > 0 {
		res.Content = completion.Choices[0].Message.Content
	}

	if completion.Usage.PromptTokens > 0 {
		res.Usage.PromptTokens = int(completion.Usage.PromptTokens)
		res.Usage.CompletionTokens = int(completion.Usage.CompletionTokens)
		res.Usage.TotalTokens = int(completion.Usage.TotalTokens)
	}

	return res, nil
}

// ChatStream 流式对话
func (s *ChatService) ChatStream(ctx context.Context, req *v1.ChatStreamReq, response *ghttp.Response) error {
	// 转换消息格式
	messages := make([]openai.ChatCompletionMessageParamUnion, 0, len(req.Messages))
	for _, msg := range req.Messages {
		switch msg.Role {
		case "system":
			messages = append(messages, openai.SystemMessage(msg.Content))
		case "user":
			messages = append(messages, openai.UserMessage(msg.Content))
		case "assistant":
			messages = append(messages, openai.AssistantMessage(msg.Content))
		default:
			return gerror.Newf("不支持的消息角色: %s", msg.Role)
		}
	}

	// 确定使用的模型
	model := req.Model
	if model == "" {
		model = s.model
	}

	// 调用OpenAI流式API
	params := openai.ChatCompletionNewParams{
		Model:    openai.ChatModel(model),
		Messages: messages,
	}

	stream := s.client.Chat.Completions.NewStreaming(ctx, params)

	// 处理流式响应
	for stream.Next() {
		chunk := stream.Current()

		// 如果有内容，发送SSE事件
		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			content := chunk.Choices[0].Delta.Content

			// 将数据转换为JSON
			jsonData := map[string]interface{}{
				"content": content,
				"model":   string(chunk.Model),
			}
			jsonBytes, _ := json.Marshal(jsonData)

			// 使用 Writefln 写入SSE数据（GoFrame推荐方式）
			response.Writefln("data: %s\n", string(jsonBytes))
			response.Flush()
		}
	}

	if err := stream.Err(); err != nil {
		// 发送错误事件
		jsonData := map[string]interface{}{
			"error": err.Error(),
		}
		jsonBytes, _ := json.Marshal(jsonData)
		response.Writefln("data: %s\n", string(jsonBytes))
		response.Flush()
		return gerror.Wrapf(err, "流式调用OpenAI API失败")
	}

	// 发送结束事件
	response.Writefln("data: [DONE]\n")
	response.Flush()

	return nil
}
