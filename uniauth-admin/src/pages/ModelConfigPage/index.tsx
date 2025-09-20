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
    
    // 安全地处理JSON字段的序列化
    const formatJsonField = (field: any): string => {
      if (!field) return '';
      try {
        return typeof field === 'string' ? field : JSON.stringify(field, null, 2);
      } catch (e) {
        console.error('JSON序列化失败:', e);
        return typeof field === 'object' ? JSON.stringify(field) : String(field);
      }
    };
    
    form.setFieldsValue({
      ...record,
      pricing: formatJsonField(record.pricing),
      clientArgs: formatJsonField(record.clientArgs),
      requestArgs: formatJsonField(record.requestArgs),
      servicewares: Array.isArray(record.servicewares) ? record.servicewares.join(', ') : (record.servicewares || ''),
      discount: record.discount !== undefined && record.discount !== null ? String(record.discount) : ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: API.ModelConfigItem) => {
    try {
      await deleteConfigModel({ approachName: record.approachName || '' });
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
      
      // 安全地处理JSON字段的解析
      const parseJsonField = (field: string): any => {
        if (!field) return null;
        try {
          return JSON.parse(field);
        } catch (e) {
          console.error('JSON解析失败:', e);
          message.error("JSON格式错误，请检查输入");
          throw e;
        }
      };
      
      // 处理服务项标识
      const processServicewares = (field: string): string[] => {
        if (!field) return [];
        return field.split(',').map(s => s.trim()).filter(s => s);
      };
      
      // 处理折扣字段
      const processDiscount = (field: string): number | null => {
        if (!field) return null;
        const num = parseFloat(field);
        return isNaN(num) ? null : num;
      };
      
      // 处理JSON字段
      const processedValues = {
        ...values,
        approachName: values.approachName || '',
        pricing: parseJsonField(values.pricing),
        clientArgs: parseJsonField(values.clientArgs),
        requestArgs: parseJsonField(values.requestArgs),
        servicewares: processServicewares(values.servicewares),
        discount: processDiscount(values.discount),
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
      // 错误消息已经在parseJsonField中处理了
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const modelConfigListRequest = async (params: any) => {
    try {
      const response = await getConfigModelAll(params);
      
      if (response.items) {
        // 根据查询参数过滤数据
        let data = response.items || [];
        
        // 模型名称过滤
        if (params.approachName) {
          data = data.filter((item: API.ModelConfigItem) => 
            item.approachName && item.approachName.includes(params.approachName)
          );
        }
        
        // 客户端类型过滤
        if (params.clientType) {
          data = data.filter((item: API.ModelConfigItem) => 
            item.clientType && item.clientType.includes(params.clientType)
          );
        }
        
        // 创建时间过滤
        if (params.createdAt && Array.isArray(params.createdAt) && params.createdAt.length === 2) {
          const [start, end] = params.createdAt;
          data = data.filter((item: API.ModelConfigItem) => {
            // 安全处理 createdAt 字段可能为空的情况
            if (!item.createdAt) return false;
            const itemTime = new Date(item.createdAt).getTime();
            const startTime = start ? new Date(start).getTime() : null;
            const endTime = end ? new Date(end).getTime() : null;
            
            return (
              (!startTime || itemTime >= startTime) &&
              (!endTime || itemTime <= endTime)
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
          success: true, // 即使没有数据也返回成功
          total: 0,
        };
      }
    } catch (error) {
      console.error("获取模型配置列表失败:", error);
      message.error("获取模型配置列表失败");
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
      fixed: "left",
      width: 150,
      render: (_, record) => record.approachName || <Text type="secondary">未设置</Text>,
    },
    {
      title: "客户端类型",
      dataIndex: "clientType",
      valueType: "text",
      search: true,
      width: 120,
      render: (_, record) => record.clientType || <Text type="secondary">未设置</Text>,
    },
    {
      title: "折扣",
      dataIndex: "discount",
      valueType: "digit",
      search: false,
      width: 80,
      render: (_, record) => {
        if (record.discount !== undefined && record.discount !== null) {
          const discountValue = parseFloat(String(record.discount));
          if (!isNaN(discountValue)) {
            return `${(discountValue * 100).toFixed(1)}%`;
          }
        }
        return <Text type="secondary">未设置</Text>;
      },
    },
    {
      title: "服务项",
      dataIndex: "servicewares",
      valueType: "text",
      search: false,
      width: 150,
      render: (_, record) => {
        if (Array.isArray(record.servicewares) && record.servicewares.length > 0) {
          return record.servicewares.join(', ');
        }
        return <Text type="secondary">未设置</Text>;
      },
    },
    {
      title: "定价配置",
      dataIndex: "pricing",
      valueType: "text",
      search: false,
      width: 200,
      render: (_, record) => {
        if (record.pricing) {
          try {
            return typeof record.pricing === 'string' ? record.pricing : JSON.stringify(record.pricing, null, 2);
          } catch (e) {
            return typeof record.pricing === 'object' ? JSON.stringify(record.pricing) : String(record.pricing);
          }
        }
        return <Text type="secondary">未设置</Text>;
      },
    },
    {
      title: "客户端参数",
      dataIndex: "clientArgs",
      valueType: "text",
      search: false,
      width: 200,
      render: (_, record) => {
        if (record.clientArgs) {
          try {
            const clientArgs = typeof record.clientArgs === 'string' ? record.clientArgs : JSON.stringify(record.clientArgs, null, 2);
            // 限制显示长度
            return clientArgs.length > 50 ? clientArgs.substring(0, 50) + '...' : clientArgs;
          } catch (e) {
            return typeof record.clientArgs === 'object' ? JSON.stringify(record.clientArgs) : String(record.clientArgs);
          }
        }
        return <Text type="secondary">未设置</Text>;
      },
    },
    {
      title: "请求参数",
      dataIndex: "requestArgs",
      valueType: "text",
      search: false,
      width: 200,
      render: (_, record) => {
        if (record.requestArgs) {
          try {
            const requestArgs = typeof record.requestArgs === 'string' ? record.requestArgs : JSON.stringify(record.requestArgs, null, 2);
            // 限制显示长度
            return requestArgs.length > 50 ? requestArgs.substring(0, 50) + '...' : requestArgs;
          } catch (e) {
            return typeof record.requestArgs === 'object' ? JSON.stringify(record.requestArgs) : String(record.requestArgs);
          }
        }
        return <Text type="secondary">未设置</Text>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      valueType: "dateTime",
      search: true,
      width: 180,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
      render: (_, record) => {
        if (record.createdAt) {
          const date = new Date(record.createdAt);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString('zh-CN');
          }
        }
        return <Text type="secondary">未设置</Text>;
      },
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      valueType: "dateTime",
      search: true,
      width: 180,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
      render: (_, record) => {
        if (record.updatedAt) {
          const date = new Date(record.updatedAt);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString('zh-CN');
          }
        }
        return <Text type="secondary">未设置</Text>;
      },
    },
    {
      title: "操作",
      valueType: "option",
      width: 200,
      fixed: "right",
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
          scroll={{ x: 1500 }}
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
        destroyOnClose
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
              placeholder='请输入JSON格式的定价配置，例如：{"type": "per_token", "input_price": 0.01, "output_price": 0.03}'
            />
          </Form.Item>
          
          <Form.Item
            name="clientArgs"
            label="客户端参数 (JSON)"
          >
            <TextArea
              rows={4}
              placeholder='请输入JSON格式的客户端参数，例如：{"temperature": 0.7, "max_tokens": 1024}'
            />
          </Form.Item>
          
          <Form.Item
            name="requestArgs"
            label="请求参数 (JSON)"
          >
            <TextArea
              rows={4}
              placeholder='请输入JSON格式的请求参数，例如：{"model": "gpt-4", "stream": true}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ModelConfigPage;