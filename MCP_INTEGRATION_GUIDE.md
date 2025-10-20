# MCP工具集成到AI对话的实现方案

## 现状分析

### 已有的MCP服务

您的项目已经有一个完整的MCP服务器实现：
- 📁 位置：`uniauth-gf/internal/service/mcp/`
- 🛠️ 已注册工具：7个（calculator, get_user_info, add_quota_pool, get_quota_pool, get_bill_record, hello_world, danger_sql）
- 🚀 运行端口：8080（SSE方式）

### OpenAI Function Calling

要让AI对话使用MCP工具，需要利用OpenAI的Function Calling功能：
1. 将MCP工具定义转换为OpenAI function格式
2. AI决定何时调用哪个工具
3. 执行工具并返回结果
4. AI根据结果生成最终回答

## 实现方案

### 方案一：基础集成（推荐，简单）

#### 1. 创建MCP工具转换器

```go
// uniauth-gf/internal/service/chat/mcp_adapter.go
package chat

import (
    "context"
    "encoding/json"
    
    "github.com/openai/openai-go/v3"
    "github.com/mark3labs/mcp-go/mcp"
    mcpRegistry "uniauth-gf/internal/service/mcp/registry"
)

// MCPAdapter MCP工具适配器
type MCPAdapter struct {
    // MCP工具映射
    tools map[string]*mcp.Tool
}

// NewMCPAdapter 创建适配器
func NewMCPAdapter() *MCPAdapter {
    return &MCPAdapter{
        tools: make(map[string]*mcp.Tool),
    }
}

// ConvertToOpenAIFunctions 将MCP工具转换为OpenAI function定义
func (a *MCPAdapter) ConvertToOpenAIFunctions() []openai.ChatCompletionToolParam {
    // TODO: 遍历MCP工具，转换为OpenAI格式
    return nil
}

// ExecuteTool 执行MCP工具
func (a *MCPAdapter) ExecuteTool(ctx context.Context, toolName string, args map[string]interface{}) (string, error) {
    // TODO: 调用MCP工具并返回结果
    return "", nil
}
```

#### 2. 扩展Chat Service支持工具调用

```go
// 在 chat_service.go 中添加
type ChatWithToolsReq struct {
    Messages []Message
    Model    string
    UseMCP   bool   // 是否启用MCP工具
}

func (s *ChatService) ChatWithTools(ctx context.Context, req *ChatWithToolsReq) (*ChatRes, error) {
    // 如果启用MCP，添加function定义
    params := openai.ChatCompletionNewParams{
        Model:    openai.ChatModel(model),
        Messages: messages,
    }
    
    if req.UseMCP {
        adapter := NewMCPAdapter()
        tools := adapter.ConvertToOpenAIFunctions()
        // params.Tools = tools  // 需要根据OpenAI Go SDK v3的API调整
    }
    
    completion, err := s.client.Chat.Completions.New(ctx, params)
    
    // 检查是否需要调用工具
    if len(completion.Choices) > 0 && completion.Choices[0].FinishReason == "tool_calls" {
        // 执行工具调用
        // ...
        // 再次请求AI生成最终答案
    }
    
    return nil, nil
}
```

### 方案二：完整集成（复杂，功能完整）

创建独立的MCP Agent服务，支持：
- ✅ 自动工具选择
- ✅ 多轮工具调用
- ✅ 流式输出
- ✅ 错误处理和重试

#### 文件结构

```
uniauth-gf/internal/service/chat/
├── chat_service.go          # 基础对话
├── mcp_agent.go             # MCP Agent实现
├── mcp_adapter.go           # MCP<->OpenAI转换器
└── tool_executor.go         # 工具执行器
```

## 快速实现（最简方案）

如果您想快速验证MCP集成，可以先实现一个简单版本：

### 1. 添加一个测试接口

```go
// api/chat/v1/chat.go
type ChatWithMCPReq struct {
    g.Meta   `path:"/mcp" tags:"Chat" method:"post" summary:"AI对话（支持MCP工具）"`
    Messages []Message `json:"messages" v:"required"`
    Model    string    `json:"model"`
}

type ChatWithMCPRes struct {
    Content   string   `json:"content"`
    ToolCalls []string `json:"tool_calls"` // 记录调用了哪些工具
}
```

### 2. 硬编码几个常用工具

先支持1-2个最常用的工具，验证流程：

