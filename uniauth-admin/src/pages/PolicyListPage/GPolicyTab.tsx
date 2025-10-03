import { EditOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { ProCard, ProTable } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import { Button, message, Space, Tag, Typography } from "antd";
import { useRef } from "react";
import { postAuthAdminGroupingsFilter as filterGroupingsAPI } from "@/services/uniauthService/query";

const { Title, Text } = Typography;

// 分组关系类型
interface GroupingItem {
  id?: string;
  user: string;
  role: string;
  raw?: string[];
}

// API 请求函数
const filterGroupings = async (params: any) => {
  // 构建筛选参数，使用Grouping API格式
  const filterRequestParams: any = {};
  if (params.user) {
    filterRequestParams.users = [params.user];
  }
  if (params.role) {
    filterRequestParams.roles = [params.role];
  }

  try {
    const res = await filterGroupingsAPI(filterRequestParams);

    if (!res || !res.groups) {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }

    // 将 API 返回的二维数组转换为表格需要的格式
    // 假设格式为 [user, role] 的二元组
    const formattedData = res.groups.map(
      (grouping: string[], index: number) => ({
        id: `${grouping[0]}-${grouping[1]}-${index}`,
        user: grouping[0] || "",
        role: grouping[1] || "",
        raw: grouping,
      }),
    );

    return {
      data: formattedData,
      success: true,
      total: formattedData.length,
    };
  } catch (error) {
    console.error("Filter groupings error:", error);
    return {
      data: [],
      success: false,
      total: 0,
    };
  }
};

// 暂时没有Grouping的CRUD API，仅支持查询

interface GroupingTabContentProps {
  tabName: string;
}

const GroupingTabContent: React.FC<GroupingTabContentProps> = ({ tabName }) => {
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);
  // 暂时不需要模态框相关的状态
  // 暂时不需要选中行和操作函数

  // 表格列配置
  const columns: ProColumns<GroupingItem>[] = [
    {
      title: intl.formatMessage({
        id: "pages.groupingList.user",
        defaultMessage: "用户",
      }),
      dataIndex: "user",
      valueType: "text",
      width: 250,
      ellipsis: true,
      render: (_, record) => <Tag color="blue">{record.user}</Tag>,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.groupingList.search.user.placeholder",
          defaultMessage: "请输入用户进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.groupingList.role",
        defaultMessage: "角色",
      }),
      dataIndex: "role",
      valueType: "text",
      width: 250,
      ellipsis: true,
      render: (_, record) => <Tag color="green">{record.role}</Tag>,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.groupingList.search.role.placeholder",
          defaultMessage: "请输入角色进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.groupingList.relationship",
        defaultMessage: "关系信息",
      }),
      dataIndex: "raw",
      valueType: "text",
      ellipsis: true,
      width: 300,
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          g, {record.raw?.join(", ")}
        </Text>
      ),
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.groupingList.action",
        defaultMessage: "操作",
      }),
      valueType: "option",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <a
            key="view"
            onClick={() => {
              message.info(`用户: ${record.user}, 角色: ${record.role}`);
            }}
          >
            <EditOutlined />{" "}
            {intl.formatMessage({
              id: "pages.groupingList.view",
              defaultMessage: "查看",
            })}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <ProCard>
      <Title level={4}>
        {intl.formatMessage({
          id: "pages.groupingList.title",
          defaultMessage: "用户角色关系",
        })}{" "}
        - {tabName}
      </Title>
      <Text type="secondary">
        {intl.formatMessage({
          id: "pages.groupingList.description",
          defaultMessage:
            "管理用户和角色之间的继承关系，查看用户所属的角色信息",
        })}
      </Text>

      <ProTable<GroupingItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: false,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        search={{
          labelWidth: "auto",
          searchText: intl.formatMessage({
            id: "pages.userList.search.query",
            defaultMessage: "查询",
          }),
          resetText: intl.formatMessage({
            id: "pages.userList.search.reset",
            defaultMessage: "重置",
          }),
          span: 6,
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
        // 暂不支持行选择和批量操作
        toolBarRender={() => [
          <Button
            key="info"
            onClick={() => message.info("该模块仅支持查看用户角色关系")}
          >
            {intl.formatMessage({
              id: "pages.groupingList.viewOnly",
              defaultMessage: "仅查看模式",
            })}
          </Button>,
        ]}
        request={async (params) => filterGroupings(params)}
        scroll={{ x: 1200 }}
      />

      {/* Grouping 功能暂时只支持查看 */}
    </ProCard>
  );
};

export default GroupingTabContent;
