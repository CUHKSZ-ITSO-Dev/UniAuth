import React, { FC } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Typography, Input, Button, message } from 'antd';
import { useLocation, useNavigate } from 'umi';

const { Title } = Typography;
const { TextArea } = Input;

// JSON 配置类型定义
export interface AutoQuotaPoolDetailsConfig {
  autoQuotaPoolConfigs: string[];
}

const AutoQuotaPoolDetailsPage: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 从 URL 查询参数中获取记录数据
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
  
  // 初始 JSON 数据
  const initialJsonData: AutoQuotaPoolDetailsConfig = {
    autoQuotaPoolConfigs: ['示例配置1', '示例配置2'],
  };

  // 状态管理
  const [jsonData, setJsonData] = React.useState<string>(
    JSON.stringify(initialJsonData, null, 2)
  );
  const [error, setError] = React.useState<string | null>(null);

  // 验证 JSON 格式
  const validateJson = (value: string): boolean => {
    try {
      const parsed = JSON.parse(value);
      // 检查是否包含必需的字段
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.autoQuotaPoolConfigs)) {
        throw new Error('JSON 格式不正确，需要包含 autoQuotaPoolConfigs 数组');
      }
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 格式不正确');
      return false;
    }
  };

  // 处理 JSON 文本变化
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonData(value);
    validateJson(value);
  };

  // 保存配置
  const handleSave = () => {
    if (!validateJson(jsonData)) {
      message.error('请检查 JSON 格式');
      return;
    }

    try {
      const parsedData = JSON.parse(jsonData);
      // 模拟保存操作
      console.log('保存配置', parsedData);
      
      // 发送消息回父窗口
      if (window.opener) {
        window.opener.postMessage(
          { type: 'autoQuotaPoolConfigSaved', data: parsedData },
          '*'
        );
      }
      
      message.success(`配置 ${record?.configName || '未知'} 保存成功`);
      
      // 关闭当前窗口或返回上一页
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

  // 取消操作
  const handleCancel = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate(-1);
    }
  };

  // 格式化 JSON 按钮点击事件
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
          <Input.TextArea
            value={jsonData}
            onChange={handleJsonChange}
            placeholder='请输入符合格式的 JSON 文本：{"autoQuotaPoolConfigs": ["string"]}'
            autoSize={{ minRows: 16, maxRows: 24 }}
            style={{
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '14px',
            }}
          />
          {error && (
            <div style={{ color: 'red', marginTop: 8, fontSize: '12px' }}>
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