import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { Button, Input, Modal, message, Space } from "antd";
import React, { useEffect, useState } from "react";
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
          }}
        >
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
                    style={{ padding: "10px", fontSize: "14px" }}
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
                    fontSize: "14px",
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
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        padding: "12px",
      }}
    >
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
          <div style={{ height, overflow: "auto" }}>
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
                style={{ padding: "10px", fontSize: "14px" }}
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
            autoSize={{ minRows: 4, maxRows: 12 }}
            style={{
              fontFamily: "monospace",
              fontSize: "14px",
              backgroundColor: readOnly ? "#f5f5f5" : "inherit",
            }}
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
