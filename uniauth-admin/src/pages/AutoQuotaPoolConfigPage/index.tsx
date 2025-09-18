import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable, ProForm, ModalForm, ProFormText, ProFormSwitch, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import { Typography, Button, Popconfirm, Table, Space, message, Drawer, Form, Input, Card, Row, Col, Tag, Divider, Switch } from 'antd';
import { useRef, useState, useEffect } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PlayCircleOutlined, FileSearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// 数据模型定义
interface AutoQuotaPoolRule {
  id: number;
  ruleName: string;
  description: string;
  enabled: boolean;
  priority: number;
  quotaPoolNames: string[];
  lastEvaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
  matchedUsersCount?: number;
}

interface AutoQuotaPoolCondition {
  id: number;
  ruleId: number;
  parentConditionId?: number;
  conditionType: 'field' | 'group';
  logicalOperator: 'AND' | 'OR';
  fieldName?: string;
  operator?: string;
  fieldValue?: string;
  fieldValues?: string[];
  sortOrder: number;
  createdAt: string;
}

// 模拟API请求函数
const mockApiRequest = async (url: string, options?: any) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 根据URL返回不同的模拟数据
  if (url.includes('/autoQuotaPool/autoQuotaPool/rules') && options?.method === 'GET') {
    // 获取规则列表
    return {
      data: {
        rules: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          ruleName: `规则${i + 1}`,
          description: `这是规则${i + 1}的描述信息`,
          enabled: i % 2 === 0,
          priority: i + 1,
          quotaPoolNames: [`配额池${(i % 3) + 1}`, `配额池${((i + 1) % 3) + 1}`],
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
          matchedUsersCount: Math.floor(Math.random() * 100),
        })),
        total: 8,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      success: true,
    };
  } else if (url.includes('/autoQuotaPool/autoQuotaPool/rules') && options?.method === 'POST') {
    // 新增规则
    return {
      data: { id: Date.now() },
      success: true,
    };
  } else if (url.includes('/autoQuotaPool/autoQuotaPool/rules/') && options?.method === 'PUT') {
    // 编辑规则
    return {
      data: { id: parseInt(url.split('/').pop() || '0') },
      success: true,
    };
  } else if (url.includes('/autoQuotaPool/autoQuotaPool/rules/') && options?.method === 'DELETE') {
    // 删除规则
    return {
      data: {},
      success: true,
    };
  } else if (url.includes('/autoQuotaPool/autoQuotaPool/rules/') && url.includes('/conditions') && options?.method === 'GET') {
    // 获取规则条件
    const ruleId = parseInt(url.split('/')[6]);
    return {
      data: {
        conditions: Array.from({ length: 3 }, (_, i) => ({
          id: i + 1,
          ruleId: ruleId,
          conditionType: i % 2 === 0 ? 'field' : 'group',
          logicalOperator: i % 2 === 0 ? 'AND' : 'OR',
          fieldName: `字段${i + 1}`,
          operator: i % 3 === 0 ? 'equals' : i % 3 === 1 ? 'contains' : 'startsWith',
          fieldValue: `值${i + 1}`,
          sortOrder: i + 1,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        })),
      },
      success: true,
    };
  } else if (url.includes('/autoQuotaPool/autoQuotaPool/reevaluate') && options?.method === 'POST') {
    // 重新评估
    return {
      data: {},
      success: true,
    };
  } else if (url.includes('/autoQuotaPool/autoQuotaPool/stats') && options?.method === 'GET') {
    // 获取统计信息
    return {
      data: {
        totalRules: 8,
        enabledRules: 4,
        totalConditions: 24,
        lastEvaluatedAt: new Date().toISOString(),
      },
      success: true,
    };
  }
  
  return {
    data: {},
    success: true,
  };
};

