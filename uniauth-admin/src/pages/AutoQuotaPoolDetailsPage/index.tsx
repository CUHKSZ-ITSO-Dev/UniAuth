import React, { FC, useMemo, useState } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Typography, Input, Button, message, Tabs } from 'antd';
import { useLocation, useNavigate } from 'umi';
import ReactJson from 'react-json-view';
import Editor from '@monaco-editor/react';

const { Title } = Typography;
const { TabPane } = Tabs;

export interface AutoQuotaPoolDetailsConfig {
  autoQuotaPoolConfigs: string[];
}

const AutoQuotaPoolDetailsPage: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getRecordFromUrl = (): any => {
    const searchParams = new URLSearchParams(location.search);
    const recordStr = searchParams.get('record');
    if (recordStr) {
      try {
        return JSON.parse(decodeURIComponent(recordStr));
      } catch (error) {
        console.error('解析记录数据失败', error);
        return null;
      }
    }
    return null;
  };

  const record = getRecordFromUrl();
  
  const initialJsonData: AutoQuotaPoolDetailsConfig = {
    autoQuotaPoolConfigs: ['示例配置1', '示例配置2'],
  };

  const [jsonData, setJsonData] = React.useState<string>(
    JSON.stringify(initialJsonData, null, 2)
  );
  const [jsonObject, setJsonObject] = React.useState<any>(initialJsonData);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('editor');

  // 计算行号
  const lineNumbers = useMemo(() => {
    const lines = jsonData.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  }, [jsonData]);

  const validateJson = (value: string): boolean => {
    try {
      const parsed = JSON.parse(value);
      setJsonObject(parsed);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 格式不正确');
      return false;
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonData(value);
    validateJson(value);
  };

  const handleSave = () => {
    if (!validateJson(jsonData)) {
      message.error('请检查 JSON 格式');
      return;
    }

    try {
      const parsedData = JSON.parse(jsonData);
      console.log('保存配置', parsedData);
      
      if (window.opener) {
        window.opener.postMessage(
          { type: 'autoQuotaPoolConfigSaved', data: parsedData },
          '*'
        );
      }
      
      message.success(`配置 ${record?.configName || '未知'} 保存成功`);
      
      if (window.opener) {
        window.close();
      } else {
        navigate(-1);
      }
    } catch (error) {
      message.error('保存配置失败');
      console.error('保存失败', error);
    }
  };

  const handleCancel = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate(-1);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonData);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonData(formatted);
      message.success('JSON 格式化成功');
    } catch (error) {
      message.error('JSON 格式不正确，无法格式化');
    }
  };

  // 处理JSON对象变化（来自可视化编辑器）
  const handleJsonChangeVisual = (edit: any) => {
    const updatedSrc = edit.updated_src;
    setJsonObject(updatedSrc);
    const formatted = JSON.stringify(updatedSrc, null, 2);
    setJsonData(formatted);
    validateJson(formatted);
    return true;
  };

  return (
    <PageContainer>
      <ProCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            自动配额池配置编辑器 - {record?.configName ? `配置名称: ${record.configName}` : '新建配置'}
          </Title>
          <div>
            <Button type="default" onClick={handleFormatJson} style={{ marginRight: 8 }}>
              格式化 JSON
            </Button>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="代码编辑器" key="editor">
            <div style={{ marginBottom: 16 }}>
              
              {/* Monaco Editor 代码编辑器 */}
              <div style={{ 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                overflow: 'hidden',
                minHeight: '300px'
              }}>
                <Editor
                  height="400px"
                  defaultLanguage="json"
                  value={jsonData}
                  onChange={(value) => {
                    if (value !== undefined) {
                      handleJsonChange({
                        target: { value }
                      } as React.ChangeEvent<HTMLTextAreaElement>);
                    }
                  }}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    wrappingIndent: 'indent',
                    lineNumbers: 'on',
                    folding: true,
                    renderLineHighlight: 'all',
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    formatOnType: true
                  }}
                />
              </div>
              
              {error && (
                <div style={{ color: 'red', marginTop: 8, fontSize: '20px' }}>
                  {error}
                </div>
              )}
            </div>
          </TabPane>
          
          <TabPane tab="可视化编辑器" key="visual">
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px',
              padding: '16px',
              minHeight: '300px'
            }}>
              <ReactJson
                src={jsonObject}
                onEdit={handleJsonChangeVisual}
                onAdd={handleJsonChangeVisual}
                onDelete={handleJsonChangeVisual}
                theme="rjv-default"
                style={{ 
                  backgroundColor: '#fff',
                  padding: '16px',
                  borderRadius: '4px'
                }}
                name={null}
                collapsed={false}
                collapseStringsAfterLength={100}
                indentWidth={4}
                enableClipboard={true}
                displayObjectSize={true}
                displayDataTypes={true}
                iconStyle="triangle"
              />
            </div>
          </TabPane>
          
          <TabPane tab="实时预览" key="preview">
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px',
              padding: '16px',
              minHeight: '300px',
              backgroundColor: '#f9f9f9'
            }}>
              <pre style={{ 
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {jsonData}
              </pre>
            </div>
          </TabPane>
        </Tabs>
      </ProCard>
    </PageContainer>
  );
};

export default AutoQuotaPoolDetailsPage;