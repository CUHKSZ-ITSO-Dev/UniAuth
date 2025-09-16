import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Typography, Button, Popconfirm, Table, Space, message } from 'antd';
import { useRef } from 'react';
import { history } from 'umi';

const { Title, Text } = Typography;

// 类型定义
interface AutoQuotaPoolConfig {
  id: string;
  configName: string;
}

// 示例数据
const configExampleData = Array.from({ length: 8 }, (_, i) => ({
  id: (i + 1).toString(),
  configName: `自动配额池配置${i + 1}`,
}));

// 表格列配置
const columns: ProColumns<AutoQuotaPoolConfig>[] = [
  {
    title: '配置编号',
    dataIndex: 'id',
    valueType: 'text',
    search: true,
  },
  {
    title: '配置名称',
    dataIndex: 'configName',
    valueType: 'text',
    search: true,
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
          title="确定要删除这个配置吗？"
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
function handleEdit(record: AutoQuotaPoolConfig) {
  // 编辑逻辑 - 在当前页面切换到 AutoQuotaPoolEditPage
  console.log('编辑配置', record);
  history.push(`/config/auto-edit?record=${encodeURIComponent(JSON.stringify(record))}`);
}

function handleDelete(record: AutoQuotaPoolConfig) {
  // 删除逻辑
  console.log('删除配置', record);
  message.success(`配置 ${record.configName} 删除成功`);
}

function handleAddConfig() {
  // 添加新配置逻辑 - 跳转到编辑页面
  console.log('添加新配置');
  history.push('/config/auto-edit');
}

function handleUpdateConfigs() {
  // 更新配置列表逻辑
  try {
    message.loading('正在更新配置列表...');
    
    // 模拟API请求延迟
    setTimeout(() => {
      message.destroy();
      message.success('配置列表更新成功');
    }, 1000);
  } catch (error) {
    message.destroy();
    message.error('配置列表更新失败');
  }
}

function handleBatchDeleteClick(selectedRows: AutoQuotaPoolConfig[]) {
  // 批量删除逻辑
  console.log('批量删除配置', selectedRows);
  message.success(`成功删除 ${selectedRows.length} 个配置`);
}

// 数据请求函数
const configListRequest = async (params: any) => {
  // 模拟API请求
  let data = [...configExampleData];
  
  // 应用搜索过滤
  if (params.id) {
    data = data.filter((item) => item.id.includes(params.id));
  }
  if (params.configName) {
    data = data.filter((item) => item.configName.includes(params.configName));
  }
  
  return {
    data,
    success: true,
    total: data.length,
  };
};

const AutoQuotaPoolConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>自动配额池配置列表</Title>
        <Text type="secondary">管理系统中的所有自动配额池配置</Text>
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
              添加配置
            </Button>,
            <Button key="update" onClick={handleUpdateConfigs}>
              更新配置
            </Button>,
          ]}
          request={configListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default AutoQuotaPoolConfigPage;