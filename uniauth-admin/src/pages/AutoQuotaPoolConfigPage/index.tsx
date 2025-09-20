import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Table, Space, message, Modal, Form, Input, InputNumber, Switch } from "antd";
import { useRef, useState } from "react";
import {
  getConfigAutoConfig,
  postConfigAutoConfig,
  putConfigAutoConfig,
  deleteConfigAutoConfig,
} from "@/services/uniauthService/autoQuotaPoolConfig";

const { Title, Text } = Typography;

const AutoQuotaPoolConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<API.AutoQuotaPoolItem | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (record: API.AutoQuotaPoolItem) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      filterGroup: record.filterGroup ? JSON.stringify(record.filterGroup, null, 2) : '',
      upnsCache: record.upnsCache ? JSON.stringify(record.upnsCache, null, 2) : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: API.AutoQuotaPoolItem) => {
    try {
      await deleteConfigAutoConfig({ ruleName: record.ruleName });
      message.success("删除成功");
      actionRef.current?.reload();
    } catch (error) {
      message.error("删除失败");
      console.error("删除自动配额池配置失败:", error);
    }
  };

  const handleNewConfig = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理JSON字段
      let processedValues: any = {
        ...values,
        regularQuota: values.regularQuota ? parseFloat(values.regularQuota) : null,
        priority: values.priority ? parseInt(values.priority) : null,
        enabled: values.enabled !== undefined ? values.enabled : true,
      };
      
      // 处理filterGroup JSON字段
      if (values.filterGroup) {
        try {
          processedValues.filterGroup = JSON.parse(values.filterGroup);
        } catch (e) {
          message.error("保存失败：过滤条件组(JSON)格式不正确，请检查语法");
          return;
        }
      }
      
      // 处理upnsCache JSON字段
      if (values.upnsCache) {
        try {
          processedValues.upnsCache = JSON.parse(values.upnsCache);
        } catch (e) {
          message.error("保存失败：UPN缓存列表(JSON)格式不正确，请检查语法");
          return;
        }
      }
      
      if (editingRecord) {
        // 编辑现有配置
        await putConfigAutoConfig(processedValues);
        message.success("更新成功");
      } else {
        // 添加新配置
        await postConfigAutoConfig(processedValues);
        message.success("添加成功");
      }
      
      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error("保存自动配额池配置失败:", error);
      
      // 提供更详细的错误信息
      let errorMessage = "保存失败";
      
      // 检查是否是字段验证错误
      if (error.message && error.message.includes("ruleName")) {
        errorMessage = "保存失败：规则名称不能为空";
      } else if (error.message && error.message.includes("cronCycle")) {
        errorMessage = "保存失败：刷新周期(Cron表达式)不能为空";
      } else if (error.message && error.message.includes("regularQuota")) {
        errorMessage = "保存失败：定期配额不能为空或格式不正确";
      } 
      // 检查是否是网络或服务器错误
      else if (error.message && (error.message.includes("请求失败") || error.message.includes("network"))) {
        errorMessage = "保存失败：网络或服务器错误，请稍后重试";
      } 
      // 其他错误
      else {
        errorMessage = error.message || "保存失败，请检查输入内容是否正确";
      }
      
      message.error(errorMessage);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const configListRequest = async (params: any) => {
    try {
      const response = await getConfigAutoConfig(params);
      
      if (response.items) {
        // 根据查询参数过滤数据
        let data = response.items || [];
        
        if (params.ruleName) {
          data = data.filter((item: API.AutoQuotaPoolItem) => 
            item.ruleName?.includes(params.ruleName)
          );
        }
        
        if (params.description) {
          data = data.filter((item: API.AutoQuotaPoolItem) => 
            item.description?.includes(params.description)
          );
        }
        
        if (params.enabled !== undefined) {
          data = data.filter((item: API.AutoQuotaPoolItem) => 
            item.enabled === params.enabled
          );
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
      console.error("获取自动配额池配置列表失败:", error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const columns: ProColumns<API.AutoQuotaPoolItem>[] = [
    {
      title: "规则名称",
      dataIndex: "ruleName",
      valueType: "text",
      search: true,
    },
    {
      title: "规则说明",
      dataIndex: "description",
      valueType: "text",
      search: true,
      render: (_, record) => record.description || <Text type="secondary">未设置</Text>,
    },
    {
      title: "刷新周期",
      dataIndex: "cronCycle",
      valueType: "text",
      search: false,
    },
    {
      title: "定期配额",
      dataIndex: "regularQuota",
      valueType: "digit",
      search: false,
      render: (_, record) => record.regularQuota || <Text type="secondary">未设置</Text>,
    },
    {
      title: "是否启用",
      dataIndex: "enabled",
      valueType: "select",
      search: true,
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => record.enabled ? '启用' : '禁用',
    },
    {
      title: "优先级",
      dataIndex: "priority",
      valueType: "digit",
      search: false,
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
            title="确定要删除该自动配额池配置吗？"
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
        <Title level={4}>自动配额池配置列表</Title>
        <Text type="secondary">
          管理系统中的自动配额池配置规则
        </Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="ruleName"
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
            <Button type="primary" key="new" onClick={handleNewConfig}>
              添加新的自动配额池配置
            </Button>,
          ]}
          request={configListRequest}
        />
      </ProCard>

      <Modal
        title={editingRecord ? "编辑自动配额池配置" : "添加自动配额池配置"}
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
            name="ruleName"
            label="规则名称"
            rules={[{ required: true, message: "请输入规则名称" }]}
          >
            <Input placeholder="请输入唯一的规则名称" disabled={!!editingRecord} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="规则说明"
          >
            <Input placeholder="请输入规则说明" />
          </Form.Item>
          
          <Form.Item
            name="cronCycle"
            label="刷新周期 (Cron表达式)"
            rules={[{ required: true, message: "请输入刷新周期" }]}
          >
            <Input placeholder="请输入Cron表达式，如: 0 0 3 * * *" />
          </Form.Item>
          
          <Form.Item
            name="regularQuota"
            label="定期配额"
            rules={[{ required: true, message: "请输入定期配额" }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              placeholder="请输入定期配额" 
              min={0}
            />
          </Form.Item>
          
          <Form.Item
            name="enabled"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="优先级"
          >
            <InputNumber 
              style={{ width: '100%' }}
              placeholder="请输入优先级，数值越小优先级越高" 
              min={0}
            />
          </Form.Item>
          
          <Form.Item
            name="filterGroup"
            label="过滤条件组 (JSON)"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (e) {
                    return Promise.reject(new Error('JSON格式不正确，请检查语法'));
                  }
                },
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入JSON格式的过滤条件组"
            />
          </Form.Item>
          
          <Form.Item
            name="upnsCache"
            label="UPN缓存列表 (JSON)"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (e) {
                    return Promise.reject(new Error('JSON格式不正确，请检查语法'));
                  }
                },
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入JSON格式的UPN缓存列表"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AutoQuotaPoolConfigPage;