```go
func (s *ChatService) ChatWithMCP(ctx context.Context, req *v1.ChatWithMCPReq) (*v1.ChatWithMCPRes, error) {
    // 手动添加calculator工具定义
    tools := []map[string]interface{}{
        {
            "type": "function",
            "function": map[string]interface{}{
                "name": "calculate",
                "description": "执行基本算术运算",
                "parameters": map[string]interface{}{
                    "type": "object",
                    "properties": map[string]interface{}{
                        "operation": map[string]interface{}{
                            "type": "string",
                            "enum": []string{"add", "subtract", "multiply", "divide"},
                        },
                        "x": map[string]interface{}{"type": "number"},
                        "y": map[string]interface{}{"type": "number"},
                    },
                    "required": []string{"operation", "x", "y"},
                },
            },
        },
    }
    
    // 调用OpenAI with tools
    // ...
}
```

## OpenAI Go SDK v3 Function Calling示例

根据OpenAI官方文档，function calling的基本流程：

```go
import (
    "github.com/openai/openai-go/v3"
)

// 定义function
tools := []openai.ChatCompletionToolParam{
    {
        Type: openai.F(openai.ChatCompletionToolTypeFunction),
        Function: openai.F(openai.FunctionDefinitionParam{
            Name:        openai.F("get_weather"),
            Description: openai.F("Get the current weather"),
            Parameters: openai.F(openai.FunctionParameters{
                "type": "object",
                "properties": map[string]interface{}{
                    "location": map[string]interface{}{
                        "type": "string",
                        "description": "城市名称",
                    },
                },
                "required": []string{"location"},
            }),
        }),
    },
}

// 请求
completion, err := client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
    Model: openai.ChatModel("gpt-4"),
    Messages: messages,
    Tools: openai.F(tools),
})

// 检查是否需要调用工具
if completion.Choices[0].Message.ToolCalls != nil {
    for _, toolCall := range completion.Choices[0].Message.ToolCalls {
        // 执行工具
        result := executeFunction(toolCall.Function.Name, toolCall.Function.Arguments)
        
        // 将结果添加到消息历史
        messages = append(messages, openai.ToolMessage(toolCall.ID, result))
    }
    
    // 再次请求生成最终答案
    finalCompletion, _ := client.Chat.Completions.New(ctx, ...)
}
```

## 前端支持

前端需要添加：
1. MCP工具开关
2. 显示工具调用过程
3. 工具调用结果展示

```typescript
// 在ChatPage中添加
const [useMCP, setUseMCP] = useState(false);
const [toolCalls, setToolCalls] = useState<string[]>([]);

// 发送请求时
body: JSON.stringify({
  messages: [...messages],
  use_mcp: useMCP,
})

// 显示工具调用
{toolCalls.length > 0 && (
  <div className="tool-calls-info">
    <Tag icon={<ToolOutlined />}>
      调用工具: {toolCalls.join(', ')}
    </Tag>
  </div>
)}
```

## 实现优先级

### 🎯 第一阶段（最小可用）
1. ✅ 基础对话功能（已完成）
2. ⬜ 支持1-2个简单工具（如calculator）
3. ⬜ 非流式模式下的工具调用

### 🚀 第二阶段（功能完善）
1. ⬜ 支持所有MCP工具
2. ⬜ 自动工具转换
3. ⬜ 多轮工具调用

### 🌟 第三阶段（高级特性）
1. ⬜ 流式模式下的工具调用
2. ⬜ 工具调用可视化
3. ⬜ 工具调用历史记录

## 注意事项

1. **OpenAI Go SDK v3 API**
   - 需要仔细查阅最新文档
   - Function calling的API可能与v2不同
   - 注意类型定义和参数传递

2. **MCP工具Schema转换**
   - MCP使用JSON Schema
   - OpenAI也使用JSON Schema
   - 但具体格式可能有差异，需要适配

3. **错误处理**
   - 工具执行可能失败
   - 需要优雅降级
   - 记录工具调用日志

4. **性能考虑**
   - 每次工具调用都需要额外的API请求
   - 可能显著增加响应时间
   - 考虑缓存和并发优化

5. **安全性**
   - danger_sql等工具需要权限控制
   - 验证工具参数
   - 记录审计日志

## 下一步行动

建议按以下顺序实现：

1. **验证OpenAI SDK的function calling API**
   ```bash
   # 查看OpenAI Go SDK v3文档
   go doc github.com/openai/openai-go/v3
   ```

2. **创建简单的测试用例**
   - 只支持calculator工具
   - 测试基本流程

3. **逐步扩展**
   - 添加更多工具支持
   - 优化错误处理
   - 添加前端展示

4. **文档和示例**
   - 记录工具使用方法
   - 提供示例对话
   - 编写测试用例

## 参考资源

- [OpenAI Function Calling文档](https://platform.openai.com/docs/guides/function-calling)
- [MCP Go SDK](https://github.com/mark3labs/mcp-go)
- [OpenAI Go SDK v3](https://github.com/openai/openai-go)

---

如果您需要我帮您实现具体的某个部分，请告诉我！

