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

  // 添加新模型
  const handleAddModel = () => {
    // 检查是否已经存在未保存的空模型
    const hasEmptyModel = dataSource.some((item) => !item.modelName);

    // 如果已经存在空模型，则不执行任何操作
    if (hasEmptyModel) {
      return;
    }

    // 生成新ID（基于当前最大ID + 1）
    const maxId = Math.max(
      ...dataSource.map((item) => parseInt(item.id, 10)),
      0,
    );
    const newModelId = (maxId + 1).toString();

    // 将表单值设为空
    form.setFieldsValue({ modelName: '' });
    // 设置编辑键为新模型ID，直接进入编辑状态
    setEditingKey(newModelId);

    // 添加一个临时的空模型到数据源，用于编辑
    setDataSource([{ id: newModelId, modelName: '' }, ...dataSource]);
  };

  // 事件处理函数
  const handleEdit = (record: ModelConfig) => {
    form.setFieldsValue({ modelName: record.modelName });
    setEditingKey(record.id);
  };

  const handleCancel = () => {
    // 如果当前正在编辑的是空模型（新添加但未保存的模型），则从数据源中移除它
    if (editingKey) {
      setDataSource((prevData) => {
        // 检查当前编辑的项是否是空模型
        const isEditingEmptyModel = prevData.some(
          (item) => item.id === editingKey && !item.modelName,
        );

        // 如果是空模型，则移除它；否则保持数据源不变
        return isEditingEmptyModel
          ? prevData.filter((item) => item.id !== editingKey)
          : prevData;
      });
    }

    // 清除编辑状态
    setEditingKey('');
  };

  const handleSave = async (id: string) => {
    try {
      const values = await form.validateFields();

      // 检查是否为空模型（新添加的模型）
      const isNewModel = dataSource.some(
        (item) => item.id === id && !item.modelName,
      );

      setDataSource((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, ...values } : item,
        ),
      );
      setEditingKey('');

      // 根据是否是新模型显示不同的成功消息
      message.success(isNewModel ? '模型添加成功' : '修改成功');
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

  // 更新模型列表
  const handleUpdateModel = async () => {
    try {
      // 在实际应用中，这里应该调用API重新获取模型列表
      // 由于这是模拟环境，我们重新生成一组随机模型数据
      message.loading('正在更新模型列表...');

      // 模拟API请求延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 生成新的模型数据
      const newDataSource = Array.from({ length: 51 }, (_, index) => ({
        id: (index + 1).toString(),
        modelName: `模型_${Date.now() % 1000}_${index + 1}`,
      }));

      setDataSource(newDataSource);
      message.destroy();
      message.success('模型列表更新成功');
    } catch (_error) {
      message.destroy();
      message.error('模型列表更新失败');
    }
  };

  // 组件渲染
  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>模型配置列表</Title>
        <Text type="secondary">管理系统中的所有模型配置</Text>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleAddModel}>
            添加模型
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={handleUpdateModel}>
            更新模型
          </Button>
        </div>
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
