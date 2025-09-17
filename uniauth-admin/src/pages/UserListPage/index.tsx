import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { Typography, Space } from "antd";
import React from "react";
import { useIntl, Link } from "@umijs/max";
import {
  getUserinfos,
  postUserinfosFilter,
} from "@/services/uniauthService/userInfo";

const { Title, Text } = Typography;

interface DataType {
  key: string;
  name: string;
  email: string;
  upn: string;
  displayName: string;
}

const UserListPage: React.FC = () => {
  const intl = useIntl();

  const columns: ProColumns<DataType>[] = [
    {
      title: intl.formatMessage({
        id: "pages.userList.search",
        defaultMessage: "搜索用户",
      }),
      dataIndex: "keyword",
      key: "keyword",
      hideInTable: true,
      search: {
        transform: (value) => ({ keyword: value }),
      },
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.userList.search.placeholder",
          defaultMessage: "请输入姓名、邮箱、UPN",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.name",
        defaultMessage: "姓名",
      }),
      dataIndex: "name",
      key: "name",
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.email",
        defaultMessage: "邮箱",
      }),
      dataIndex: "email",
      key: "email",
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.upn",
        defaultMessage: "UPN",
      }),
      dataIndex: "upn",
      key: "upn",
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.displayName",
        defaultMessage: "显示名称",
      }),
      dataIndex: "displayName",
      key: "displayName",
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.actions",
        defaultMessage: "操作",
      }),
      key: "action",
      search: false,
      render: (_: any, record: DataType) => (
        <Space size="middle">
          <Link to={`/user-list/userDetail/${record.key}`}>
            {intl.formatMessage({
              id: "pages.userList.detail",
              defaultMessage: "详情",
            })}
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>
          {intl.formatMessage({
            id: "pages.userList.title",
            defaultMessage: "用户列表",
          })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({
            id: "pages.userList.description",
            defaultMessage: "管理系统中的所有用户及其权限",
          })}
        </Text>
        <ProTable<DataType>
          columns={columns}
          rowKey="key"
          search={{
            labelWidth: "auto",
            defaultCollapsed: false,
            collapseRender: false,
            filterType: "query",
            span: 6,
            searchText: intl.formatMessage({
              id: "pages.userList.search.query",
              defaultMessage: "查询",
            }),
            resetText: intl.formatMessage({
              id: "pages.userList.search.reset",
              defaultMessage: "重置",
            }),
          }}
          request={async (params) => {
            const { current, pageSize, keyword, ...searchParams } = params;

            const filter: API.FilterGroup = {
              logic: "or",
              conditions: [],
            };

            if (keyword) {
              const fields = ["name", "email", "upn", "displayName"];
              fields.forEach((field) => {
                filter.conditions!.push({
                  field,
                  op: "like",
                  value: `%${keyword}%`,
                });
              });
            }

            try {
              const response = await postUserinfosFilter({
                filter,
                pagination: {
                  page: current || 1,
                  pageSize: pageSize || 10,
                  all: false,
                },
                sort: [
                  {
                    field: "name",
                    order: "asc",
                  },
                ],
                verbose: true,
              });

              // 增强错误边界检查
              if (!response || typeof response !== "object") {
                console.error("API返回格式错误", response);
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }

              if (!response.userInfos || !Array.isArray(response.userInfos)) {
                return {
                  data: [],
                  success: true,
                  total: 0,
                };
              }

              // 数据转换逻辑优化，确保类型安全
              const tableData = response.userInfos.map((user, index) => ({
                key: user.upn || `user-${index}`,
                name: user.name || user.displayName || "Unknown",
                email: user.email || "",
                upn: user.upn || "",
                displayName: user.displayName || "",
              }));

              return {
                data: tableData,
                success: true,
                total: response.total || tableData.length,
              };
            } catch (error) {
              console.error("API Error:", error);
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
        />
      </ProCard>
    </PageContainer>
  );
};

export default UserListPage;
