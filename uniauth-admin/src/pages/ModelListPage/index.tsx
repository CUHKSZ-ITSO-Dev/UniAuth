// 导入依赖组件
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

// 类型定义
interface ModelConfig {
  id: string;
  modelName: string;
}

const ModelListPage: React.FC = () => {
  // 解构组件
  const { Title, Text } = Typography;
  const [form] = Form.useForm();

  // 状态管理
  const [dataSource, setDataSource] = useState<ModelConfig[]>(
    Array.from({ length: 51 }, (_, i) => ({
      id: (i + 1).toString(),
      modelName: `模型${i + 1}`,
    })),
  );
  const [editingKey, setEditingKey] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  // 辅助函数 - 判断编辑状态
  const isEditing = (record: ModelConfig) => record.id === editingKey;

  // 事件处理函数
  const handleEdit = (record: ModelConfig) => {
    form.setFieldsValue({ modelName: record.modelName });
    setEditingKey(record.id);
  };

  const handleCancel = () => {
    setEditingKey('');
  };

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
      render: (_, record) =>
        isEditing(record) ? (
          <Form.Item
            name="modelName"
            rules={[{ required: true, message: '模型名称不能为空' }]}
            noStyle
          >
            <Input />
          </Form.Item>
        ) : (
          record.modelName
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const editable = isEditing(record);

        if (editable) {
          return (
            <>
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
            </>
          );
        }

        return (
          <>
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
          </>
        );
      },
    },
  ];

  // 组件渲染
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
            onChange={handleTableChange}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条数据`,
              pageSize: pageSize,
              pageSizeOptions: ['5', '10', '20', '50'],
            }}
          />
        </Form>
      </ProCard>
    </PageContainer>
  );
};

export default ModelListPage;
