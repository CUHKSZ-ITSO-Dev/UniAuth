import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Table, Space, message } from "antd";
import { useRef } from "react";

const { Title, Text } = Typography;

// Policy 示例数据
const policiesExampleData = [
  {
    id: 1,
    sub: "policy_admin",
    obj: "platform",
    act: "entry",
    eft: "allow",
  },
  {
    id: 2,
    sub: "policy_test",
    obj: "platform",
    act: "entry/no",
    eft: "deny",
  },
  {
    id: 3,
    sub: "policy_user",
    obj: "db",
    act: "read",
    eft: "allow",
  },
];

// 定义表格列
const columns: ProColumns<any>[] = [
  {
    title: "主体",
    dataIndex: "sub",
    valueType: "text",
    search: true,
    align: "center",
  },
  {
    title: "资源",
    dataIndex: "obj",
    valueType: "text",
    search: true,
    align: "center",
  },
  {
    title: "动作",
    dataIndex: "act",
    valueType: "text",
    search: true,
    align: "center",
  },
  {
    title: "效果",
    dataIndex: "eft",
    valueType: "select",
    valueEnum: {
      allow: { text: "开启" },
      deny: { text: "关闭" },
    },
    search: true,
    render: (_, record) => (record.eft === "allow" ? "开启" : "关闭"),
    align: "center",
  },
  {
    title: "操作",
    valueType: "option",
    width: 180,
    ellipsis: true,
    render: (_, record) => (
      <div style={{ textAlign: "center" }}>
        <a key="detail" onClick={() => handleViewDetail(record)}>
          详情
        </a>
        <span style={{ margin: "0 8px" }} />
        <Popconfirm
          key="delete"
          title="确定要删除该规则吗？"
          onConfirm={() => handleDelete(record)}
        >
          <a style={{ color: "red" }}>删除</a>
        </Popconfirm>
      </div>
    ),
    align: "center",
  },
];

function handleViewDetail(record: any) {
  // 跳转详情页
  console.log("查看规则详情", record);
}

function handleNewPolicyClick() {
  // 新增规则接口
  console.log("新增规则");
}
function handleDelete(record: any) {
  // 删除接口
  message.success("删除成功");
  console.log("删除规则", record);
}

const policyListRequest = async (params: any) => {
  // 实际的request请求
  let data = policiesExampleData;
  if (params.sub) {
    data = data.filter((item) => item.sub.includes(params.sub));
  }
  if (params.obj) {
    data = data.filter((item) => item.obj.includes(params.obj));
  }
  if (params.act) {
    data = data.filter((item) => item.act.includes(params.act));
  }
  if (params.eft) {
    data = data.filter((item) => item.eft === params.eft);
  }
  return {
    data,
    success: true,
    total: data.length,
  };
};

const PolicyListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>Policy 规则列表</Title>
        <Text type="secondary">
          管理系统中的所有 Policy 规则，可用于封禁/解封用户，支持搜索、添加和删除
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
                {/* 可扩展批量操作 */}
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewPolicyClick}>
              添加新的规则
            </Button>,
          ]}
          request={policyListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default PolicyListPage;