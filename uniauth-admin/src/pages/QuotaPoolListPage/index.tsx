import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Table, Typography } from "antd";
import { useRef } from "react";
import { useIntl } from '@umijs/max';

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
    title: intl.formatMessage({ id: 'pages.quotaPoolList.columns.name' }),
    dataIndex: "name",
    valueType: "text",
    search: true,
  },
  {
    title: intl.formatMessage({ id: 'pages.quotaPoolList.columns.manager' }),
    dataIndex: "manager",
    valueType: "text",
    search: true,
    render: (_, record) => record.manager || <Text type="secondary">{intl.formatMessage({ id: 'pages.quotaPoolList.notSet' })}</Text>,
  },
  {
    title: intl.formatMessage({ id: 'pages.quotaPoolList.columns.autoCreated' }),
    dataIndex: "autoCreated",
    valueType: "select",
    valueEnum: {
      true: { text: intl.formatMessage({ id: 'pages.quotaPoolList.yes' }) },
      false: { text: intl.formatMessage({ id: 'pages.quotaPoolList.no' }) },
    },
    search: true,
    render: (_, record) => (record.autoCreated ? intl.formatMessage({ id: 'pages.quotaPoolList.yes' }) : intl.formatMessage({ id: 'pages.quotaPoolList.no' })),
  },
  {
    title: intl.formatMessage({ id: 'pages.quotaPoolList.columns.createdAt' }),
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
    title: intl.formatMessage({ id: 'pages.quotaPoolList.columns.actions' }),
    valueType: "option",
    width: 200,
    ellipsis: true,
    render: (_, record) => (
      <div style={{ textAlign: "center" }}>
        <a key="detail" onClick={() => handleViewDetail(record)}>
          {intl.formatMessage({ id: 'pages.quotaPoolList.detail' })}
        </a>
        <span style={{ margin: "0 8px" }} />
        <Popconfirm
          key="delete"
          title={intl.formatMessage({ id: 'pages.quotaPoolList.deleteConfirm' })}
          onConfirm={() => handleDelete(record)}
        >
          <a style={{ color: "red" }}>{intl.formatMessage({ id: 'pages.quotaPoolList.delete' })}</a>
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
      (item) => String(item.autoCreated) === String(params.autoCreated),
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
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>{intl.formatMessage({ id: 'pages.quotaPoolList.title' })}</Title>
        <Text type="secondary">
          {intl.formatMessage({ id: 'pages.quotaPoolList.description' })}
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
                  {intl.formatMessage({ id: 'pages.quotaPoolList.selectedItems' }, { count: selectedRowKeys.length })}
                  <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                    {intl.formatMessage({ id: 'pages.quotaPoolList.cancelSelection' })}
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={() => {
            return (
              <Space size={16}>
                <a onClick={handleBatchResetClick}>{intl.formatMessage({ id: 'pages.quotaPoolList.batchReset' })}</a>
                <a onClick={handleBatchDisableClick}>{intl.formatMessage({ id: 'pages.quotaPoolList.batchDisable' })}</a>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewQuotaPoolClick}>
              {intl.formatMessage({ id: 'pages.quotaPoolList.addNew' })}
            </Button>,
          ]}
          request={quotaPoolListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default QuotaPoolListPage;
