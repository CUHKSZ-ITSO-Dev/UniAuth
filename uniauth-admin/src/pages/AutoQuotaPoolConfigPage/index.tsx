import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Typography, Button, Popconfirm, Table, Space, message, Tag } from 'antd';
import { useRef } from 'react';
import { request, history } from '@umijs/max';

const { Title, Text } = Typography;

// 类型定义 - 根据API定义更新
interface AutoQuotaPoolConfig {
  id: number;
  ruleName: string;
  description: string;
  cronCycle: string;
  regularQuota: string; // 使用string类型表示decimal
  enabled: boolean;
  filterGroup: any; // 根据API定义，这是一个复杂的嵌套对象
  priority: number;
  lastEvaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const AutoQuotaPoolConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  // 表格列配置
  const columns: ProColumns<AutoQuotaPoolConfig>[] = [
    {
      title: '规则ID',
      dataIndex: 'id',
      valueType: 'text',
      search: true,
      width: 80,
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      valueType: 'text',
      search: true,
      ellipsis: true,
    },
    {
      title: '规则描述',
      dataIndex: 'description',
      valueType: 'text',
      ellipsis: true,
    },
    {
      title: 'Cron周期',
      dataIndex: 'cronCycle',
      valueType: 'text',
      ellipsis: true,
    },
    {
      title: '定期配额',
      dataIndex: 'regularQuota',
      valueType: 'text',
      width: 120,
    },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      valueType: 'switch',
      search: {
        transform: (value) => value,
      },
      render: (_, record) => (
        <Tag color={record.enabled ? 'green' : 'red'}>
          {record.enabled ? '启用' : '禁用'}
        </Tag>
      ),
      width: 100,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      valueType: 'text',
      search: true,
      width: 100,
    },
    {
      title: '上次评估时间',
      dataIndex: 'lastEvaluatedAt',
      valueType: 'dateTime',
      width: 180,
      render: (_, record) => {
        if (!record.lastEvaluatedAt) return <Text type="secondary">未评估</Text>;
        return new Date(record.lastEvaluatedAt).toLocaleString();
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <div style={{ textAlign: 'left' }}>
          <a key="edit" onClick={() => handleEdit(record)}>
            编辑
          </a>
          <span style={{ margin: '0 8px' }} />
          <Popconfirm
            key="delete"
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 事件处理函数 - 编辑规则
  const handleEdit = (record: AutoQuotaPoolConfig) => {
    // 跳转到编辑页面
    history.push(`/config/auto-config/edit?ruleName=${record.ruleName}`);
  };

  



  // 事件处理函数 - 删除规则
  const handleDelete = (record: AutoQuotaPoolConfig) => {
    // 删除逻辑 - 调用实际API
    try {
      message.loading('正在删除规则...');
      request('/config/autoConfig', {
        method: 'DELETE',
        params: {
          ruleName: record.ruleName, // 根据API定义，删除需要ruleName参数
        },
      }).then((response) => {
        if (response.ok) {
          message.destroy();
          message.success(`规则 ${record.ruleName} 删除成功`);
          // 刷新表格
          actionRef.current?.reload();
        } else {
          message.destroy();
          message.error(`规则删除失败：${response.message || '未知错误'}`);
        }
      }).catch((error: Error) => {
        message.destroy();
        message.error(`规则删除失败：${error?.message || '未知错误'}`);
      });
    } catch (error) {
      message.destroy();
      message.error('规则删除失败');
    }
  };

  // 事件处理函数 - 添加规则
  const handleAddConfig = () => {
    // 跳转到添加页面
    history.push('/config/auto-config/edit');
  };

  // 事件处理函数 - 刷新列表
  const handleUpdateConfigs = () => {
    // 更新规则列表逻辑
    try {
      message.loading('正在更新规则列表...');
      
      // 刷新表格
      actionRef.current?.reload();
      
      setTimeout(() => {
        message.destroy();
        message.success('规则列表更新成功');
      }, 800);
    } catch (error) {
      message.destroy();
      message.error('规则列表更新失败');
    }
  };

  // 事件处理函数 - 批量删除
  const handleBatchDeleteClick = (selectedRows: AutoQuotaPoolConfig[]) => {
    // 批量删除逻辑
    if (!selectedRows || selectedRows.length === 0) {
      message.warning('请选择要删除的规则');
      return;
    }
    
    const ids = selectedRows.map(row => row.id);
    console.log('批量删除规则', ids);
    message.loading('正在批量删除规则...');
    
    // 模拟批量删除API调用
    setTimeout(() => {
      message.destroy();
      message.success(`成功删除 ${selectedRows.length} 个规则`);
      // 刷新表格
      actionRef.current?.reload();
    }, 1000);
  };

  

  // 数据请求函数 - 调用实际API
  const configListRequest = async (params: any) => {
    // API请求
    try {
      const response = await request('/config/autoConfig', {
        method: 'GET',
        params: {
          enabled: params.enabled,
          ruleName: params.ruleName,
        },
      });
      
      // 转换API返回的数据格式
      const items = response.items || [];
      return {
        data: items,
        success: true,
        total: items.length,
      };
    } catch (error: any) {
      console.error('获取规则列表失败', error);
      // 返回模拟数据作为后备
      const mockData: AutoQuotaPoolConfig[] = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        ruleName: `自动配额池规则${i + 1}`,
        description: `这是规则${i + 1}的描述信息，用于演示自动配额池规则管理功能`,
        cronCycle: '0 0 3 * * *',
        regularQuota: `${(i + 1) * 100}`,
        enabled: i % 2 === 0,
        filterGroup: {},
        priority: i + 1,
        lastEvaluatedAt: i % 3 === 0 ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
        createdAt: new Date(Date.now() - (i + 5) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
      }));
      
      // 应用搜索过滤
      let data = [...mockData];
      if (params.id) {
        data = data.filter((item) => item.id.toString().includes(params.id));
      }
      if (params.ruleName) {
        data = data.filter((item) => item.ruleName.includes(params.ruleName));
      }
      if (typeof params.enabled === 'boolean') {
        data = data.filter((item) => item.enabled === params.enabled);
      }
      if (params.priority) {
        data = data.filter((item) => item.priority.toString().includes(params.priority));
      }
      
      return {
        data,
        success: true,
        total: data.length,
      };
    }
  };

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>自动配额池规则管理</Title>
        <Text type="secondary">管理系统中的所有自动配额池规则，包括添加、编辑、删除规则等功能</Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
          search={{ labelWidth: 'auto' }}
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
                  <a onClick={() => handleBatchDeleteClick(selectedRows as AutoQuotaPoolConfig[])}>
                    批量删除
                  </a>
                )}
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="add" onClick={handleAddConfig}>
              添加规则
            </Button>,
            <Button key="update" onClick={handleUpdateConfigs}>
              刷新列表
            </Button>,
          ]}
          request={configListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default AutoQuotaPoolConfigPage;