import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { Button, Input, Modal, message, Space } from "antd";
import React, { useEffect, useRef, useState } from "react";
import type { ThemeKeys } from "react-json-view";
import ReactJson from "react-json-view";

export interface JsonEditorProps {
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  readOnly?: boolean;
  theme?: ThemeKeys;
  height?: number | string;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  theme = "rjv-default",
  height = 300,
}) => {
  const intl = useIntl();
  const [jsonString, setJsonString] = useState<string>("");
  const [jsonObject, setJsonObject] = useState<any>(null);
  const [editMode, setEditMode] = useState<"json" | "tree">("json");
  const [error, setError] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16); // 默认字体大小
  const editorRef = useRef<HTMLDivElement>(null);

  // 初始化组件状态
  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (typeof value === "string") {
        setJsonString(value);
        try {
          const parsed = JSON.parse(value);
          setJsonObject(parsed);
          setError("");
        } catch (e: any) {
          setJsonObject(value);
          setError(
            `${intl.formatMessage({ id: "component.jsonEditor.invalidValue" })}: ${e.message || e}`,
          );
        }
      } else {
        setJsonObject(value);
        try {
          setJsonString(JSON.stringify(value)); // 不自动格式化
          setError("");
        } catch (e: any) {
          setJsonString(String(value));
          setError(
            `${intl.formatMessage({ id: "component.jsonEditor.invalidValue" })}: ${e.message || e}`,
          );
        }
      }
    } else {
      setJsonString("");
      setJsonObject(null);
    }
  }, [value, intl]);

  // 处理鼠标滚轮事件，支持Ctrl+滚轮调整字体大小（无限制）
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      setFontSize((prev) => prev + delta);
    }
  };

  // 添加滚轮事件监听器
  useEffect(() => {
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener("wheel", handleWheel as any, {
        passive: false,
      });
      return () => {
        editorElement.removeEventListener("wheel", handleWheel as any);
      };
    }
    return undefined;
  }, []);

  // 添加全屏模式下的滚轮事件监听器
  useEffect(() => {
    // 只在全屏模式下添加事件监听器
    if (isFullscreen) {
      const handleFullscreenWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -1 : 1;
          setFontSize((prev) => prev + delta);
        }
      };

      // 添加事件监听器到document上，因为全屏模式下可能无法直接获取到容器元素
      document.addEventListener("wheel", handleFullscreenWheel as any, {
        passive: false,
      });

      return () => {
        document.removeEventListener("wheel", handleFullscreenWheel as any);
      };
    }
    return undefined;
  }, [isFullscreen]);

  // 处理JSON字符串变化
  const handleJsonStringChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newJsonString = e.target.value;
    setJsonString(newJsonString);

    try {
      if (newJsonString.trim() === "") {
        setJsonObject(null);
        setError("");
        onChange?.(null);
        return;
      }

      const parsed = JSON.parse(newJsonString);
      setJsonObject(parsed);
      setError("");
      onChange?.(newJsonString); // 传递原始字符串而不是格式化后的字符串
    } catch (e: any) {
      setError(
        `${intl.formatMessage({ id: "component.jsonEditor.invalidJson" })}: ${e.message || e}`,
      );
      // 即使JSON无效，也传递字符串值
      onChange?.(newJsonString);
    }
  };

  // 处理键盘事件，特别是Tab键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !readOnly) {
      e.preventDefault();

      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // 插入两个空格作为缩进
      const newText = `${jsonString.substring(0, start)}  ${jsonString.substring(end)}`;

      setJsonString(newText);

      // 更新光标位置
      setTimeout(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      }, 0);

      // 触发onChange事件
      try {
        if (newText.trim() === "") {
          setJsonObject(null);
          setError("");
          onChange?.(null);
          return;
        }

        const parsed = JSON.parse(newText);
        setJsonObject(parsed);
        setError("");
        onChange?.(newText);
      } catch (e: any) {
        setError(
          `${intl.formatMessage({ id: "component.jsonEditor.invalidJson" })}: ${e.message || e}`,
        );
        onChange?.(newText);
      }
    }
  };

  // 处理JSON对象变化（来自react-json-view）
  const handleJsonChange = (edit: any) => {
    if (readOnly) return;

    const newJsonObject = edit.updated_src;
    setJsonObject(newJsonObject);

    try {
      const newJsonString = JSON.stringify(newJsonObject); // 不自动格式化
      setJsonString(newJsonString);
      setError("");
      onChange?.(newJsonObject);
    } catch (e: any) {
      setError(
        `${intl.formatMessage({ id: "component.jsonEditor.invalidObject" })}: ${e.message || e}`,
      );
      onChange?.(value);
    }
  };

  // 切换编辑模式
  const toggleEditMode = () => {
    setEditMode(editMode === "json" ? "tree" : "json");
  };

  // 格式化JSON
  const formatJson = () => {
    if (jsonString.trim() === "") {
      return;
    }

    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      setJsonObject(parsed);
      setError("");
      onChange?.(formatted); // 通知父组件格式化后的值
    } catch (e: any) {
      message.error(
        `${intl.formatMessage({ id: "component.jsonEditor.formatFailed" })}: ${e.message || e}`,
      );
    }
  };

  // 压缩JSON
  const compactJson = () => {
    if (jsonString.trim() === "") {
      return;
    }

    try {
      const parsed = JSON.parse(jsonString);
      const compacted = JSON.stringify(parsed);
      setJsonString(compacted);
      setJsonObject(parsed);
      setError("");
      onChange?.(compacted); // 通知父组件压缩后的值
    } catch (e: any) {
      message.error(
        `${intl.formatMessage({ id: "component.jsonEditor.compactFailed" })}: ${e.message || e}`,
      );
    }
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 全屏模式下的JSON编辑器
  const renderFullscreenEditor = () => {
    return (
      <Modal
        open={isFullscreen}
        onCancel={() => setIsFullscreen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsFullscreen(false)}
            icon={<FullscreenExitOutlined />}
          >
            {intl.formatMessage({ id: "component.jsonEditor.exitFullscreen" })}
          </Button>,
        ]}
        width="90vw"
        style={{ top: 20 }}
        styles={{
          body: {
            height: "80vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        destroyOnClose
      >
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* 全屏模式下显示当前字体大小，允许手动修改 */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(0,0,0,0.05)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#666",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: "50px",
                fontSize: "12px",
                padding: "0 2px",
                backgroundColor: "transparent",
                borderColor: "transparent",
              }}
              min={1}
              step={1}
            />
            <span style={{ marginLeft: "2px" }}>px</span>
          </div>

          {!readOnly && (
            <div style={{ marginBottom: "12px" }}>
              <Space>
                <Button size="small" onClick={toggleEditMode}>
                  {editMode === "json"
                    ? intl.formatMessage({
                        id: "component.jsonEditor.switchToTree",
                      })
                    : intl.formatMessage({
                        id: "component.jsonEditor.switchToJson",
                      })}
                </Button>

                {editMode === "json" && (
                  <>
                    <Button size="small" onClick={formatJson}>
                      {intl.formatMessage({
                        id: "component.jsonEditor.format",
                      })}
                    </Button>
                    <Button size="small" onClick={compactJson}>
                      {intl.formatMessage({
                        id: "component.jsonEditor.compact",
                      })}
                    </Button>
                  </>
                )}
              </Space>
            </div>
          )}

          <div style={{ flex: 1, overflow: "hidden" }}>
            {editMode === "tree" ? (
              <div style={{ height: "100%", overflow: "auto" }}>
                {jsonObject !== null ? (
                  <ReactJson
                    src={jsonObject}
                    theme={theme}
                    onEdit={readOnly ? false : handleJsonChange}
                    onAdd={readOnly ? false : handleJsonChange}
                    onDelete={readOnly ? false : handleJsonChange}
                    enableClipboard={!readOnly}
                    displayDataTypes={!readOnly}
                    displayObjectSize={!readOnly}
                    name={false}
                    collapsed={false}
                    indentWidth={2}
                    style={{ padding: "10px", fontSize: `${fontSize}px` }}
                    key="tree-view-fullscreen"
                  />
                ) : (
                  <div
                    style={{
                      color: "#999",
                      fontStyle: "italic",
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    {placeholder ||
                      intl.formatMessage({ id: "component.jsonEditor.empty" })}
                  </div>
                )}
                {error && (
                  <div
                    style={{
                      color: "#ff4d4f",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Input.TextArea
                  value={jsonString}
                  onChange={handleJsonStringChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  readOnly={readOnly}
                  style={{
                    flex: 1,
                    fontFamily: "monospace",
                    fontSize: `${fontSize}px`,
                    backgroundColor: readOnly ? "#f5f5f5" : "inherit",
                  }}
                />
                {error && (
                  <div
                    style={{
                      color: "#ff4d4f",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div
      ref={editorRef}
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        padding: "12px",
        position: "relative",
      }}
    >
      {/* 显示当前字体大小，允许手动修改 */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "rgba(0,0,0,0.05)",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#666",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{
            width: "50px",
            fontSize: "12px",
            padding: "0 2px",
            backgroundColor: "transparent",
            borderColor: "transparent",
          }}
          min={1}
          step={1}
        />
        <span style={{ marginLeft: "2px" }}>px</span>
      </div>

      {!readOnly && (
        <div style={{ marginBottom: "12px" }}>
          <Space>
            <Button size="small" onClick={toggleEditMode}>
              {editMode === "json"
                ? intl.formatMessage({
                    id: "component.jsonEditor.switchToTree",
                  })
                : intl.formatMessage({
                    id: "component.jsonEditor.switchToJson",
                  })}
            </Button>

            {editMode === "json" && (
              <>
                <Button size="small" onClick={formatJson}>
                  {intl.formatMessage({ id: "component.jsonEditor.format" })}
                </Button>
                <Button size="small" onClick={compactJson}>
                  {intl.formatMessage({ id: "component.jsonEditor.compact" })}
                </Button>
                <Button
                  size="small"
                  onClick={toggleFullscreen}
                  icon={<FullscreenOutlined />}
                >
                  {intl.formatMessage({
                    id: "component.jsonEditor.fullscreen",
                  })}
                </Button>
              </>
            )}

            {editMode === "tree" && (
              <Button
                size="small"
                onClick={toggleFullscreen}
                icon={<FullscreenOutlined />}
              >
                {intl.formatMessage({ id: "component.jsonEditor.fullscreen" })}
              </Button>
            )}
          </Space>
        </div>
      )}

      {/* 渲染全屏编辑器 */}
      {renderFullscreenEditor()}

      {editMode === "tree" ? (
        <div>
          <div style={{ height: height || 300, overflow: "auto" }}>
            {jsonObject !== null ? (
              <ReactJson
                src={jsonObject}
                theme={theme}
                onEdit={readOnly ? false : handleJsonChange}
                onAdd={readOnly ? false : handleJsonChange}
                onDelete={readOnly ? false : handleJsonChange}
                enableClipboard={!readOnly}
                displayDataTypes={!readOnly}
                displayObjectSize={!readOnly}
                name={false}
                collapsed={false}
                indentWidth={2}
                style={{ padding: "10px", fontSize: `${fontSize}px` }}
                key="tree-view"
              />
            ) : (
              <div
                style={{
                  color: "#999",
                  fontStyle: "italic",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                {placeholder ||
                  intl.formatMessage({ id: "component.jsonEditor.empty" })}
              </div>
            )}
          </div>
          {error && (
            <div
              style={{ color: "#ff4d4f", marginTop: "4px", fontSize: "12px" }}
            >
              {error}
            </div>
          )}
        </div>
      ) : (
        <div>
          <Input.TextArea
            value={jsonString}
            onChange={handleJsonStringChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{
              height: height || 300,
              fontFamily: "monospace",
              fontSize: `${fontSize}px`,
              backgroundColor: readOnly ? "#f5f5f5" : "inherit",
            }}
            autoSize={false}
          />
          {error && (
            <div
              style={{ color: "#ff4d4f", marginTop: "4px", fontSize: "12px" }}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonEditor;
