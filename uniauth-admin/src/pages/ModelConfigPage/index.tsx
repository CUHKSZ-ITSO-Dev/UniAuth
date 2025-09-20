import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Table, Space, message, Modal, Form, Input } from "antd";
import { useRef, useState } from "react";
import {
  getConfigModelAll,
  postConfigModel,
  putConfigModel,
  deleteConfigModel,
} from "@/services/uniauthService/model";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ModelConfig {
  id?: string;
  name: string;
  description: string;
  config: string;
  createdAt?: string;
  updatedAt?: string;
}

const ModelConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ModelConfig | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (record: ModelConfig) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (record: ModelConfig) => {
    try {
      // TODO: 替换为实际的删除API调用
      // await deleteConfigModel({ id: record.id });
      message.success("删除成功");
      actionRef.current?.reload();
    } catch (error) {
      message.error("删除失败");
      console.error("删除模型配置失败:", error);
    }
  };

  const handleNewModelConfig = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRecord) {
        // 编辑现有配置
        // TODO: 替换为实际的编辑API调用
        // await putConfigModel({ ...values, id: editingRecord.id });
        message.success("更新成功");
      } else {
        // 添加新配置
        // TODO: 替换为实际的添加API调用
        // await postConfigModel(values);
        message.success("添加成功");
      }
      
      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      console.error("保存模型配置失败:", error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const modelConfigListRequest = async (params: any) => {
    try {
      // TODO: 替换为实际的API调用
      // const response = await getConfigModelAll(params);
      
      // 模拟数据
      const mockData: ModelConfig[] = [
        {
          id: "1",
          name: "GPT-4",
          description: "OpenAI GPT-4 模型",
          config: '{"model": "gpt-4", "max_tokens": 4096, "temperature": 0.7}',
          createdAt: "2024-09-01 10:23:45",
          updatedAt: "2024-09-01 10:23:45",
        },
        {
          id: "2",
          name: "Claude-2",
          description: "Anthropic Claude 2 模型",
          config: '{"model": "claude-2", "max_tokens": 8192, "temperature": 0.5}',
          createdAt: "2024-09-02 09:15:30",
          updatedAt: "2024-09-02 09:15:30",
        },
        {
          id: "3",
          name: "Llama-2",
          description: "Meta Llama 2 70B 模型",
          config: '{"model": "llama-2-70b", "max_tokens": 2048, "temperature": 0.8}',
          createdAt: "2024-08-28 14:05:12",
          updatedAt: "2024-08-28 14:05:12",
        },
      ];

      // 简单的过滤逻辑
      let data = mockData;
      if (params.name) {
        data = data.filter((item) => item.name.includes(params.name));
      }
      if (params.description) {
        data = data.filter((item) => item.description.includes(params.description));
      }
      if (params.createdAt && Array.isArray(params.createdAt) && params.createdAt.length === 2) {
        const [start, end] = params.createdAt;
        data = data.filter((item) => {
          const time = new Date(item.createdAt!).getTime();
          return (
            (!start || time >= new Date(start).getTime()) &&
            (!end || time <= new Date(end).getTime())
          );
        });
      }

      return {
        data,
        success: true,
        total: data.length,
      };
    } catch (error) {
      console.error("获取模型配置列表失败:", error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const columns: ProColumns<ModelConfig>[] = [
    {
      title: "模型名称",
      dataIndex: "name",
      valueType: "text",
      search: true,
    },
    {
      title: "描述",
      dataIndex: "description",
      valueType: "text",
      search: true,
      ellipsis: true,
      render: (_, record) => record.description || <Text type="secondary">无</Text>,
    },
    {
      title: "配置内容",
      dataIndex: "config",
      valueType: "text",
      search: false,
      ellipsis: true,
      render: (_, record) => (
        <Text type="secondary" ellipsis={{ tooltip: record.config }}>
          {record.config.length > 50 ? record.config.substring(0, 50) + "..." : record.config}
        </Text>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      valueType: "dateTime",
      search: true,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      valueType: "dateTime",
      search: true,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
    },
    {
      title: "操作",
      valueType: "option",
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <a key="edit" onClick={() => handleEdit(record)}>
            编辑
          </a>
          <span style={{ margin: "0 8px" }} />
          <Popconfirm
            key="delete"
            title="确定要删除该模型配置吗？"
            onConfirm={() => handleDelete(record)}
          >
            <a style={{ color: "red" }}>删除</a>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>模型配置列表</Title>
        <Text type="secondary">
          管理系统中的所有AI模型配置，包括模型参数、访问权限等设置
        </Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
          search={{ labelWidth: "auto" }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          }}
          tableAlertRender={({ selectedRowKeys, onCleanSelected }) => {
            return (
              <Space size={24}>
                <span>
                  已选 {selectedRowKeys.length} 项
                  <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                    取消选择
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={() => {
            return (
              <Space size={16}>
                <a onClick={() => message.info("批量操作功能待开发")}>
                  批量启用
                </a>
                <a onClick={() => message.info("批量操作功能待开发")}>
                  批量禁用
                </a>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewModelConfig}>
              添加新的模型配置
            </Button>,
          ]}
          request={modelConfigListRequest}
        />
      </ProCard>

      <Modal
        title={editingRecord ? "编辑模型配置" : "添加模型配置"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="模型名称"
            rules={[{ required: true, message: "请输入模型名称" }]}
          >
            <Input placeholder="请输入模型名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input placeholder="请输入模型描述" />
          </Form.Item>
          <Form.Item
            name="config"
            label="配置内容"
            rules={[{ required: true, message: "请输入配置内容" }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入JSON格式的配置内容"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ModelConfigPage;