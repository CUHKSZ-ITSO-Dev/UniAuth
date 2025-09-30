import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Table, Typography } from "antd";
import { useRef } from "react";
import { getQuotaPool } from "@/services/uniauthService/quotaPool";

const { Title, Text } = Typography;

const columns: ProColumns<any>[] = [
  {
    title: "配额池名称",
    dataIndex: "quotaPoolName",
    valueType: "text",
    search: false,
  },
  {
    title: "配额",
    dataIndex: "regularQuota",
    valueType: "digit",
    search: false,
    render: (_, record) => {
      return record.regularQuota ? record.regularQuota.toString() : "-";
    },
  },
  {
    title: "余额",
    dataIndex: "remainingQuota",
    valueType: "digit",
    search: false,
    render: (_, record) => {
      return record.remainingQuota ? record.remainingQuota.toString() : "-";
    },
  },
  {
    title: "配额池类型",
    dataIndex: "personal",
    valueType: "select",
    search: true,
    valueEnum: {
      true: { text: "个人配额池" },
      false: { text: "共享配额池" },
    },
    render: (_, record) => {
      return record.personal ? "个人配额池" : "共享配额池";
    },
  },
  {
    title: "启用状态",
    dataIndex: "disabled",
    valueType: "select",
    search: true,
    valueEnum: {
      false: { text: "启用" },
      true: { text: "禁用" },
    },
    render: (_, record) => {
      return record.disabled ? "禁用" : "启用";
    },
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    valueType: "dateTime",
    search: false,
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
  try {
    const res = await getQuotaPool({
      quotaPoolName: params.quotaPoolName,
      page: params.current || 1,
      pageSize: params.pageSize || 20,
    });

    if (!res || !res.items) {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }

    // 根据搜索条件过滤数据
    let data = res.items;

    // 按配额池类型过滤
    if (params.personal !== undefined) {
      data = data.filter(
        (item) =>
          item.personal ===
          (params.personal === "true" || params.personal === true),
      );
    }

    // 按启用状态过滤
    if (params.disabled !== undefined) {
      data = data.filter(
        (item) =>
          item.disabled ===
          (params.disabled === "true" || params.disabled === true),
      );
    }

    return {
      data,
      success: true,
      total: res.total || data.length,
    };
  } catch (error) {
    console.error("获取配额池列表失败:", error);
    return {
      data: [],
      success: false,
      total: 0,
    };
  }
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
          rowKey="quotaPoolName"
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
