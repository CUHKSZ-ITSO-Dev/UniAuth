import React, { FC, useMemo } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Typography, Input, Button, message } from 'antd';
import { useLocation, useNavigate } from 'umi';

const { Title } = Typography;

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
  const [error, setError] = React.useState<string | null>(null);

  const validateJson = (value: string): boolean => {
    try {
      JSON.parse(value);
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

  // 计算行号
  const lineNumbers = useMemo(() => {
    const lines = jsonData.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  }, [jsonData]);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>
          编辑自动配额池配置 - {record?.configName || '新建配置'}
        </Title>
        
        <div style={{ marginBottom: 16 }}>
          <Button
            type="default"
            onClick={handleFormatJson}
            style={{ marginBottom: 8 }}
          >
            格式化 JSON
          </Button>
          
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
                placeholder='请输入符合格式的 JSON 文本'
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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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