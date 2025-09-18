import React, { useEffect, useState } from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button, Form, Input, InputNumber, Switch, message } from 'antd';
import { request, history, useLocation } from '@umijs/max';

// 定义AutoQuotaPoolConfig接口
interface AutoQuotaPoolConfig {
  id: number;
  ruleName: string;
  description: string;
  cronCycle: string;
  regularQuota: string; // 使用string类型表示decimal
  enabled: boolean;
  filterGroup: any; // 根据API定义，这是一个复杂的嵌套对象
  priority: number;
  lastEvaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const EditRulePage: React.FC = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [initialData, setInitialData] = useState<AutoQuotaPoolConfig | null>(null);

  // 解析URL参数
  const urlParams = new URLSearchParams(location.search);
  const ruleName = urlParams.get('ruleName');

  // 如果有ruleName参数，则为编辑模式
  useEffect(() => {
    if (ruleName) {
      setIsEdit(true);
      fetchRuleData(ruleName);
    }
  }, [ruleName]);

  // 获取规则数据
  const fetchRuleData = async (name: string) => {
    try {
      setLoading(true);
      const response = await request('/config/autoConfig', {
        method: 'GET',
      });
      
      const items = response.items || [];
      const rule = items.find((item: AutoQuotaPoolConfig) => item.ruleName === name);
      
      if (rule) {
        setInitialData(rule);
        // 设置表单初始值
        form.setFieldsValue({
          ...rule,
          regularQuota: parseFloat(rule.regularQuota) || 0,
          filterGroup: JSON.stringify(rule.filterGroup, null, 2), // 将过滤条件转换为格式化的JSON字符串
        });
      } else {
        message.error('未找到指定规则');
        history.back();
      }
    } catch (error) {
      message.error('获取规则数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // 处理过滤条件
      let filterGroup = {};
      if (values.filterGroup && typeof values.filterGroup === 'string') {
        try {
          filterGroup = JSON.parse(values.filterGroup);
        } catch (e) {
          message.error('过滤条件格式不正确，请输入有效的JSON格式');
          setLoading(false);
          return;
        }
      }
      
      // 构造请求数据
      const requestData = {
        ...values,
        regularQuota: values.regularQuota.toString(), // 转换为字符串
        filterGroup: filterGroup, // 使用解析后的过滤条件
      };
      
      // 发送请求
      let response;
      if (isEdit) {
        // 编辑模式下需要传递规则ID，并使用PUT方法
        response = await request(`/config/autoConfig?ruleName=${encodeURIComponent(ruleName || '')}`, {
          method: 'PUT',
          data: requestData,
        });
      } else {
        // 新增模式下使用POST方法
        response = await request('/config/autoConfig', {
          method: 'POST',
          data: requestData,
        });
      }
      
      if (response.ok) {
        message.success(isEdit ? '规则更新成功' : '规则添加成功');
        // 返回列表页面
        history.push('/config/auto-config');
      } else {
        message.error(isEdit ? '规则更新失败' : '规则添加失败');
      }
    } catch (error) {
      message.error(isEdit ? '规则更新失败' : '规则添加失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const onCancel = () => {
    history.back();
  };

  return (
    <PageContainer
      title={isEdit ? '编辑自动配额池规则' : '添加自动配额池规则'}
      onBack={() => history.back()}
    >
      <ProCard loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            enabled: true,
            priority: 10,
          }}
        >
          <Form.Item
            label="规则名称"
            name="ruleName"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" disabled={isEdit} />
          </Form.Item>
          
          <Form.Item
            label="规则描述"
            name="description"
            rules={[{ required: true, message: '请输入规则描述' }]}
          >
            <Input.TextArea placeholder="请输入规则描述" rows={3} />
          </Form.Item>
          
          <Form.Item
            label="Cron周期表达式"
            name="cronCycle"
            rules={[{ required: true, message: '请输入Cron周期表达式' }]}
          >
            <Input placeholder="例如: 0 0 3 * * *" />
          </Form.Item>
          
          <Form.Item
            label="定期配额"
            name="regularQuota"
            rules={[{ required: true, message: '请输入定期配额' }]}
          >
            <InputNumber
              placeholder="请输入定期配额"
              style={{ width: '100%' }}
              min={0}
              step={1}
            />
          </Form.Item>
          
          <Form.Item
            label="是否启用"
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            label="优先级"
            name="priority"
            rules={[{ required: true, message: '请输入优先级' }]}
          >
            <InputNumber
              placeholder="数值越小优先级越高"
              style={{ width: '100%' }}
              min={1}
              step={1}
            />
          </Form.Item>
          
          <Form.Item
            label="过滤条件"
            name="filterGroup"
          >
            <Input.TextArea
              placeholder='请输入JSON格式的过滤条件，例如: {"userType": "VIP", "region": "CN"}'
              rows={4}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
              {isEdit ? '更新规则' : '添加规则'}
            </Button>
            <Button onClick={onCancel}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </ProCard>
    </PageContainer>
  );
};

export default EditRulePage;