import { PageContainer, ProCard, ProTable, ModalForm, ProFormText, ProFormSelect } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Table, Space, message, Tag } from "antd";
import { useRef, useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { 
  filterPolicies as filterPoliciesAPI,
  addPolicies as addPoliciesAPI,
  deletePolicies as deletePoliciesAPI,
  editPolicy as editPolicyAPI,
  type PolicyFilterRequest,
} from "@/services/policyService";

const { Title, Text } = Typography;

// 策略数据类型
interface PolicyItem {
  id?: string;
  subject: string;
  object: string;
  action: string;
  effect: string;
  raw?: string[];
}

// 示例数据
const policiesExampleData: PolicyItem[] = [
  {
    id: "1",
    subject: "alice",
    object: "chat_production",
    action: "platform",
    effect: "entry",
    raw: ["alice", "chat_production", "platform", "entry"]
  },
  {
    id: "2", 
    subject: "bob",
    object: "data_service",
    action: "read",
    effect: "allow",
    raw: ["bob", "data_service", "read", "allow"]
  },
  {
    id: "3",
    subject: "admin",
    object: "system",
    action: "manage",
    effect: "allow",
    raw: ["admin", "system", "manage", "allow"]
  },
  {
    id: "4",
    subject: "user_group",
    object: "api_gateway",
    action: "access",
    effect: "deny",
    raw: ["user_group", "api_gateway", "access", "deny"]
  },
  {
    id: "5",
    subject: "service_account",
    object: "database",
    action: "write",
    effect: "allow",
    raw: ["service_account", "database", "write", "allow"]
  },
];

// API 请求函数
const filterPolicies = async (params: any) => {
  try {
    // 构建筛选参数
    const filterRequest: PolicyFilterRequest = {
      subs: params.subject ? [params.subject] : [],
      objs: params.object ? [params.object] : [],
      acts: params.action ? [params.action] : [],
    };
    
    const response = await filterPoliciesAPI(filterRequest);
    
    // 将 API 返回的二维数组转换为表格需要的格式
    const formattedData = response.policies.map((policy, index) => ({
      id: `${index + 1}`,
      subject: policy[0] || '',
      object: policy[1] || '',
      action: policy[2] || '',
      effect: policy[3] || '',
      raw: policy,
    }));
    
    return {
      data: formattedData,
      success: true,
      total: formattedData.length,
    };
  } catch (error) {
    message.error('获取策略列表失败');
    console.error('Filter policies error:', error);
    
    // 如果 API 调用失败，返回示例数据
    let filteredData = [...policiesExampleData];
    
    if (params.subject) {
      filteredData = filteredData.filter(item => 
        item.subject.toLowerCase().includes(params.subject.toLowerCase())
      );
    }
    if (params.object) {
      filteredData = filteredData.filter(item => 
        item.object.toLowerCase().includes(params.object.toLowerCase())
      );
    }
    if (params.action) {
      filteredData = filteredData.filter(item => 
        item.action.toLowerCase().includes(params.action.toLowerCase())
      );
    }
    
    return {
      data: filteredData,
      success: true,
      total: filteredData.length,
    };
  }
};

const addPolicies = async (policies: string[][]) => {
  try {
    await addPoliciesAPI({
      polices: policies,
      skip: false,
    });
    return true;
  } catch (error) {
    console.error('Add policies error:', error);
    message.error('添加策略失败');
    return false;
  }
};

const deletePolicies = async (policies: string[][]) => {
  try {
    await deletePoliciesAPI({
      polices: policies,
    });
    return true;
  } catch (error) {
    console.error('Delete policies error:', error);
    message.error('删除策略失败');
    return false;
  }
};

const editPolicy = async (oldPolicy: string, newPolicy: string[]) => {
  try {
    await editPolicyAPI({
      oldPolicy,
      newPolicy,
    });
    return true;
  } catch (error) {
    console.error('Edit policy error:', error);
    message.error('编辑策略失败');
    return false;
  }
};

const PolicyListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<PolicyItem[]>([]);

  // 处理函数
  const handleEdit = (record: PolicyItem) => {
    setEditingPolicy(record);
    setEditModalVisible(true);
  };

  const handleDelete = async (record: PolicyItem) => {
    if (record.raw) {
      const success = await deletePolicies([record.raw]);
      if (success) {
        message.success("删除成功");
        actionRef.current?.reload();
      }
    }
  };

  const handleBatchDelete = async (selectedRows: PolicyItem[]) => {
    const policies = selectedRows.map(row => row.raw).filter(Boolean) as string[][];
    const success = await deletePolicies(policies);
    if (success) {
      message.success(`批量删除 ${policies.length} 条规则成功`);
      actionRef.current?.reload();
      setSelectedRowKeys([]);
      setSelectedRows([]);
    }
  };

  // 表格列配置
  const columns: ProColumns<PolicyItem>[] = [
    {
      title: "主体 (Subject)",
      dataIndex: "subject",
      valueType: "text",
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <Tag color="blue">{record.subject}</Tag>
      ),
    },
    {
      title: "对象 (Object)",
      dataIndex: "object",
      valueType: "text",
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <Tag color="green">{record.object}</Tag>
      ),
    },
    {
      title: "操作 (Action)",
      dataIndex: "action",
      valueType: "text",
      width: 150,
      ellipsis: true,
      render: (_, record) => (
        <Tag color="orange">{record.action}</Tag>
      ),
    },
    {
      title: "效果 (Effect)",
      dataIndex: "effect",
      valueType: "text",
      width: 150,
      render: (_, record) => (
        <Tag color={record.effect === "allow" ? "success" : record.effect === "deny" ? "error" : "default"}>
          {record.effect}
        </Tag>
      ),
    },
    {
      title: "完整规则",
      dataIndex: "raw",
      valueType: "text",
      ellipsis: true,
      width: 300,
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          [{record.raw?.map(item => `'${item}'`).join(', ')}]
        </Text>
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <a key="edit" onClick={() => handleEdit(record)}>
            <EditOutlined /> 编辑
          </a>
          <Popconfirm
            key="delete"
            title="确定要删除该规则吗？"
            description="删除后将无法恢复"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <a style={{ color: "#ff4d4f" }}>
              <DeleteOutlined /> 删除
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>策略规则列表</Title>
        <Text type="secondary">
          管理系统访问控制策略，配置用户、资源和操作的权限规则
        </Text>
        
        <ProTable<PolicyItem>
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
          search={{
            labelWidth: 'auto',
            searchText: '查询',
            resetText: '重置',
            defaultCollapsed: false,
            collapseRender: false,
            optionRender: ({ searchText, resetText }, { form }) => [
              <Button
                key="search"
                type="primary"
                onClick={() => {
                  form?.submit();
                }}
              >
                {searchText}
              </Button>,
              <Button
                key="reset"
                onClick={() => {
                  form?.resetFields();
                  form?.submit();
                }}
              >
                {resetText}
              </Button>,
            ],
          }}
          form={{
            syncToUrl: false,
          }}
          pagination={{
            defaultPageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
            selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys);
              setSelectedRows(rows);
            },
          }}
          tableAlertRender={({
            selectedRowKeys,
            onCleanSelected,
          }) => {
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
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRowKeys.length} 条规则吗？`}
                  onConfirm={() => handleBatchDelete(selectedRows)}
                  okText="确定"
                  cancelText="取消"
                >
                  <a style={{ color: "#ff4d4f" }}>批量删除</a>
                </Popconfirm>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button 
              type="primary" 
              key="new"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              添加策略规则
            </Button>,
          ]}
          request={async (params) => {
            const searchParams = {
              subject: params.subject,
              object: params.object,
              action: params.action,
              ...params,
            };
            return await filterPolicies(searchParams);
          }}
          scroll={{ x: 1200 }}
        />
      </ProCard>

      {/* 创建策略弹窗 */}
      <ModalForm
        title="添加策略规则"
        width={500}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={async (values) => {
          const policy = [
            values.subject,
            values.object,
            values.action,
            values.effect || 'allow'
          ];
          const success = await addPolicies([policy]);
          if (success) {
            message.success('添加成功');
            actionRef.current?.reload();
            return true;
          }
          return false;
        }}
      >
        <ProFormText
          name="subject"
          label="主体 (Subject)"
          placeholder="请输入主体，如: alice, user_group"
          rules={[{ required: true, message: '请输入主体' }]}
        />
        <ProFormText
          name="object"
          label="对象 (Object)"
          placeholder="请输入对象，如: chat_production, database"
          rules={[{ required: true, message: '请输入对象' }]}
        />
        <ProFormText
          name="action"
          label="操作 (Action)"
          placeholder="请输入操作，如: read, write, manage"
          rules={[{ required: true, message: '请输入操作' }]}
        />
        <ProFormSelect
          name="effect"
          label="效果 (Effect)"
          placeholder="请选择效果"
          options={[
            { label: 'Allow', value: 'allow' },
            { label: 'Deny', value: 'deny' },
            { label: 'Entry', value: 'entry' },
          ]}
          rules={[{ required: true, message: '请选择效果' }]}
        />
      </ModalForm>

      {/* 编辑策略弹窗 */}
      <ModalForm
        title="编辑策略规则"
        width={500}
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        initialValues={editingPolicy || {}}
        onFinish={async (values) => {
          if (editingPolicy?.raw) {
            const oldPolicyStr = `[${editingPolicy.raw.map(item => `'${item}'`).join(',')}]`;
            const newPolicy = [
              values.subject,
              values.object,
              values.action,
              values.effect || 'allow'
            ];
            const success = await editPolicy(oldPolicyStr, newPolicy);
            if (success) {
              message.success('编辑成功');
              actionRef.current?.reload();
              setEditingPolicy(null);
              return true;
            }
          }
          return false;
        }}
      >
        <ProFormText
          name="subject"
          label="主体 (Subject)"
          placeholder="请输入主体"
          rules={[{ required: true, message: '请输入主体' }]}
        />
        <ProFormText
          name="object"
          label="对象 (Object)"
          placeholder="请输入对象"
          rules={[{ required: true, message: '请输入对象' }]}
        />
        <ProFormText
          name="action"
          label="操作 (Action)"
          placeholder="请输入操作"
          rules={[{ required: true, message: '请输入操作' }]}
        />
        <ProFormSelect
          name="effect"
          label="效果 (Effect)"
          placeholder="请选择效果"
          options={[
            { label: 'Allow', value: 'allow' },
            { label: 'Deny', value: 'deny' },
            { label: 'Entry', value: 'entry' },
          ]}
          rules={[{ required: true, message: '请选择效果' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default PolicyListPage;