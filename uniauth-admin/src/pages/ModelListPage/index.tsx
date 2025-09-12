// 导入依赖组件
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Typography, Button, Popconfirm, Table, Space, message } from 'antd';
import { useRef } from 'react';

const { Title, Text } = Typography;

// 类型定义
interface ModelConfig {
  id: string;
  modelName: string;
}

// 示例数据
const modelExampleData = Array.from({ length: 51 }, (_, i) => ({
  id: (i + 1).toString(),
  modelName: `模型${i + 1}`,
}));

// 表格列配置
const columns: ProColumns<ModelConfig>[] = [
  {
    title: '模型编号',
    dataIndex: 'id',
    valueType: 'text',
    search: true,
  },
  {
    title: '模型名称',
    dataIndex: 'modelName',
    valueType: 'text',
    search: true,
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
          title="确定要删除这个模型吗？"
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
  console.log('编辑模型', record);
  message.info(`编辑模型：${record.modelName}`);
}

function handleDelete(record: ModelConfig) {
  // 删除逻辑
  console.log('删除模型', record);
  message.success(`模型 ${record.modelName} 删除成功`);
}

function handleAddModel() {
  // 添加新模型逻辑
  console.log('添加新模型');
  message.info('添加新模型');
}

function handleUpdateModels() {
  // 更新模型列表逻辑
  try {
    message.loading('正在更新模型列表...');
    
    // 模拟API请求延迟
    setTimeout(() => {
      message.destroy();
      message.success('模型列表更新成功');
    }, 1000);
  } catch (error) {
    message.destroy();
    message.error('模型列表更新失败');
  }
}

function handleBatchDeleteClick(selectedRows: ModelConfig[]) {
  // 批量删除逻辑
  console.log('批量删除模型', selectedRows);
  message.success(`成功删除 ${selectedRows.length} 个模型`);
}

// 数据请求函数
const modelListRequest = async (params: any) => {
  // 模拟API请求
  let data = [...modelExampleData];
  
  // 应用搜索过滤
  if (params.id) {
    data = data.filter((item) => item.id.includes(params.id));
  }
  if (params.modelName) {
    data = data.filter((item) => item.modelName.includes(params.modelName));
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
        <Title level={4}>模型配置列表</Title>
        <Text type="secondary">管理系统中的所有模型配置</Text>
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
                  <a onClick={() => handleBatchDeleteClick(selectedRows as ModelConfig[])}>
                    批量删除
                  </a>
                )}
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="add" onClick={handleAddModel}>
              添加模型
            </Button>,
            <Button key="update" onClick={handleUpdateModels}>
              更新模型
            </Button>,
          ]}
          request={modelListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default ModelListPage;