// 表格列配置
const columns = (actionRef: React.MutableRefObject<ActionType | null>, setEditRule: React.Dispatch<React.SetStateAction<AutoQuotaPoolRule | undefined>>, setViewConditions: React.Dispatch<React.SetStateAction<number | undefined>>): ProColumns<AutoQuotaPoolRule>[] => [
  {
    title: '规则名称',
    dataIndex: 'ruleName',
    valueType: 'text',
    search: true,
    width: 150,
  },
  {
    title: '描述',
    dataIndex: 'description',
    valueType: 'text',
    search: true,
    width: 200,
  },
  {
    title: '状态',
    dataIndex: 'enabled',
    valueType: 'select',
    valueEnum: {
      true: { text: '启用', status: 'Success' },
      false: { text: '禁用', status: 'Default' },
    },
    width: 80,
    render: (_, record) => (
      <Switch 
        checked={record.enabled} 
        size="small" 
        onChange={(checked) => {
          // 更新规则状态
          message.success(`规则"${record.ruleName}"已${checked ? '启用' : '禁用'}`);
          actionRef.current?.reload();
        }}
      />
    ),
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    valueType: 'digit',
    width: 80,
  },
  {
    title: '目标配额池',
    dataIndex: 'quotaPoolNames',
    valueType: 'text',
    width: 200,
    render: (_, record) => (
      <Space wrap>
        {record.quotaPoolNames.map((name, index) => (
          <Tag key={index} color="blue">{name}</Tag>
        ))}
      </Space>
    ),
  },
  {
    title: '匹配用户数',
    dataIndex: 'matchedUsersCount',
    valueType: 'digit',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    valueType: 'dateTime',
    width: 150,
  },
  {
    title: '操作',
    valueType: 'option',
    width: 250,
    fixed: 'right',
    render: (_, record) => (
      <Space>
        <a 
          key="edit" 
          onClick={() => setEditRule(record)}
        >
          <EditOutlined /> 编辑
        </a>
        <a 
          key="conditions" 
          onClick={() => setViewConditions(record.id)}
        >
          <FileSearchOutlined /> 条件
        </a>
        <Popconfirm
          key="delete"
          title="确定要删除这个规则吗？"
          onConfirm={async () => {
            try {
              await mockApiRequest(`/autoQuotaPool/autoQuotaPool/rules/${record.id}`, { method: 'DELETE' });
              message.success(`规则"${record.ruleName}"删除成功`);
              actionRef.current?.reload();
            } catch (error) {
              message.error('删除失败');
            }
          }}
          okText="确定"
          cancelText="取消"
        >
          <a style={{ color: 'red' }}>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>
      </Space>
    ),
  },
];

