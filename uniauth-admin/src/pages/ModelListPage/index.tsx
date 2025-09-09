import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Button,
  Form,
  Input,
  message,
  Popconfirm,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';

const { Title, Text } = Typography;

// 定义模型配置的类型
interface ModelConfig {
  id: string;
  modelName: string;
}

const ModelListPage: React.FC = () => {
  // 状态管理
  const [dataSource, setDataSource] = useState<ModelConfig[]>([
    { id: '1', modelName: '模型1' },
    { id: '2', modelName: '模型2' },
    { id: '3', modelName: '模型3' },
    { id: '4', modelName: '模型4' },
    { id: '5', modelName: '模型5' },
    { id: '6', modelName: '模型6' },
    { id: '7', modelName: '模型7' },
    { id: '8', modelName: '模型8' },
    { id: '9', modelName: '模型9' },
    { id: '10', modelName: '模型10' },
    { id: '11', modelName: '模型11' },
    { id: '12', modelName: '模型12' },
    { id: '13', modelName: '模型13' },
    { id: '14', modelName: '模型14' },
    { id: '15', modelName: '模型15' },
    { id: '16', modelName: '模型16' },
    { id: '17', modelName: '模型17' },
    { id: '18', modelName: '模型18' },
    { id: '19', modelName: '模型19' },
    { id: '20', modelName: '模型20' },
  ]);

  // 编辑状态管理
  const [editingKey, setEditingKey] = useState<string>('');
  const [form] = Form.useForm();

  // 判断是否为编辑状态
  const isEditing = (record: ModelConfig) => record.id === editingKey;

  // 处理编辑
  const handleEdit = (record: ModelConfig) => {
    form.setFieldsValue({ modelName: record.modelName });
    setEditingKey(record.id);
  };

  // 处理取消编辑
  const handleCancel = () => {
    setEditingKey('');
  };

  // 处理保存
  const handleSave = async (id: string) => {
    try {
      const values = await form.validateFields();
      setDataSource((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, ...values } : item,
        ),
      );
      setEditingKey('');
      message.success('修改成功');
    } catch (_errInfo) {
      message.error('保存失败');
    }
  };

  // 处理删除
  const handleDelete = (id: string) => {
    setDataSource((prevData) => prevData.filter((item) => item.id !== id));
    message.success('删除成功');
  };

  // 表格列配置
  const columns: ColumnsType<ModelConfig> = [
    {
      title: '模型编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '模型名称',
      dataIndex: 'modelName',
      key: 'modelName',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="modelName"
            rules={[{ required: true, message: '模型名称不能为空' }]}
            noStyle
          >
            <Input />
          </Form.Item>
        ) : (
          record.modelName
        );
      },
    },
    // 操作列
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <span>
              <Popconfirm
                title="确定要保存修改吗？"
                onConfirm={() => handleSave(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" type="primary">
                  保存
                </Button>
              </Popconfirm>
              <Button
                size="small"
                style={{ marginLeft: 8 }}
                onClick={handleCancel}
              >
                取消
              </Button>
            </span>
          );
        } else {
          return (
            <span>
              <Button size="small" onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个模型吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button danger size="small" style={{ marginLeft: 8 }}>
                  删除
                </Button>
              </Popconfirm>
            </span>
          );
        }
      },
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>模型配置列表</Title>
        <Text type="secondary">管理系统中的所有模型配置</Text>
        <Form form={form} component={false}>
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            pagination={false}
          />
        </Form>
      </ProCard>
    </PageContainer>
  );
};

export default ModelListPage;
