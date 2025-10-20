# 快速修复指南

## ✅ 已修复的问题

### 1. 滚动问题 - 完全重写样式

**修改文件**：`uniauth-admin/src/pages/ChatPage/style.less`

**关键改动**：
```less
:global {
  .chat-page-card {
    height: calc(100vh - 250px) !important;  // Card本身设置高度
    
    .ant-card-body {
      flex: 1 !important;
      overflow: hidden !important;  // Card body禁止滚动
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: scroll !important;  // 只有消息区域滚动
  height: 0;  // 强制触发滚动
}
```

**测试**：刷新页面，发送多条消息，应该只有对话区域滚动

### 2. 参数传递调试 - 超详细日志

**修改文件**：`uniauth-gf/internal/service/chat/mcp_agent.go`

**添加的日志**：
```go
Choice FinishReason: ...
Choice Message Content: ...
ToolCalls 数量: ...
=== ToolCall 详情 ===
  ID: ...
  Type: ...
  Function.Name: ...
  Function.Arguments (原始字符串): ...
  Function.Arguments 长度: ...
解析后的参数: ...
```

## 🧪 测试步骤

### 第1步：重启后端
```bash
cd uniauth-gf
make run
```

### 第2步：测试计算器（最简单）
```
开启MCP开关
发送: "100加200等于多少？"
或: "用计算器算 100 + 200"
```

### 第3步：查看日志

#### 如果参数正常：
```
Choice FinishReason: tool_calls
ToolCalls 数量: 1
=== ToolCall 详情 ===
  Function.Name: calculate
  Function.Arguments (原始字符串): {"operation":"add","x":100,"y":200}
  Function.Arguments 长度: 39
解析后的参数: map[operation:add x:100 y:200]
执行MCP工具: calculate, 参数: map[operation:add x:100 y:200]
```

#### 如果参数为空：
```
Function.Arguments (原始字符串): 
Function.Arguments 长度: 0
解析后的参数: map[]
```

这说明**模型没有生成参数**！

## 🔧 如果参数仍为空的解决方案

### 方案A：检查模型能力

Qwen3-VL可能主要是视觉模型，function calling支持可能有限。

**测试**：临时换成确定支持的模型
```yaml
# config.yaml
openai:
  model: "gpt-3.5-turbo"  # 或任何明确支持function calling的模型
```

### 方案B：检查工具Schema

添加临时日志查看传递给OpenAI的工具定义：

```go
// 在 mcp_agent.go 的 Chat() 方法中
tools := a.mcpAdapter.ConvertToOpenAITools()
g.Log().Infof(ctx, "传递给OpenAI的工具数量: %d", len(tools))
for i, tool := range tools {
    g.Log().Infof(ctx, "工具[%d]: %+v", i, tool)
}
```

### 方案C：简化提示词

可能模型需要更明确的指示。添加系统提示：

```go
// 在发送请求前，添加系统提示
systemPrompt := openai.SystemMessage(
    "你是一个helpful助手。当用户需要计算时，使用calculate工具。当需要查询用户信息时，使用get_user_info工具。"
)
messages = append([]openai.ChatCompletionMessageParamUnion{systemPrompt}, messages...)
```

### 方案D：使用tool_choice强制调用

```go
params := openai.ChatCompletionNewParams{
    Model:    openai.ChatModel(model),
    Messages: messages,
    Tools:    a.mcpAdapter.ConvertToOpenAITools(),
    // ToolChoice: "auto",  // 强制使用工具
}
```

## 📊 滚动修复验证

刷新页面后：

1. 发送10+条消息
2. 对话区域应该出现滚动条
3. 滚动时：
   - ✅ 对话区域内容上下移动
   - ✅ 页面主体保持不动
   - ✅ 输入框始终在底部可见

如果还不行，检查浏览器Console是否有CSS错误。

## 🎯 预期结果

### 正常的MCP对话流程

```
用户: "用计算器算 100 + 200"
  ↓
后端日志:
  MCP Agent开始处理，可用工具: [calculate ...]
  MCP Agent第 1 轮对话
  Choice FinishReason: tool_calls
  ToolCalls 数量: 1
  Function.Name: calculate
  Function.Arguments: {"operation":"add","x":100,"y":200}
  解析后的参数: map[operation:add x:100 y:200]
  MCP工具 calculate 执行成功
  MCP Agent第 2 轮对话
  Choice FinishReason: stop
  ToolCalls 数量: 0
  MCP Agent完成
  ↓
前端显示:
  [顶部] 工具调用: calculate
  [对话] AI: "100加200等于300"
```

## 🚨 如果看到循环调用

```
执行MCP工具: get_user_info, 参数: map[]
工具执行失败: ...
执行MCP工具: get_user_info, 参数: map[]  ← 重复
...
达到最大对话轮次 5
```

这说明：
1. AI决定调用工具
2. 但没有生成参数
3. 工具执行失败
4. AI又尝试调用（但仍无参数）
5. 进入死循环

**解决**：需要查看为什么Arguments为空

---

## 📝 下一步

请重启后端，发送简单的测试消息，然后把**完整的后端日志**发给我，包括：
- Choice FinishReason
- ToolCalls 数量
- Function.Arguments 的具体内容

这样我能准确诊断问题！

