import {
  DeleteOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import { Avatar, Button, Card, Input, message, Space, Spin } from "antd";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import "./style.less";

const { TextArea } = Input;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
}

const ChatPage: React.FC = () => {
  const intl = useIntl();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolCalls, setToolCalls] = useState<
    Array<{ tool: string; args: string }>
  >([]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // 流式对话请求（MCP工具支持）
  const sendStreamMessage = async (userMessage: string) => {
    try {
      // 先添加用户消息
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, id: `user-${Date.now()}` },
      ]);
      setStreamingContent("");
      setToolCalls([]); // 清空工具调用记录

      // 使用MCP流式接口
      const response = await fetch("/api/chat/mcp/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error(
          intl.formatMessage({ id: "pages.chat.error.requestFailed" }),
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let buffer = ""; // 添加缓冲区处理不完整的数据

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
                if (accumulatedContent) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: accumulatedContent,
                      id: `assistant-${Date.now()}`,
                    },
                  ]);
                }
                setStreamingContent("");
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                // 处理MCP工具调用信息
                if (parsed.type === "tool_call") {
                  setToolCalls((prev) => [
                    ...prev,
                    { tool: parsed.tool_name, args: parsed.arguments },
                  ]);
                  message.info(
                    intl.formatMessage(
                      { id: "pages.chat.tool.calling" },
                      { tool: parsed.tool_name },
                    ),
                  );
                } else if (parsed.type === "tool_result") {
                  message.success(
                    intl.formatMessage(
                      { id: "pages.chat.tool.completed" },
                      { tool: parsed.tool },
                    ),
                  );
                } else if (parsed.content) {
                  // 正常的对话内容
                  accumulatedContent += parsed.content;
                  setStreamingContent(accumulatedContent);
                } else if (parsed.error) {
                  message.error(parsed.error);
                  break;
                }
              } catch (e) {
                console.error("解析SSE数据失败:", e);
              }
            }
          }
        }

        // 如果流结束时还有内容但没收到[DONE]，也要添加到消息
        if (accumulatedContent && streamingContent) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: accumulatedContent,
              id: `assistant-${Date.now()}`,
            },
          ]);
          setStreamingContent("");
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
    setToolCalls([]);
    message.success(intl.formatMessage({ id: "pages.chat.cleared" }));
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
        {/* MCP工具调用信息 */}
        {toolCalls.length > 0 && (
          <div
            style={{
              padding: "8px 16px",
              background: "#f0f0f0",
              borderBottom: "1px solid #d9d9d9",
            }}
          >
            <Space size="small">
              <span style={{ fontSize: "12px", color: "#666" }}>
                {intl.formatMessage({ id: "pages.chat.tool.label" })}:
              </span>
              {toolCalls.map((tc, idx) => (
                <span
                  key={`${tc.tool}-${idx}`}
                  style={{
                    fontSize: "12px",
                    background: "#1890ff",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {tc.tool}
                </span>
              ))}
            </Space>
          </div>
        )}

        <div className="chat-messages">
          {messages.map((msg) => (
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
                  backgroundColor: msg.role === "user" ? "#1890ff" : "#52c41a",
                }}
              />
              <div className="message-content">
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
          ))}

          {/* 流式返回时显示正在输入的内容 */}
          {loading && streamingContent && (
            <div className="message-item assistant-message">
              <Avatar
                icon={<RobotOutlined />}
                className="message-avatar"
                style={{ backgroundColor: "#52c41a" }}
              />
              <div className="message-content">
                <div className="message-text">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* 普通模式加载状态 */}
          {loading && !streamingContent && (
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
    </PageContainer>
  );
};

export default ChatPage;
