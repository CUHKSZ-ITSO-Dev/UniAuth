import type { ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { Link, useIntl, useSearchParams } from "@umijs/max";
import { message, Space, Typography } from "antd";
import React, { useEffect, useMemo, useRef } from "react";
import { postUserinfosFilter } from "@/services/uniauthService/userInfo";

const { Title, Text } = Typography;

interface DataType {
  key: string;
  name: string;
  email: string;
  upn: string;
  displayName: string;
  employeeId: string;
  department: string;
}

const UserListPage: React.FC = () => {
  const intl = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();
  const tableRef = useRef<any>(null);
  const formRef = useRef<any>(null);

  // 使用 useMemo 确保初始参数响应 URL 变化
  const initialSearchParams = useMemo(() => {
    const keyword = searchParams.get("keyword") || "";
    const current = parseInt(searchParams.get("current") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    return {
      keyword,
      current,
      pageSize,
    };
  }, [searchParams]);

  // 更新URL参数
  const updateURLParams = (params: {
    keyword?: string;
    current?: number;
    pageSize?: number;
  }) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (params.keyword !== undefined) {
      if (params.keyword) {
        newSearchParams.set("keyword", params.keyword);
      } else {
        newSearchParams.delete("keyword");
      }
    }

    if (params.current !== undefined && params.current > 1) {
      newSearchParams.set("current", params.current.toString());
    } else {
      newSearchParams.delete("current");
    }

    if (params.pageSize !== undefined && params.pageSize !== 10) {
      newSearchParams.set("pageSize", params.pageSize.toString());
    } else {
      newSearchParams.delete("pageSize");
    }

    setSearchParams(newSearchParams);
  };

  // 监听URL参数变化，同步更新表单和表格
  useEffect(() => {
    if (formRef.current) {
      // 当URL参数变化时，重置表单到新的初始值
      formRef.current.setFieldsValue(initialSearchParams);
    }

    if (tableRef.current) {
      // 重新加载表格以反映新的搜索条件
      tableRef.current.reload();
    }
  }, [initialSearchParams]);

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
          defaultMessage: "请输入姓名、UPN、员工号/学号、邮箱",
        }),
        style: { width: 400 },
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.name",
        defaultMessage: "姓名",
      }),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.upn",
        defaultMessage: "UPN",
      }),
      dataIndex: "upn",
      key: "upn",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.employeeId",
        defaultMessage: "员工/学号",
      }),
      dataIndex: "employeeId",
      key: "employeeId",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.department",
        defaultMessage: "部门",
      }),
      dataIndex: "department",
      key: "department",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.userList.actions",
        defaultMessage: "操作",
      }),
      key: "action",
      search: false,
      render: (_: any, record: DataType) => {
        // 获取当前的搜索参数并添加到详情页链接中
        const linkParams = new URLSearchParams();
        if (initialSearchParams.keyword)
          linkParams.set("from_keyword", initialSearchParams.keyword);
        if (initialSearchParams.current > 1)
          linkParams.set(
            "from_current",
            initialSearchParams.current.toString(),
          );
        if (initialSearchParams.pageSize !== 10)
          linkParams.set(
            "from_pageSize",
            initialSearchParams.pageSize.toString(),
          );

        const queryString = linkParams.toString();
        const detailUrl = `/resource/user-list/${record.key}${
          queryString ? `?${queryString}` : ""
        }`;

        return (
          <Space size="middle">
            <Link to={detailUrl}>
              {intl.formatMessage({
                id: "pages.userList.detail",
                defaultMessage: "详情",
              })}
            </Link>
          </Space>
        );
      },
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
          onReset={() => {
            // 清空URL参数
            updateURLParams({
              keyword: "",
              current: 1,
              pageSize: 10,
            });
            // 手动重置表单到空值
            if (formRef.current) {
              formRef.current.setFieldsValue({ keyword: "" });
            }
            // 调用表格重置
            if (tableRef.current) {
              tableRef.current.reset();
            }
          }}
          columns={columns}
          rowKey="key"
          actionRef={tableRef}
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
          // 从URL参数设置初始表单值
          form={{
            initialValues: initialSearchParams,
          }}
          formRef={formRef}
          // 设置初始分页参数
          pagination={{
            current: initialSearchParams.current,
            pageSize: initialSearchParams.pageSize,
            defaultPageSize: 10, // 设置默认页面大小，防止reset后变为20
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          request={async (params) => {
            const { current, pageSize, keyword } = params;

            // 更新URL参数
            updateURLParams({
              keyword: keyword || "",
              current: current || 1,
              pageSize: pageSize || 10,
            });

            // 构建搜索条件，确保正确搜索姓名、upn和邮箱
            const filter: API.FilterGroup = {
              logic: "or",
              conditions: [],
            };

            if (keyword) {
              // 搜索字段：姓名、邮箱、UPN、学号、部门，确保支持模糊匹配
              const searchFields = ["name", "upn", "email", "employeeId"];
              searchFields.forEach((field) => {
                filter.conditions?.push({
                  field,
                  op: "like",
                  value: `%${keyword}%`,
                });
              });
              console.log("构建的搜索条件:", filter);
            }

            try {
              // 发送搜索请求
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

              console.log("API响应数据:", response);

              // 增强错误边界检查
              if (!response || typeof response !== "object") {
                console.error("API返回格式错误", response);
                message.error("搜索失败，返回数据格式不正确");
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }

              if (!response.userInfos || !Array.isArray(response.userInfos)) {
                console.warn("没有找到用户数据");
                return {
                  data: [],
                  success: true,
                  total: 0,
                };
              }

              // 数据转换逻辑优化，确保类型安全
              const tableData: DataType[] = response.userInfos.map(
                (user, index) => ({
                  key: user.upn || `user-${index}`,
                  name: user.name || user.displayName || "Unknown",
                  email: user.email || "",
                  upn: user.upn || "",
                  displayName: user.displayName || "",
                  employeeId: user.employeeId || "",
                  department: user.department || "",
                }),
              );

              // 搜索结果提示
              if (keyword && tableData.length === 0) {
                message.info(`未找到包含 "${keyword}" 的用户信息`);
              }

              return {
                data: tableData,
                success: true,
                total: response.total || tableData.length,
              };
            } catch (error) {
              console.error("搜索API错误:", error);
              const errorMessage =
                error instanceof Error ? error.message : "搜索失败，请稍后重试";
              message.error(errorMessage);
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          // 添加表格加载状态和空数据提示
          loading={false}
          tableAlertRender={({ selectedRowKeys }) => {
            return <div>当前共 {selectedRowKeys.length} 条选中记录</div>;
          }}
          tableAlertOptionRender={({ selectedRowKeys }) => {
            return (
              <Space>
                <Text>已选择 {selectedRowKeys.length} 项</Text>
              </Space>
            );
          }}
          rowSelection={false}
          // 优化表格性能
          size="middle"
        />
      </ProCard>
    </PageContainer>
  );
};

export default UserListPage;
