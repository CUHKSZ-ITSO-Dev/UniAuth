package mcp

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/mark3labs/mcp-go/server"

	"uniauth-gf/internal/service/mcp/registry"
	_ "uniauth-gf/internal/service/mcp/tools"
)

var (
	// globalMCPServer 全局MCP服务器实例
	globalMCPServer *server.MCPServer
)

// GetMCPServer 获取全局MCP服务器实例
func GetMCPServer() *server.MCPServer {
	return globalMCPServer
}

// StartMCPServer 启动MCP服务器
func StartMCPServer(ctx context.Context) error {
	// Create a new MCP server
	s := server.NewMCPServer(
		"UniAuthMCP",
		"1.0.0",
		server.WithToolCapabilities(true),
	)

	// 一行代码注册所有工具！
	if err := registry.RegisterAll(s); err != nil {
		return fmt.Errorf("failed to register tools: %w", err)
	}

	// 保存全局实例
	globalMCPServer = s

	// 输出已注册的工具信息
	tools := registry.ListTools()
	g.Log().Info(ctx, fmt.Sprintf("MCP服务器启动中... 已注册 %d 个工具: %v", registry.CountTools(), tools))

	return server.NewSSEServer(s).Start(":8080")
}