// 条件管理组件
const ConditionManager: React.FC<{ 
  ruleId: number; 
  open: boolean; 
  onClose: () => void;
  onReload: () => void;
}> = ({ ruleId, open, onClose, onReload }) => {
  const [conditions, setConditions] = useState<AutoQuotaPoolCondition[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 获取条件列表
  // 获取规则条件
  const fetchConditions = async () => {
    if (!ruleId) return;
    
    setLoading(true);
    try {
      const res = await mockApiRequest(`/autoQuotaPool/autoQuotaPool/rules/${ruleId}/conditions`, { method: 'GET' });
      if (res.success) {
        // 修复类型不兼容问题：将string类型转换为'field' | 'group'类型
        const conditions = (res.data.conditions || []).map((condition: any) => ({
          ...condition,
          conditionType: condition.conditionType === 'field' || condition.conditionType === 'group' 
            ? condition.conditionType 
            : 'field' // 默认值
        }));
        setConditions(conditions);
      }
    } catch (error) {
      message.error('获取条件列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 删除条件
  const deleteCondition = async (id: number) => {
    try {
      await mockApiRequest(`/autoQuotaPool/autoQuotaPool/conditions/${id}`, { method: 'DELETE' });
      message.success('条件删除成功');
      fetchConditions();
      onReload();
    } catch (error) {
      message.error('删除失败');
    }
  };
  
  // 初始化数据
  useEffect(() => {
    if (open) {
      fetchConditions();
    }
  }, [open]);
  
  return (
    <Drawer
      title="条件管理"
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => message.info('添加条件功能待实现')}
        >
          添加条件
        </Button>
      </div>
      
      <Table
        loading={loading}
        dataSource={conditions}
        pagination={false}
        rowKey="id"
        columns={[
          {
            title: '类型',
            dataIndex: 'conditionType',
            render: (_, record) => (
              <Tag color={record.conditionType === 'field' ? 'green' : 'orange'}>
                {record.conditionType === 'field' ? '字段' : '分组'}
              </Tag>
            ),
          },
          {
            title: '逻辑',
            dataIndex: 'logicalOperator',
          },
          {
            title: '字段名',
            dataIndex: 'fieldName',
          },
          {
            title: '操作符',
            dataIndex: 'operator',
          },
          {
            title: '值',
            dataIndex: 'fieldValue',
          },
          {
            title: '排序',
            dataIndex: 'sortOrder',
          },
          {
            title: '操作',
            render: (_, record) => (
              <Space>
                <a onClick={() => message.info('编辑条件功能待实现')}>
                  <EditOutlined /> 编辑
                </a>
                <Popconfirm
                  title="确定要删除这个条件吗？"
                  onConfirm={() => deleteCondition(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <a style={{ color: 'red' }}>
                    <DeleteOutlined /> 删除
                  </a>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

// 规则表单组件
const RuleForm: React.FC<{ 
  rule?: AutoQuotaPoolRule; 
  open: boolean; 
  onClose: () => void;
  onFinish: (values: any) => Promise<void>; // 修复类型定义
}> = ({ rule, open, onClose, onFinish }) => {
  const [form] = Form.useForm();
  
  return (
    <ModalForm
      title={rule ? "编辑规则" : "新增规则"}
      open={open}
      form={form}
      onOpenChange={(open: boolean) => {
        if (!open) {
          onClose();
          form.resetFields();
        }
      }}
      onFinish={async (values) => { // 修复onFinish函数返回类型
        await onFinish(values);
        return true;
      }}
      width={600}
    >
      <ProFormText
        name="ruleName"
        label="规则名称"
        rules={[{ required: true, message: '请输入规则名称' }]}
        initialValue={rule?.ruleName}
      />
      <ProFormText
        name="description"
        label="描述"
        initialValue={rule?.description}
      />
      <ProFormSwitch
        name="enabled"
        label="是否启用"
        initialValue={rule?.enabled ?? true}
      />
      <ProFormDigit
        name="priority"
        label="优先级"
        min={1}
        rules={[{ required: true, message: '请输入优先级' }]}
        initialValue={rule?.priority}
      />
      <ProFormSelect
        name="quotaPoolNames"
        label="目标配额池"
        mode="multiple"
        options={[
          { label: '配额池1', value: '配额池1' },
          { label: '配额池2', value: '配额池2' },
          { label: '配额池3', value: '配额池3' },
        ]}
        rules={[{ required: true, message: '请选择目标配额池' }]}
        initialValue={rule?.quotaPoolNames}
      />
    </ModalForm>
  );
};

const AutoQuotaPoolConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [editRule, setEditRule] = useState<AutoQuotaPoolRule | undefined>(undefined);
  const [viewConditions, setViewConditions] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState<any>(null);
  
  // 获取统计信息
  const fetchStats = async () => {
    try {
      const res = await mockApiRequest('/autoQuotaPool/autoQuotaPool/stats', { method: 'GET' });
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      message.error('获取统计信息失败');
    }
  };
  
  // 重新评估所有规则
  const reevaluateRules = async () => {
    try {
      await mockApiRequest('/autoQuotaPool/autoQuotaPool/reevaluate', { 
        method: 'POST',
        body: JSON.stringify({}),
      });
      message.success('重新评估任务已启动');
      fetchStats();
    } catch (error) {
      message.error('重新评估失败');
    }
  };
  
  // 测试规则
  const testRule = () => {
    message.info('测试规则功能待实现');
  };
  
  // 初始化统计信息
  useEffect(() => {
    fetchStats();
  }, []);
  
  return (
    <PageContainer>
      {/* 统计信息卡片 */}
      <ProCard style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <div>总规则数</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {stats?.totalRules || 0}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div>启用规则数</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {stats?.enabledRules || 0}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div>总条件数</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {stats?.totalConditions || 0}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div>上次评估</div>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                {stats?.lastEvaluatedAt ? new Date(stats.lastEvaluatedAt).toLocaleString() : '无'}
              </div>
            </Card>
          </Col>
        </Row>
      </ProCard>
      
      <ProCard>
        <Title level={4}>自动配额池规则管理</Title>
        <Text type="secondary">管理系统中的所有自动配额池规则</Text>
        <ProTable<AutoQuotaPoolRule>
          columns={columns(actionRef, setEditRule, setViewConditions)}
          actionRef={actionRef}
          rowKey="id"
          search={{ labelWidth: 'auto' }}
          pagination={{
            pageSize: 20,
          }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          }}
          tableAlertRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => {
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
          tableAlertOptionRender={({ selectedRowKeys, selectedRows }) => {
            return (
              <Space size={16}>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title="确定要删除选中的规则吗？"
                    onConfirm={async () => {
                      try {
                        // 批量删除逻辑
                        for (const row of selectedRows) {
                          await mockApiRequest(`/autoQuotaPool/autoQuotaPool/rules/${row.id}`, { method: 'DELETE' });
                        }
                        message.success(`成功删除 ${selectedRows.length} 个规则`);
                        actionRef.current?.reload();
                      } catch (error) {
                        message.error('批量删除失败');
                      }
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <a style={{ color: 'red' }}>批量删除</a>
                  </Popconfirm>
                )}
              </Space>
            );
          }}
          toolBarRender={() => [
            <RuleForm
              key="add-form"
              open={!!editRule && !editRule.id}
              rule={editRule}
              onClose={() => setEditRule(undefined)}
              onFinish={async (values) => {
                try {
                  await mockApiRequest('/autoQuotaPool/autoQuotaPool/rules', { 
                    method: 'POST',
                    body: JSON.stringify(values),
                  });
                  message.success('规则添加成功');
                  setEditRule(undefined);
                  actionRef.current?.reload();
                  return Promise.resolve(); // 确保返回Promise
                } catch (error) {
                  message.error('添加失败');
                  return Promise.reject(error); // 确保返回Promise
                }
              }}
            />,
            <Button 
              type="primary" 
              key="add" 
              icon={<PlusOutlined />}
              onClick={() => setEditRule({} as AutoQuotaPoolRule)}
            >
              新增规则
            </Button>,
            <Button 
              key="test" 
              icon={<PlayCircleOutlined />}
              onClick={testRule}
            >
              测试规则
            </Button>,
            <Button 
              key="reevaluate" 
              onClick={reevaluateRules}
            >
              重新评估
            </Button>,
          ]}
          request={async (params) => {
            const res = await mockApiRequest('/autoQuotaPool/autoQuotaPool/rules', { 
              method: 'GET',
              params: {
                page: params.current,
                pageSize: params.pageSize,
                ruleName: params.ruleName,
                enabled: params.enabled,
              },
            });
            
            if (res.success) {
              return {
                data: res.data.rules,
                success: true,
                total: res.data.total,
              };
            }
            
            return {
              data: [],
              success: false,
              total: 0,
            };
          }}
        />
      </ProCard>
      
      {/* 编辑规则表单 */}
      <RuleForm
        key="edit-form"
        open={!!editRule && !!editRule.id}
        rule={editRule}
        onClose={() => setEditRule(undefined)}
        onFinish={async (values) => {
          if (!editRule?.id) return Promise.resolve();
          
          try {
            await mockApiRequest(`/autoQuotaPool/autoQuotaPool/rules/${editRule.id}`, { 
              method: 'PUT',
              body: JSON.stringify(values),
            });
            message.success('规则更新成功');
            setEditRule(undefined);
            actionRef.current?.reload();
            return Promise.resolve(); // 确保返回Promise
          } catch (error) {
            message.error('更新失败');
            return Promise.reject(error); // 确保返回Promise
          }
        }}
      />
      
      {/* 条件管理抽屉 */}
      <ConditionManager
        ruleId={viewConditions || 0}
        open={!!viewConditions}
        onClose={() => setViewConditions(undefined)}
        onReload={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default AutoQuotaPoolConfigPage;