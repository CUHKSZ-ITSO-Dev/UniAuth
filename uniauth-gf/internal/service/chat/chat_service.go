package chat

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
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
