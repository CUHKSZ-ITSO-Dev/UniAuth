package registry

import (
	"fmt"
	"sort"

	"github.com/mark3labs/mcp-go/server"
)

// ToolRegistrar 工具注册函数类型
type ToolRegistrar func(*server.MCPServer) error

// toolRegistry 全局工具注册表
var toolRegistry = make(map[string]ToolRegistrar)

// RegisterTool 注册工具到全局注册表
func RegisterTool(name string, registrar ToolRegistrar) {
	toolRegistry[name] = registrar
}

// RegisterAll 批量注册所有工具到 MCP 服务器
func RegisterAll(s *server.MCPServer) error {
	for name, registrar := range toolRegistry {
		if err := registrar(s); err != nil {
			return fmt.Errorf("failed to register tool %s: %w", name, err)
		}
	}
	return nil
}

// ListTools 返回所有已注册工具的名称列表（按字母排序）
func ListTools() []string {
	tools := make([]string, 0, len(toolRegistry))
	for name := range toolRegistry {
		tools = append(tools, name)
	}
	sort.Strings(tools)
	return tools
}

// CountTools 返回已注册工具的数量
func CountTools() int {
	return len(toolRegistry)
}

// HasTool 检查指定工具是否已注册
func HasTool(name string) bool {
	_, exists := toolRegistry[name]
	return exists
}
