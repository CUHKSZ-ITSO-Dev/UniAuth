import React, { FC, useEffect, useState } from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Form, Input, InputNumber, Button, message, Space, Typography, Row, Col } from 'antd';
import { useLocation, useNavigate } from 'umi';
import type { ModelConfig } from '../ModelConfigPage/index';

const { Title } = Typography;

const ModelEditPage: FC = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<ModelConfig> | null>(null);

  // 从URL获取记录数据
  const getRecordFromUrl = (): Partial<ModelConfig> | null => {
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

  useEffect(() => {
    const record = getRecordFromUrl();
    if (record) {
      setIsEdit(true);
      setInitialValues(record);
      form.setFieldsValue(record);
    } else {
      setIsEdit(false);
      setInitialValues(null);
    }
  }, [location.search]);

  const handleSave = async (values: any) => {
    try {
      // 确保JSON字段正确格式化
      const formattedValues = {
        ...values,
        pricing: typeof values.pricing === 'string' ? values.pricing : JSON.stringify(values.pricing),
        client_args: typeof values.client_args === 'string' ? values.client_args : JSON.stringify(values.client_args),
        request_args: typeof values.request_args === 'string' ? values.request_args : JSON.stringify(values.request_args),
        servicewares: Array.isArray(values.servicewares) ? values.servicewares : 
                     typeof values.servicewares === 'string' ? values.servicewares.split(',').map((s: string) => s.trim()) : [],
      };

      console.log('保存方案', formattedValues);
      
      // 发送消息给父窗口（如果在弹窗中）
      if (window.opener) {
        window.opener.postMessage(
          { type: 'modelConfigSaved', data: formattedValues },
          '*'
        );
      }
      
      message.success(`${isEdit ? '更新' : '创建'}方案成功`);
      
      // 如果在弹窗中则关闭，否则返回上一页
      if (window.opener) {
        window.close();
      } else {
        navigate('/config/model-config');
      }
    } catch (error) {
      message.error(`${isEdit ? '更新' : '创建'}方案失败`);
      console.error('保存失败', error);
    }
  };

  const handleCancel = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/config/model-config');
    }
  };

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>{isEdit ? '编辑方案' : '新建方案'}</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={initialValues || {}}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="approach_name"
                label="方案名称"
                rules={[{ required: true, message: '请输入方案名称' }]}
              >
                <Input placeholder="请输入方案名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount"
                label="折扣"
                rules={[{ required: true, message: '请输入折扣' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入折扣"
                  min={0}
                  max={1}
                  step={0.01}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="client_type"
                label="客户端类型"
                rules={[{ required: true, message: '请输入客户端类型' }]}
              >
                <Input placeholder="请输入客户端类型" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="servicewares"
                label="服务项"
              >
                <Input placeholder="请输入服务项，多个用逗号分隔" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="pricing"
            label="定价 (JSON格式)"
          >
            <Input.TextArea
              rows={4}
              placeholder='例如: {"price": 100, "currency": "USD"}'
            />
          </Form.Item>
          
          <Form.Item
            name="client_args"
            label="客户端参数 (JSON格式)"
          >
            <Input.TextArea
              rows={4}
              placeholder='例如: {"arg1": "value1", "arg2": "value2"}'
            />
          </Form.Item>
          
          <Form.Item
            name="request_args"
            label="请求参数 (JSON格式)"
          >
            <Input.TextArea
              rows={4}
              placeholder='例如: {"req_arg1": "req_value1"}'
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={handleCancel}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </ProCard>
    </PageContainer>
  );
};

export default ModelEditPage;