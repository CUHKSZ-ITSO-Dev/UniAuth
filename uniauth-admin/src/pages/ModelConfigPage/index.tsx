import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Table, Space, message, Modal, Form, Input, Select } from "antd";
import { useRef, useState } from "react";
import {
  getConfigModelAll,
  postConfigModel,
  putConfigModel,
  deleteConfigModel,
} from "@/services/uniauthService/model";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ModelConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<API.ModelConfigItem | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (record: API.ModelConfigItem) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      pricing: record.pricing ? JSON.stringify(record.pricing, null, 2) : '',
      clientArgs: record.clientArgs ? JSON.stringify(record.clientArgs, null, 2) : '',
      requestArgs: record.requestArgs ? JSON.stringify(record.requestArgs, null, 2) : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: API.ModelConfigItem) => {
    try {
      await deleteConfigModel({ approachName: record.approachName });
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
      
      // 处理JSON字段
      const processedValues = {
        ...values,
        pricing: values.pricing ? JSON.parse(values.pricing) : null,
        clientArgs: values.clientArgs ? JSON.parse(values.clientArgs) : null,
        requestArgs: values.requestArgs ? JSON.parse(values.requestArgs) : null,
        servicewares: values.servicewares ? values.servicewares.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [],
        discount: values.discount ? parseFloat(values.discount) : null,
      };
      
      if (editingRecord) {
        // 编辑现有配置
        await putConfigModel(processedValues);
        message.success("更新成功");
      } else {
        // 添加新配置
        await postConfigModel(processedValues);
        message.success("添加成功");
      }
      
      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      console.error("保存模型配置失败:", error);
      message.error("保存失败，请检查JSON格式是否正确");
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const modelConfigListRequest = async (params: any) => {
    try {
      const response = await getConfigModelAll(params);
      
      if (response.data && response.data.items) {
        // 根据查询参数过滤数据
        let data = response.data.items || [];
        
        if (params.approachName) {
          data = data.filter((item: API.ModelConfigItem) => 
            item.approachName?.includes(params.approachName)
          );
        }
        
        if (params.clientType) {
          data = data.filter((item: API.ModelConfigItem) => 
            item.clientType?.includes(params.clientType)
          );
        }
        
        if (params.createdAt && Array.isArray(params.createdAt) && params.createdAt.length === 2) {
          const [start, end] = params.createdAt;
          data = data.filter((item: API.ModelConfigItem) => {
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
      } else {
        return {
          data: [],
          success: false,
          total: 0,
        };
      }
    } catch (error) {
      console.error("获取模型配置列表失败:", error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const columns: ProColumns<API.ModelConfigItem>[] = [
    {
      title: "模型名称",
      dataIndex: "approachName",
      valueType: "text",
      search: true,
    },
    {
      title: "客户端类型",
      dataIndex: "clientType",
      valueType: "text",
      search: true,
      render: (_, record) => record.clientType || <Text type="secondary">未设置</Text>,
    },
    {
      title: "折扣",
      dataIndex: "discount",
      valueType: "digit",
      search: false,
      render: (_, record) => record.discount ? `${(record.discount * 100).toFixed(1)}%` : <Text type="secondary">未设置</Text>,
    },
    {
      title: "服务项",
      dataIndex: "servicewares",
      valueType: "text",
      search: false,
      render: (_, record) => record.servicewares ? record.servicewares.join(', ') : <Text type="secondary">未设置</Text>,
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
          rowKey="approachName"
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
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="approachName"
            label="模型名称"
            rules={[{ required: true, message: "请输入模型名称" }]}
          >
            <Input placeholder="请输入唯一的模型名称" disabled={!!editingRecord} />
          </Form.Item>
          
          <Form.Item
            name="clientType"
            label="客户端类型"
          >
            <Select placeholder="请选择客户端类型">
              <Option value="web">Web</Option>
              <Option value="ios">iOS</Option>
              <Option value="android">Android</Option>
              <Option value="server">Server</Option>
              <Option value="desktop">Desktop</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="discount"
            label="折扣"
          >
            <Input 
              type="number" 
              min="0" 
              max="1" 
              step="0.01"
              placeholder="请输入0-1之间的折扣值，如0.9表示9折" 
            />
          </Form.Item>
          
          <Form.Item
            name="servicewares"
            label="服务项标识"
          >
            <Input placeholder="请输入服务项标识，多个用逗号分隔" />
          </Form.Item>
          
          <Form.Item
            name="pricing"
            label="定价配置 (JSON)"
          >
            <TextArea
              rows={4}
              placeholder="请输入JSON格式的定价配置"
            />
          </Form.Item>
          
          <Form.Item
            name="clientArgs"
            label="客户端参数 (JSON)"
          >
            <TextArea
              rows={4}
              placeholder="请输入JSON格式的客户端参数"
            />
          </Form.Item>
          
          <Form.Item
            name="requestArgs"
            label="请求参数 (JSON)"
          >
            <TextArea
              rows={4}
              placeholder="请输入JSON格式的请求参数"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ModelConfigPage;