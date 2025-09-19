import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Table, Space } from "antd";
import { useRef } from "react";

const { Title, Text } = Typography;

// 示例数据
const quotaPoolsExampleData = [
  {
    id: 1,
    name: "研发配额池",
    manager: "张三",
    autoCreated: false,
    createdAt: "2024-09-01 10:23:45",
  },
  {
    id: 2,
    name: "测试配额池",
    manager: "",
    autoCreated: true,
    createdAt: "2024-09-02 09:15:30",
  },
  {
    id: 3,
    name: "生产配额池",
    manager: "李四",
    autoCreated: false,
    createdAt: "2024-08-28 14:05:12",
  },
  {
    id: 4,
    name: "大数据配额池",
    manager: "王五",
    autoCreated: true,
    createdAt: "2024-09-03 16:40:00",
  },
  {
    id: 5,
    name: "AI配额池",
    manager: "",
    autoCreated: false,
    createdAt: "2024-09-05 08:00:00",
  },
  {
    id: 6,
    name: "运维配额池",
    manager: "赵六",
    autoCreated: true,
    createdAt: "2024-09-06 11:20:00",
  },
];

const columns: ProColumns<any>[] = [
  {
    title: "配额池名称",
    dataIndex: "name",
    valueType: "text",
    search: true,
  },
  {
    title: "管理者",
    dataIndex: "manager",
    valueType: "text",
    search: true,
    render: (_, record) => record.manager || <Text type="secondary">无</Text>,
  },
  {
    title: "自动创建",
    dataIndex: "autoCreated",
    valueType: "select",
    valueEnum: {
      true: { text: "是" },
      false: { text: "否" },
    },
    search: true,
    render: (_, record) => (record.autoCreated ? "是" : "否"),
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
    title: "操作",
    valueType: "option",
    width: 200,
    ellipsis: true,
    render: (_, record) => (
      <div style={{ textAlign: "center" }}>
        <a key="detail" onClick={() => handleViewDetail(record)}>
          详情
        </a>
        <span style={{ margin: "0 8px" }} />
        <Popconfirm
          key="delete"
          title="确定要删除该配额池吗？"
          onConfirm={() => handleDelete(record)}
        >
          <a style={{ color: "red" }}>删除</a>
        </Popconfirm>
      </div>
    ),
  },
];

function handleViewDetail(record: any) {
  // TODO:跳转详情页逻辑
  console.log("查看详情", record);
}

function handleDelete(record: any) {
  // TODO:删除逻辑
  console.log("删除", record);
}

function handleNewQuotaPoolClick() {
  // TODO:新建逻辑
  console.log("新建配额池");
}

// @ts-expect-error
function _handleRefreshQuotaPoolClick() {
  // TODO: 刷新逻辑
  console.log("刷新配额池");
}

function handleBatchResetClick() {
  // TODO:批量重置逻辑
  console.log("批量重置");
}

function handleBatchDisableClick() {
  // TODO:批量禁用逻辑
  console.log("批量禁用");
}

const quotaPoolListRequest = async (params: any) => {
  // TODO:替换为实际请求
  let data = quotaPoolsExampleData;
  if (params.name) {
    data = data.filter((item) => item.name.includes(params.name));
  }
  if (params.manager) {
    data = data.filter((item) => item.manager.includes(params.manager));
  }
  if (params.autoCreated !== undefined) {
    data = data.filter(
      (item) => String(item.autoCreated) === String(params.autoCreated)
    );
  }
  if (
    params.createdAt &&
    Array.isArray(params.createdAt) &&
    params.createdAt.length === 2
  ) {
    const [start, end] = params.createdAt;
    data = data.filter((item) => {
      const time = new Date(item.createdAt).getTime();
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
};

const QuotaPoolListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>配额池列表</Title>
        <Text type="secondary">
          管理系统中的所有配额池及其配置，查看使用情况、获取账单等
        </Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
          search={{ labelWidth: "auto" }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          }}
          tableAlertRender={({
            selectedRowKeys,
            selectedRows,
            onCleanSelected,
          }) => {
            console.log(selectedRowKeys, selectedRows);
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
                <a onClick={handleBatchResetClick}>批量重置</a>
                <a onClick={handleBatchDisableClick}>批量禁用</a>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewQuotaPoolClick}>
              添加新的配额池
            </Button>,
          ]}
          request={quotaPoolListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default QuotaPoolListPage;
