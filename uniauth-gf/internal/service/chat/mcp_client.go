package chat

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"

	mcpSvc "uniauth-gf/internal/service/mcp"
)

// MCPClient MCP客户端（进程内）
type MCPClient struct {
	client *client.Client
}

// NewMCPClient 创建MCP客户端（进程内连接）
func NewMCPClient(ctx context.Context) (*MCPClient, error) {
	// 获取全局MCP Server
	server := mcpSvc.GetMCPServer()
	if server == nil {
		return nil, gerror.New("MCP服务器未初始化")
	}

	// 创建进程内Client（通过MCP协议通信，能获取完整Schema！）
	mcpClient, err := client.NewInProcessClient(server)
	if err != nil {
		return nil, gerror.Wrap(err, "创建MCP Client失败")
	}

	// 初始化Client
	initReq := mcp.InitializeRequest{
		Params: mcp.InitializeParams{
			ProtocolVersion: mcp.LATEST_PROTOCOL_VERSION,
			ClientInfo: mcp.Implementation{
				Name:    "UniAuth AI Agent",
				Version: "1.0.0",
			},
		},
	}

	_, err = mcpClient.Initialize(ctx, initReq)
	if err != nil {
		return nil, gerror.Wrap(err, "初始化MCP Client失败")
	}

	g.Log().Info(ctx, "MCP Client（进程内）初始化成功")
	return &MCPClient{
		client: mcpClient,
	}, nil
}

// ListTools 获取工具列表（通过MCP协议）
func (c *MCPClient) ListTools(ctx context.Context) ([]mcp.Tool, error) {
	listReq := mcp.ListToolsRequest{}
	result, err := c.client.ListTools(ctx, listReq)
	if err != nil {
		return nil, gerror.Wrap(err, "获取工具列表失败")
	}

	g.Log().Infof(ctx, "通过MCP协议获取到 %d 个工具", len(result.Tools))

	// 调试：输出所有工具的Schema
	for i, tool := range result.Tools {
		g.Log().Debugf(ctx, "工具[%d] %s, InputSchema: %+v", i, tool.Name, tool.InputSchema)
	}

	return result.Tools, nil
}

// CallTool 调用工具（通过MCP协议）
func (c *MCPClient) CallTool(ctx context.Context, name string, arguments map[string]interface{}) (string, error) {
	callReq := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name:      name,
			Arguments: arguments,
		},
	}

	result, err := c.client.CallTool(ctx, callReq)
	if err != nil {
		return "", gerror.Wrapf(err, "调用工具失败")
	}

	if result.IsError {
		var errorText string
		for _, content := range result.Content {
			switch c := content.(type) {
			case *mcp.TextContent:
				errorText += c.Text
			}
		}
		return "", gerror.New(errorText)
	}

	// 提取文本结果
	var textResult string
	for _, content := range result.Content {
		switch c := content.(type) {
		case *mcp.TextContent:
			textResult += c.Text
		}
	}

	g.Log().Infof(ctx, "MCP工具 %s 执行成功，结果长度: %d", name, len(textResult))
	return textResult, nil
}
