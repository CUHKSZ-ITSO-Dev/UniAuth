package chat

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/shared"
)

// MCPAdapter MCP到OpenAI的适配器
type MCPAdapter struct {
	mcpClient *MCPClient
	tools     []mcp.Tool
}

// NewMCPAdapter 创建MCP适配器（使用标准MCP Client）
func NewMCPAdapter(ctx context.Context) (*MCPAdapter, error) {
	// 创建MCP Client（进程内InProcess，通过MCP协议获取完整Schema）
	mcpClient, err := NewMCPClient(ctx)
	if err != nil {
		return nil, err
	}

	// 通过MCP协议获取工具列表（完整Schema！）
	tools, err := mcpClient.ListTools(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "获取工具列表失败")
	}

	g.Log().Infof(ctx, "MCP Adapter初始化完成，通过MCP协议获取 %d 个工具", len(tools))
	return &MCPAdapter{
		mcpClient: mcpClient,
		tools:     tools,
	}, nil
}

// ConvertToOpenAITools 将MCP工具转换为OpenAI tool参数
func (a *MCPAdapter) ConvertToOpenAITools() []openai.ChatCompletionToolUnionParam {
	result := make([]openai.ChatCompletionToolUnionParam, 0, len(a.tools))

	for _, tool := range a.tools {
		// 将MCP的ToolInputSchema转换为map格式
		schemaMap := map[string]interface{}{
			"type":       tool.InputSchema.Type,
			"properties": tool.InputSchema.Properties,
		}
		if len(tool.InputSchema.Required) > 0 {
			schemaMap["required"] = tool.InputSchema.Required
		}
		if len(tool.InputSchema.Defs) > 0 {
			schemaMap["$defs"] = tool.InputSchema.Defs
		}

		// 构造FunctionDefinitionParam
		functionDef := shared.FunctionDefinitionParam{
			Name:       tool.Name,
			Parameters: shared.FunctionParameters(schemaMap),
		}
		
		// 设置描述
		if tool.Description != "" {
			functionDef.Description.Value = tool.Description
		}

		// 使用ChatCompletionFunctionTool构造工具参数
		result = append(result, openai.ChatCompletionFunctionTool(functionDef))
	}

	return result
}

// ExecuteTool 执行工具
func (a *MCPAdapter) ExecuteTool(ctx context.Context, toolName string, arguments map[string]interface{}) (string, error) {
	g.Log().Infof(ctx, "执行MCP工具: %s, 参数: %+v", toolName, arguments)
	result, err := a.mcpClient.CallTool(ctx, toolName, arguments)
	
	// 输出实际返回的结果（调试）
	g.Log().Infof(ctx, "MCP工具返回结果: %s", result)
	
	return result, err
}

// GetToolNames 获取所有工具名称
func (a *MCPAdapter) GetToolNames() []string {
	names := make([]string, 0, len(a.tools))
	for _, tool := range a.tools {
		names = append(names, tool.Name)
	}
	return names
}

// HasTool 检查是否有指定工具
func (a *MCPAdapter) HasTool(name string) bool {
	for _, tool := range a.tools {
		if tool.Name == name {
			return true
		}
	}
	return false
}
