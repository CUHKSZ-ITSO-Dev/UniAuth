import {
  DeleteOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import {
  Avatar,
  Button,
  Card,
  Input,
  message,
  Space,
  Spin,
  Switch,
} from "antd";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [useStream, setUseStream] = useState(true); // 默认使用流式
  const [useMCP, setUseMCP] = useState(false); // 是否使用MCP工具
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

  // 普通对话请求
  const sendNormalMessage = async (userMessage: string) => {
    try {
      const apiPath = useMCP ? "/api/chat/mcp" : "/api/chat/";
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const data = await response.json();

      if (data.code === 0 && data.data) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: userMessage, id: `user-${Date.now()}` },
          {
            role: "assistant",
            content: data.data.content,
            id: `assistant-${Date.now()}`,
          },
        ]);
      } else {
        message.error(data.message || "请求失败");
      }
    } catch (_error) {
      message.error("发送消息失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 流式对话请求
  const sendStreamMessage = async (userMessage: string) => {
    try {
      // 先添加用户消息
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, id: `user-${Date.now()}` },
      ]);
      setStreamingContent("");
      setToolCalls([]); // 清空工具调用记录

      const apiPath = useMCP ? "/api/chat/mcp/stream" : "/api/chat/stream";
      const response = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error("请求失败");
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
                  message.info(`正在调用工具: ${parsed.tool_name}`);
                } else if (parsed.type === "tool_result") {
                  message.success(`工具 ${parsed.tool} 执行完成`);
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
      message.error("发送消息失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) {
      message.warning("请输入消息内容");
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setLoading(true);

    if (useStream) {
      await sendStreamMessage(userMessage);
    } else {
      await sendNormalMessage(userMessage);
    }
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
    setStreamingContent("");
    setToolCalls([]);
    message.success("对话已清空");
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
      title="AI 对话助手"
      extra={[
        <Space key="actions" size="large">
          <Space>
            <span>流式返回:</span>
            <Switch checked={useStream} onChange={setUseStream} />
          </Space>
          <Space>
            <span>MCP工具:</span>
            <Switch checked={useMCP} onChange={setUseMCP} />
          </Space>
          <Button danger icon={<DeleteOutlined />} onClick={handleClear}>
            清空对话
          </Button>
        </Space>,
      ]}
    >
      <Card className="chat-container">
        {/* MCP工具调用信息 */}
        {useMCP && toolCalls.length > 0 && (
          <div
            style={{
              padding: "8px 16px",
              background: "#f0f0f0",
              borderBottom: "1px solid #d9d9d9",
            }}
          >
            <Space size="small">
              <span style={{ fontSize: "12px", color: "#666" }}>工具调用:</span>
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
                <span style={{ marginLeft: 8 }}>正在思考...</span>
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
            placeholder="输入消息... (Enter发送, Shift+Enter换行)"
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
            发送
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ChatPage;
