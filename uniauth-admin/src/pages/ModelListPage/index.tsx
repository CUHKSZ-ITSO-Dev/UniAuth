// 导入依赖组件
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Typography, Button, Popconfirm, Table, Space, message } from 'antd';
import { useRef } from 'react';

const { Title, Text } = Typography;

// 类型定义
interface ModelConfig {
  approach_name: string;
  pricing: string; // JSONB
  discount: number;
  client_type: string;
  client_args: string; // JSONB
  request_args: string; // JSONB
  servicewares: string[]; // VARCHAR(255)[]
  updated_at: string; // TIMESTAMP
  created_at: string; // TIMESTAMP
}

// 示例数据
const modelExampleData = Array.from({ length: 51 }, (_, i) => ({
  approach_name: `approach_${i + 1}`,
  pricing: JSON.stringify({ price: 100, currency: 'USD' }),
  discount: 0.1 * i,
  client_type: `client_type_${(i % 3) + 1}`,
  client_args: JSON.stringify({ arg1: `value${i + 1}_1`, arg2: `value${i + 1}_2` }),
  request_args: JSON.stringify({ req_arg1: `req_value${i + 1}_1` }),
  servicewares: [`service_${i + 1}_a`, `service_${i + 1}_b`],
  updated_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  created_at: new Date(Date.now() - Math.floor(Math.random() * 100000000000)).toISOString(),
}));

// 表格列配置
const columns: ProColumns<ModelConfig>[] = [
  {
    title: '方案名称',
    dataIndex: 'approach_name',
    valueType: 'text',
    search: true,
    width: 150,
  },
  {
    title: '定价',
    dataIndex: 'pricing',
    valueType: 'text',
    search: false,
    width: 200,
    ellipsis: true,
    render: (_, record) => {
      try {
        const parsed = JSON.parse(record.pricing);
        return (
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {JSON.stringify(parsed)}
          </div>
        );
      } catch (e) {
        return (
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {record.pricing}
          </div>
        );
      }
    },
  },
  {
    title: '折扣',
    dataIndex: 'discount',
    valueType: 'digit',
    search: true,
    width: 100,
  },
  {
    title: '客户端类型',
    dataIndex: 'client_type',
    valueType: 'text',
    search: true,
    width: 150,
  },
  {
    title: '客户端参数',
    dataIndex: 'client_args',
    valueType: 'text',
    search: false,
    width: 200,
    ellipsis: true,
    render: (_, record) => {
      try {
        const parsed = JSON.parse(record.client_args);
        return (
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {JSON.stringify(parsed)}
          </div>
        );
      } catch (e) {
        return (
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {record.client_args}
          </div>
        );
      }
    },
  },
  {
    title: '请求参数',
    dataIndex: 'request_args',
    valueType: 'text',
    search: false,
    width: 200,
    ellipsis: true,
    render: (_, record) => {
      try {
        const parsed = JSON.parse(record.request_args);
        return (
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {JSON.stringify(parsed)}
          </div>
        );
      } catch (e) {
        return (
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {record.request_args}
          </div>
        );
      }
    },
  },
  {
    title: '服务项',
    dataIndex: 'servicewares',
    valueType: 'text',
    search: false,
    width: 150,
    render: (_, record) => record.servicewares.join(', '),
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    valueType: 'dateTime',
    search: false,
    width: 150,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    valueType: 'dateTime',
    search: false,
    width: 150,
  },
  {
    title: '操作',
    valueType: 'option',
    width: 200,
    ellipsis: true,
    render: (_, record) => (
      <div style={{ textAlign: 'center' }}>
        <a key="edit" onClick={() => handleEdit(record)}>
          编辑
        </a>
        <span style={{ margin: '0 8px' }} />
        <Popconfirm
          key="delete"
          title="确定要删除这个方案吗？"
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

// 事件处理函数
function handleEdit(record: ModelConfig) {
  // 编辑逻辑 - 实际应用中可能会打开弹窗或跳转到编辑页面
  console.log('编辑方案', record);
  message.info(`编辑方案：${record.approach_name}`);
}

function handleDelete(record: ModelConfig) {
  // 删除逻辑
  console.log('删除方案', record);
  message.success(`方案 ${record.approach_name} 删除成功`);
}

function handleAddModel() {
  // 添加新方案逻辑
  console.log('添加新方案');
  message.info('添加新方案');
}

function handleUpdateModels() {
  // 更新方案列表逻辑
  try {
    message.loading('正在更新方案列表...');
    
    // 模拟API请求延迟
    setTimeout(() => {
      message.destroy();
      message.success('方案列表更新成功');
    }, 1000);
  } catch (error) {
    message.destroy();
    message.error('方案列表更新失败');
  }
}

function handleBatchDeleteClick(selectedRows: ModelConfig[]) {
  // 批量删除逻辑
  console.log('批量删除方案', selectedRows);
  message.success(`成功删除 ${selectedRows.length} 个方案`);
}

// 数据请求函数
const modelListRequest = async (params: any) => {
  // 模拟API请求
  let data = [...modelExampleData];
  
  // 应用搜索过滤
  if (params.approach_name) {
    data = data.filter((item) => item.approach_name.includes(params.approach_name));
  }
  if (params.discount) {
    data = data.filter((item) => item.discount.toString().includes(params.discount));
  }
  if (params.client_type) {
    data = data.filter((item) => item.client_type.includes(params.client_type));
  }
  
  return {
    data,
    success: true,
    total: data.length,
  };
};

const ModelListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>单模型方案配置列表</Title>
        <Text type="secondary">管理系统中的所有单模型方案配置</Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="approach_name"
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 1800 }}
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
                  <a onClick={() => handleBatchDeleteClick(selectedRows as ModelConfig[])}>
                    批量删除
                  </a>
                )}
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="add" onClick={handleAddModel}>
              添加方案
            </Button>,
            <Button key="update" onClick={handleUpdateModels}>
              更新方案
            </Button>,
          ]}
          request={modelListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default ModelListPage;
