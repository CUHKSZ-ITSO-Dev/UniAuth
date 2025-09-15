import React, { FC, useMemo, useState } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Typography, Input, Button, message, Tabs } from 'antd';
import { useLocation, useNavigate } from 'umi';
import ReactJson from 'react-json-view';

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

  // 添加新属性
  const handleAddProperty = () => {
    try {
      const parsed = JSON.parse(jsonData);
      // 添加一个新属性
      const newKey = `newProperty${Object.keys(parsed).length}`;
      parsed[newKey] = "";
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonData(formatted);
      setJsonObject(parsed);
      message.success('已添加新属性');
    } catch (error) {
      message.error('JSON 格式不正确，无法添加属性');
    }
  };

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>
          编辑自动配额池配置 - {record?.configName || '新建配置'}
        </Title>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="代码编辑器" key="editor">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Button type="default" onClick={handleFormatJson}>
                  格式化 JSON
                </Button>
                <Button type="default" onClick={handleAddProperty}>
                  添加属性
                </Button>
              </div>
              
              {/* 带行号的文本编辑器 */}
              <div style={{ 
                display: 'flex', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                overflow: 'hidden',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '16px'
              }}>
                {/* 行号区域 */}
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: '#f5f5f5',
                  color: '#999',
                  textAlign: 'right',
                  minWidth: '40px',
                  lineHeight: '1.5',
                  borderRight: '1px solid #d9d9d9',
                  userSelect: 'none',
                  whiteSpace: 'pre'
                }}>
                  {lineNumbers}
                </div>
                
                {/* 文本编辑区域 */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <Input.TextArea
                    value={jsonData}
                    onChange={handleJsonChange}
                    placeholder='请输入符合格式的 JSON 文本：{"autoQuotaPoolConfigs": ["string"]}'
                    autoSize={{ minRows: 16, maxRows: 24 }}
                    style={{
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: '16px',
                      border: 'none',
                      borderRadius: '0',
                      resize: 'none',
                      width: '100%',
                      height: '100%',
                      minHeight: '300px'
                    }}
                  />
                </div>
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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
          <Button onClick={handleCancel}>
            取消
          </Button>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </div>
      </ProCard>
    </PageContainer>
  );
};

export default AutoQuotaPoolDetailsPage;