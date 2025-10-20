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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingContent, setStreamingContent] = useState("");

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
      const response = await fetch("/api/chat/", {
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
    } catch (error) {
      console.error("发送消息失败:", error);
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

      const response = await fetch("/api/chat/stream", {
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

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                // 流式结束，将累积的内容添加到消息列表
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: accumulatedContent,
                    id: `assistant-${Date.now()}`,
                  },
                ]);
                setStreamingContent("");
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
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
      }
    } catch (error) {
      console.error("发送流式消息失败:", error);
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
        <Space key="actions">
          <span>流式返回:</span>
          <Switch checked={useStream} onChange={setUseStream} />
          <Button danger icon={<DeleteOutlined />} onClick={handleClear}>
            清空对话
          </Button>
        </Space>,
      ]}
    >
      <Card className="chat-container">
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
                <div className="message-text">{msg.content}</div>
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
                <div className="message-text">{streamingContent}</div>
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
