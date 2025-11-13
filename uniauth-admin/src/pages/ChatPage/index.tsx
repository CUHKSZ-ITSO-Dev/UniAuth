import {
  DeleteOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import { Avatar, Button, Card, Input, Modal, message, Space, Spin } from "antd";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import "./style.less";

const { TextArea } = Input;

interface Message {
  role: "user" | "assistant" | "system" | "tool_call" | "tool_result";
  content: string;
  id: string;
  toolName?: string; // 工具名称
  toolArgs?: string; // 工具参数
  reasoning?: string; // 思考链内容（用于o1等思考模型）
}

const ChatPage: React.FC = () => {
  const intl = useIntl();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState(""); // 思考链内容
  const [pendingConfirm, setPendingConfirm] = useState<{
    toolName: string;
    arguments: string;
    toolId: string; // 保存原始的 tool_id
    savedContext: string; // 保存的完整消息历史
    userMessage: string;
  } | null>(null);
  // 使用 ref 跟踪已添加的工具调用，避免状态更新时序问题
  const addedToolCallsRef = useRef<Set<string>>(new Set());
  // 单次提问中已允许的工具列表（每次新提问清空）
  const [sessionAllowedTools, setSessionAllowedTools] = useState<string[]>([]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, streamingReasoning]);

  // 流式对话请求（MCP工具支持）
  const sendStreamMessage = async (
    userMessage: string,
    isRetry = false,
    pendingToolCall?: {
      tool_id: string;
      tool_name: string;
      arguments: string;
      saved_context?: string;
    },
  ) => {
    try {
      // 先添加用户消息（非重试时）
      if (!isRetry) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: userMessage, id: `user-${Date.now()}` },
        ]);
        // 每次新请求清空工具调用追踪和单次会话允许列表（重试时不清空）
        addedToolCallsRef.current.clear();
        setSessionAllowedTools([]);
      }
      setStreamingContent("");

      // 使用MCP流式接口
      const requestBody: any = {
        messages: isRetry
          ? messages
          : [...messages, { role: "user", content: userMessage }],
      };

      // 发送单次会话已允许的工具列表
      if (sessionAllowedTools.length > 0) {
        requestBody.session_allowed_tools = sessionAllowedTools;
      }

      // 如果有待执行的工具调用，直接发送（不重新让AI决策）
      if (pendingToolCall) {
        requestBody.pending_tool_call = pendingToolCall;
        // 如果有保存的上下文，也一起发送（恢复完整的消息历史）
        if (pendingToolCall.saved_context) {
          requestBody.saved_context = pendingToolCall.saved_context;
        }
      }

      const response = await fetch("/chat/mcp/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          intl.formatMessage({ id: "pages.chat.error.requestFailed" }),
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let accumulatedReasoning = ""; // 累积的思考链内容
      let buffer = ""; // 添加缓冲区处理不完整的数据
      let receivedDone = false; // 标记是否收到 [DONE]

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解码新数据并添加到缓冲区
          buffer += decoder.decode(value, { stream: true });

          // 处理缓冲区中的完整消息
          const lines = buffer.split("\n");
          // 保留最后一个不完整的行
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === "") continue;

            // 忽略SSE注释行（以冒号开头）
            if (trimmedLine.startsWith(":")) continue;

            if (trimmedLine.startsWith("data: ")) {
              const data = trimmedLine.slice(6).trim();

              if (data === "[DONE]") {
                // 流式结束，将累积的内容添加到消息列表
                receivedDone = true;
                if (accumulatedContent || accumulatedReasoning) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: accumulatedContent,
                      id: `assistant-${Date.now()}`,
                      ...(accumulatedReasoning && {
                        reasoning: accumulatedReasoning,
                      }),
                    } as Message,
                  ]);
                }
                setStreamingContent("");
                setStreamingReasoning("");
                break; // [DONE]表示流真正结束，跳出for循环
              }

              try {
                const parsed = JSON.parse(data);

                // 处理MCP工具调用信息
                if (parsed.type === "tool_call") {
                  // 使用 tool_id 作为唯一标识，每个工具调用都有独立的ID
                  const toolKey = parsed.tool_id;

                  if (!toolKey) {
                    console.error("[tool_call] 缺少 tool_id:", parsed);
                    return;
                  }

                  // 使用 ref 检查是否已添加，避免状态更新时序问题
                  if (!addedToolCallsRef.current.has(toolKey)) {
                    addedToolCallsRef.current.add(toolKey);
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "tool_call",
                        content: parsed.tool_name,
                        toolName: parsed.tool_name,
                        toolArgs: parsed.arguments,
                        id: `tool-call-${parsed.tool_id}`,
                      },
                    ]);
                  }
                } else if (parsed.type === "tool_confirm_required") {
                  // 需要用户确认工具执行
                  const toolKey = parsed.tool_id;

                  if (!toolKey) {
                    console.error(
                      "[tool_confirm_required] 缺少 tool_id:",
                      parsed,
                    );
                    return;
                  }

                  // 使用 ref 检查是否已添加
                  if (!addedToolCallsRef.current.has(toolKey)) {
                    addedToolCallsRef.current.add(toolKey);
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "tool_call",
                        content: parsed.tool_name,
                        toolName: parsed.tool_name,
                        toolArgs: parsed.arguments,
                        id: `tool-call-${parsed.tool_id}`,
                      },
                    ]);
                  }

                  setLoading(false); // 停止loading状态
                  setPendingConfirm({
                    toolName: parsed.tool_name,
                    arguments: parsed.arguments,
                    toolId: parsed.tool_id, // 保存第一次的 tool_id
                    savedContext: parsed.saved_context || "", // 保存完整的消息历史
                    userMessage: userMessage,
                  });
                  // 流应该结束了（后端发送了[DONE]），等待用户确认
                  break; // 跳出循环，停止处理后续事件
                } else if (parsed.type === "tool_result") {
                  const toolId = `tool-result-${parsed.tool_id}`;

                  setMessages((prev) => {
                    // 检查是否已存在（处理React严格模式的重复渲染）
                    if (prev.some((msg) => msg.id === toolId)) {
                      return prev;
                    }
                    return [
                      ...prev,
                      {
                        role: "tool_result",
                        content: parsed.result,
                        toolName: parsed.tool,
                        id: toolId,
                      },
                    ];
                  });
                } else if (parsed.content || parsed.reasoning) {
                  // 正常的对话内容
                  if (parsed.content) {
                    accumulatedContent += parsed.content;
                    setStreamingContent(accumulatedContent);
                  }
                  // 思考链内容（o1等思考模型）
                  if (parsed.reasoning) {
                    accumulatedReasoning += parsed.reasoning;
                    setStreamingReasoning(accumulatedReasoning);
                  }
                } else if (parsed.error) {
                  message.error(parsed.error);
                  break;
                }
              } catch (_e) {
                // 忽略解析失败的事件
              }
            }
          }
        }

        // 如果流结束时还有内容但没收到[DONE]（异常情况），也要添加到消息
        // 使用 receivedDone 标志避免重复添加
        if (!receivedDone && (accumulatedContent || accumulatedReasoning)) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: accumulatedContent,
              id: `assistant-${Date.now()}`,
              ...(accumulatedReasoning && { reasoning: accumulatedReasoning }),
            } as Message,
          ]);
          setStreamingContent("");
          setStreamingReasoning("");
        }
      }
    } catch (_error) {
      message.error(intl.formatMessage({ id: "pages.chat.error.sendFailed" }));
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) {
      message.warning(intl.formatMessage({ id: "pages.chat.input.required" }));
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setLoading(true);

    await sendStreamMessage(userMessage);
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
    setStreamingContent("");
    setPendingConfirm(null);
    addedToolCallsRef.current.clear(); // 清空工具调用追踪
    message.success(intl.formatMessage({ id: "pages.chat.cleared" }));
  };

  // 处理工具确认
  const handleToolConfirm = async (allow: boolean) => {
    if (!pendingConfirm) return;

    if (allow) {
      // 用户允许，将工具添加到单次会话允许列表
      setSessionAllowedTools((prev) => {
        if (!prev.includes(pendingConfirm.toolName)) {
          return [...prev, pendingConfirm.toolName];
        }
        return prev;
      });

      // 发送待执行的工具调用信息（不重新让AI决策）
      const toolCallInfo = {
        tool_id: pendingConfirm.toolId,
        tool_name: pendingConfirm.toolName,
        arguments: pendingConfirm.arguments,
        saved_context: pendingConfirm.savedContext, // 包含保存的上下文
      };

      setPendingConfirm(null);
      setLoading(true);

      // 重新发起请求，带上待执行的工具调用信息和保存的上下文
      await sendStreamMessage(pendingConfirm.userMessage, true, toolCallInfo);
    } else {
      // 用户拒绝，显示拒绝消息
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: intl.formatMessage(
            { id: "pages.chat.tool.rejected" },
            { tool: pendingConfirm.toolName },
          ),
          id: `assistant-${Date.now()}`,
        },
      ]);
      setPendingConfirm(null);
      setLoading(false);
    }
  };

  // 按Enter发送，Shift+Enter换行
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageContainer
      title={intl.formatMessage({ id: "pages.chat.title" })}
      extra={[
        <Button
          key="clear"
          danger
          icon={<DeleteOutlined />}
          onClick={handleClear}
        >
          {intl.formatMessage({ id: "pages.chat.button.clear" })}
        </Button>,
      ]}
    >
      <Card className="chat-container">
        <div className="chat-messages">
          {messages.map((msg) => {
            // 工具调用消息
            if (msg.role === "tool_call") {
              return (
                <div key={msg.id} className="message-item tool-call-message">
                  <div className="tool-call-content">
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Space>
                        <span className="tool-icon">🔧</span>
                        <span>
                          {intl.formatMessage(
                            { id: "pages.chat.tool.calling" },
                            { tool: msg.toolName },
                          )}
                        </span>
                      </Space>
                      {msg.toolArgs && (
                        <details style={{ marginLeft: "24px" }}>
                          <summary
                            style={{
                              cursor: "pointer",
                              color: "#666",
                              fontSize: "12px",
                            }}
                          >
                            {intl.formatMessage({
                              id: "pages.chat.tool.params.view",
                            })}
                          </summary>
                          <pre
                            style={{
                              background: "#f5f5f5",
                              padding: "8px",
                              borderRadius: "4px",
                              marginTop: "4px",
                              fontSize: "12px",
                              maxHeight: "150px",
                              overflow: "auto",
                            }}
                          >
                            {msg.toolArgs}
                          </pre>
                        </details>
                      )}
                    </Space>
                  </div>
                </div>
              );
            }

            // 工具结果消息
            if (msg.role === "tool_result") {
              return (
                <div key={msg.id} className="message-item tool-result-message">
                  <div className="tool-result-content">
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Space>
                        <span className="tool-icon">✅</span>
                        <span>
                          {intl.formatMessage(
                            { id: "pages.chat.tool.completed" },
                            { tool: msg.toolName },
                          )}
                        </span>
                      </Space>
                      <details>
                        <summary style={{ cursor: "pointer", color: "#666" }}>
                          {intl.formatMessage({
                            id: "pages.chat.tool.result.view",
                          })}
                        </summary>
                        <pre
                          style={{
                            background: "#f5f5f5",
                            padding: "8px",
                            borderRadius: "4px",
                            maxHeight: "200px",
                            overflow: "auto",
                            fontSize: "12px",
                          }}
                        >
                          {msg.content}
                        </pre>
                      </details>
                    </Space>
                  </div>
                </div>
              );
            }

            // 普通用户/助手消息
            return (
              <div
                key={msg.id}
                className={`message-item ${msg.role === "user" ? "user-message" : "assistant-message"}`}
              >
                <Avatar
                  icon={
                    msg.role === "user" ? <UserOutlined /> : <RobotOutlined />
                  }
                  className="message-avatar"
                  style={{
                    backgroundColor:
                      msg.role === "user" ? "#1890ff" : "#52c41a",
                  }}
                />
                <div className="message-content">
                  {/* 显示思考链（如果有） */}
                  {msg.role === "assistant" && msg.reasoning && (
                    <details className="reasoning-section">
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "#666",
                          marginBottom: "8px",
                        }}
                      >
                        💭{" "}
                        {intl.formatMessage({
                          id: "pages.chat.reasoning.view",
                        })}
                      </summary>
                      <div className="reasoning-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {msg.reasoning}
                        </ReactMarkdown>
                      </div>
                    </details>
                  )}
                  <div className="message-text">
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 流式返回时显示正在输入的内容 */}
          {loading && (streamingContent || streamingReasoning) && (
            <div className="message-item assistant-message">
              <Avatar
                icon={<RobotOutlined />}
                className="message-avatar"
                style={{ backgroundColor: "#52c41a" }}
              />
              <div className="message-content">
                {/* 思考链（流式） */}
                {streamingReasoning && (
                  <details className="reasoning-section" open>
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "#666",
                        marginBottom: "8px",
                      }}
                    >
                      💭{" "}
                      {intl.formatMessage({
                        id: "pages.chat.reasoning.thinking",
                      })}
                    </summary>
                    <div className="reasoning-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {streamingReasoning}
                      </ReactMarkdown>
                    </div>
                  </details>
                )}
                {/* 正常内容 */}
                {streamingContent && (
                  <div className="message-text">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 普通模式加载状态 */}
          {loading && !streamingContent && !streamingReasoning && (
            <div className="message-item assistant-message">
              <Avatar
                icon={<RobotOutlined />}
                className="message-avatar"
                style={{ backgroundColor: "#52c41a" }}
              />
              <div className="message-content">
                <Spin size="small" />
                <span style={{ marginLeft: 8 }}>
                  {intl.formatMessage({ id: "pages.chat.thinking" })}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={intl.formatMessage({
              id: "pages.chat.input.placeholder",
            })}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputValue.trim()}
            style={{ marginLeft: 8 }}
          >
            {intl.formatMessage({ id: "pages.chat.button.send" })}
          </Button>
        </div>
      </Card>

      {/* 工具确认对话框 */}
      <Modal
        title={intl.formatMessage({ id: "pages.chat.tool.confirm.title" })}
        open={!!pendingConfirm}
        onOk={() => handleToolConfirm(true)}
        onCancel={() => handleToolConfirm(false)}
        okText={intl.formatMessage({ id: "pages.chat.tool.confirm.allow" })}
        cancelText={intl.formatMessage({ id: "pages.chat.tool.confirm.deny" })}
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <p>
            {intl.formatMessage(
              { id: "pages.chat.tool.confirm.message" },
              { tool: pendingConfirm?.toolName },
            )}
          </p>
          <div
            style={{
              background: "#f5f5f5",
              padding: "12px",
              borderRadius: "4px",
            }}
          >
            <strong>
              {intl.formatMessage({ id: "pages.chat.tool.confirm.params" })}:
            </strong>
            <pre
              style={{
                margin: "8px 0 0 0",
                fontSize: "12px",
                whiteSpace: "pre-wrap",
              }}
            >
              {pendingConfirm?.arguments}
            </pre>
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default ChatPage;
