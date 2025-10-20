# MCP参数传递调试指南

## 🔍 问题分析

从日志看到：
```
执行MCP工具: get_user_info, 参数: map[]  ← 空的！
```

这说明 OpenAI 返回的 `toolCall.Function.Arguments` 可能是空字符串或格式不对。

## 🐛 已添加的调试日志

现在代码会输出：
1. `AI决定调用工具: xxx, 参数(原始): {...}` - OpenAI返回的原始JSON
2. `解析后的参数: map[...]` - 解析后的参数
3. `执行MCP工具: xxx, 参数: map[...]` - 实际传递给MCP的参数

## 🧪 测试步骤

### 1. 重启后端服务
```bash
cd uniauth-gf
make run
```

### 2. 测试简单工具调用

发送消息：
```
用计算器帮我算 100 + 200
```

**预期日志**：
```
AI决定调用工具: calculate, 参数(原始): {"operation":"add","x":100,"y":200}
解析后的参数: map[operation:add x:100 y:200]
执行MCP工具: calculate, 参数: map[operation:add x:100 y:200]
MCP工具 calculate 执行成功，结果长度: 3
```

### 3. 查看实际日志

如果看到：
```
参数(原始): ""  或  参数(原始): {}
```

说明是以下几种可能：

#### 可能性1：模型不支持Function Calling

**检查**：您使用的模型是 `Qwen3-VL-235B-A22B-Instruct`

**解决方案**：
- 确认该模型支持function calling
- 或者换一个确定支持的模型：
  ```yaml
  openai:
    model: "gpt-3.5-turbo"  # 或 gpt-4
  ```

#### 可能性2：工具Schema格式问题

**检查工具定义**：
```bash
# 访问Swagger查看工具定义
open http://localhost:8000/swagger
```

或者添加临时调试代码：
```go
// 在 mcp_adapter.go 的 ConvertToOpenAITools() 中
for _, tool := range mcpTools {
    g.Log().Infof(ctx, "工具: %s, Schema: %+v", tool.Name, tool.InputSchema)
    // ...
}
```

#### 可能性3：OpenAI返回的格式与预期不同

**添加调试**：
```go
// 在 mcp_agent.go 中
choice := completion.Choices[0]

// 添加这些日志
g.Log().Infof(ctx, "FinishReason: %s", choice.FinishReason)
g.Log().Infof(ctx, "ToolCalls数量: %d", len(choice.Message.ToolCalls))
if len(choice.Message.ToolCalls) > 0 {
    g.Log().Infof(ctx, "第一个ToolCall: %+v", choice.Message.ToolCalls[0])
}
```

## 🛠️ 临时解决方案

如果参数始终为空，可以先硬编码测试：

```go
// 临时测试代码
if toolCall.Function.Name == "calculate" && len(arguments) == 0 {
    // 硬编码测试参数
    arguments = map[string]interface{}{
        "operation": "add",
        "x": 100.0,
        "y": 200.0,
    }
    g.Log().Warn(ctx, "使用硬编码测试参数")
}
```

## 📝 完整的测试对话示例

### 测试1：计算器（最简单）
```
用户: "100 加 200 等于多少？"
或: "帮我算一下 100 + 200"
或: "calculate 100 plus 200"
```

AI应该识别为需要调用calculator工具。

### 测试2：用户查询（需要参数）
```
用户: "查询 john@cuhk.edu.cn 的信息"
```

AI应该调用 get_user_info，并传递 `{upn: "john@cuhk.edu.cn"}`

### 测试3：多步骤
```
用户: "先算 10+20，然后用结果乘以3"
```

AI应该：
1. 调用 calculate(add, 10, 20) → 30
2. 调用 calculate(multiply, 30, 3) → 90

## 🔧 检查清单

- [ ] 后端编译成功
- [ ] MCP Server启动成功（日志显示7个工具）
- [ ] OpenAI API配置正确
- [ ] 模型支持Function Calling
- [ ] 前端MCP开关已开启
- [ ] 查看后端日志的参数输出

## 💡 如果参数传递正常

日志应该显示：
```
AI决定调用工具: calculate, 参数(原始): {"operation":"add","x":100,"y":200}
解析后的参数: map[operation:add x:100 y:200]
执行MCP工具: calculate, 参数: map[operation:add x:100 y:200]
MCP工具 calculate 执行成功，结果长度: 3
```

然后AI会根据结果生成自然语言回答。

## 📞 如果还有问题

请提供：
1. 完整的后端日志（从发起请求到返回）
2. 您发送的具体问题
3. 使用的模型名称

我会帮您进一步诊断！

---

## 🎯 关于滚动问题

已修复：
- ✅ 添加了 `min-height: 0` 允许flex子元素缩小
- ✅ Card body设置 `padding: 0`
- ✅ 对话区域独立滚动

**刷新页面即可生效！**

