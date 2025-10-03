import { useIntl } from "@umijs/max";
import { Button, Input, message, Space } from "antd";
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

  // 初始化组件状态
  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (typeof value === "string") {
        setJsonString(value);
        try {
          const parsed = JSON.parse(value);
          setJsonObject(parsed);
          setError("");
        } catch (e) {
          setJsonObject(value);
          setError(
            intl.formatMessage({ id: "component.jsonEditor.invalidJson" }),
          );
        }
      } else {
        setJsonObject(value);
        try {
          setJsonString(JSON.stringify(value, null, 2));
          setError("");
        } catch (e) {
          setJsonString(String(value));
          setError(
            intl.formatMessage({ id: "component.jsonEditor.invalidObject" }),
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
      onChange?.(parsed);
    } catch (e) {
      setError(intl.formatMessage({ id: "component.jsonEditor.invalidJson" }));
      // 即使JSON无效，也传递字符串值
      onChange?.(newJsonString);
    }
  };

  // 处理JSON对象变化（来自react-json-view）
  const handleJsonChange = (edit: any) => {
    if (readOnly) return;

    const newJsonObject = edit.updated_src;
    setJsonObject(newJsonObject);

    try {
      const newJsonString = JSON.stringify(newJsonObject, null, 2);
      setJsonString(newJsonString);
      setError("");
      onChange?.(newJsonObject);
    } catch (e) {
      setError(
        intl.formatMessage({ id: "component.jsonEditor.invalidObject" }),
      );
      onChange?.(newJsonObject);
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
    } catch (e) {
      message.error(
        intl.formatMessage({ id: "component.jsonEditor.formatFailed" }),
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
    } catch (e) {
      message.error(
        intl.formatMessage({ id: "component.jsonEditor.compactFailed" }),
      );
    }
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
              </>
            )}
          </Space>
        </div>
      )}

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
                style={{ padding: "10px", fontSize: "18px" }}
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
              style={{ color: "#ff4d4f", marginTop: "4px", fontSize: "16px" }}
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
            placeholder={placeholder}
            readOnly={readOnly}
            autoSize={{ minRows: 4, maxRows: 12 }}
            style={{
              fontFamily: "monospace",
              fontSize: "18px",
              backgroundColor: readOnly ? "#f5f5f5" : "inherit",
            }}
          />
          {error && (
            <div
              style={{ color: "#ff4d4f", marginTop: "4px", fontSize: "16px" }}
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
