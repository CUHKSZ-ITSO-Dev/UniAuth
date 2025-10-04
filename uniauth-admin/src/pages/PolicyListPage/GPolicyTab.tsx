import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  ModalForm,
  ProCard,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import { Button, message, Popconfirm, Space, Tag, Typography } from "antd";
import { useRef, useState } from "react";
import {
  postAuthAdminGroupingsAdd as addGroupingAPI,
  postAuthAdminGroupingsDelete as deleteGroupingAPI,
  postAuthAdminGroupingsEdit as editGroupingAPI,
} from "@/services/uniauthService/crud";
import { postAuthAdminGroupingsFilter as filterGroupingsAPI } from "@/services/uniauthService/query";

const { Title, Text } = Typography;

// 分组关系类型
interface GroupingItem {
  g1?: string;
  g2?: string;
  rule?: string[];
  page?: number;
  pageSize?: number;
}

// API 请求函数
const filterGroupings = async (params: any) => {
  // 构建筛选参数，使用Grouping API格式
  const filterRequestParams: {
    g1?: string;
    g2?: string;
    rule?: string;
    page?: number;
    pageSize?: number;
  } = {};

  // 处理搜索参数
  if (params.g1) {
    filterRequestParams.g1 = params.g1;
  }
  if (params.g2) {
    filterRequestParams.g2 = params.g2;
  }
  if (params.rule) {
    // 将搜索的rule转换为正确的格式
    filterRequestParams.rule = `g,${params.g1 || ""},${params.g2 || ""}`;
  }

  // 处理分页参数
  if (params.current) {
    filterRequestParams.page = params.current;
  }
  if (params.pageSize) {
    filterRequestParams.pageSize = params.pageSize;
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
        g1: grouping[0] || "",
        g2: grouping[1] || "",
        raw: grouping,
      }),
    );

    return {
      data: formattedData,
      success: true,
      total: res.total || formattedData.length, // 使用API返回的policy总数
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

// 使用新增的 Grouping CRUD API，实现简单的增删改交互
// interface GroupingTabContentProps 已移除 tabName

const GroupingTabContent: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);
  const [selectedRows, setSelectedRows] = useState<GroupingItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGrouping, setEditingGrouping] = useState<GroupingItem | null>(
    null,
  );

  const columns: ProColumns<GroupingItem>[] = [
    {
      title: intl.formatMessage({
        id: "pages.groupingList.g1",
        defaultMessage: "G1",
      }),
      dataIndex: "g1",
      valueType: "text",
      width: 120,
      ellipsis: true,
      render: (_, record) => <Tag color="blue">{record.g1}</Tag>,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.groupingList.search.g1.placeholder",
          defaultMessage: "请输入G1进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.groupingList.g2",
        defaultMessage: "G2",
      }),
      dataIndex: "g2",
      valueType: "text",
      width: 120,
      ellipsis: true,
      render: (_, record) => <Tag color="green">{record.g2}</Tag>,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.groupingList.search.g2.placeholder",
          defaultMessage: "请输入G2进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.groupingList.relationship",
        defaultMessage: "角色继承关系规则",
      }),
      dataIndex: "rule",
      valueType: "text",
      ellipsis: true,
      width: 300,
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          g, {record.g1}, {record.g2}
        </Text>
      ),
      search: {
        transform: (value) => ({ rule: value }),
      },
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.groupingList.search.rule.placeholder",
          defaultMessage: "搜索规则",
        }),
      },
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
            key="edit"
            onClick={() => {
              setEditingGrouping(record);
              setEditModalVisible(true);
            }}
          >
            <EditOutlined />{" "}
            {intl.formatMessage({
              id: "pages.groupingList.edit",
              defaultMessage: "编辑",
            })}
          </a>
          <Popconfirm
            key="delete"
            title={intl.formatMessage({
              id: "pages.goupingList.delete.confirmTitle",
              defaultMessage: "确认删除这条角色继承关系？",
            })}
            onConfirm={async () => {
              try {
                // 兼容rule为undefined的情况
                const groupingArr: string[][] =
                  record.rule && Array.isArray(record.rule)
                    ? [record.rule.map((s) => s || "")]
                    : [[record.g1 || "", record.g2 || ""]];
                await deleteGroupingAPI({ groupings: groupingArr });
                message.success(
                  intl.formatMessage({
                    id: "pages.groupingList.delete.success",
                    defaultMessage: "删除成功",
                  }),
                );
                await actionRef.current?.reload();
              } catch (e) {
                console.error(e);
                message.error(
                  intl.formatMessage({
                    id: "pages.groupingList.delete.error",
                    defaultMessage: "删除失败",
                  }),
                );
              }
            }}
            okText={intl.formatMessage({
              id: "pages.groupingList.delete.confirmOk",
              defaultMessage: "确定",
            })}
            cancelText={intl.formatMessage({
              id: "pages.groupingList.delete.confirmCancel",
              defaultMessage: "取消",
            })}
          >
            <a style={{ color: "#ff4d4f" }}>
              <DeleteOutlined />{" "}
              {intl.formatMessage({
                id: "pages.groupingList.delete",
                defaultMessage: "删除",
              })}
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 添加分组关系
  const handleAdd = async (values: { g1: string; g2: string }) => {
    try {
      await addGroupingAPI({ groupings: [[values.g1, values.g2]] });
      message.success(
        intl.formatMessage({
          id: "pages.groupingList.add.success",
          defaultMessage: "添加成功",
        }),
      );
      setCreateModalVisible(false);

      // 先刷新数据
      await actionRef.current?.reload();

      // 获取最新数据以计算最后一页
      const currentData = await filterGroupings({});
      const total = currentData.total || 0;
      const pageSize = 10; // 使用表格当前的pageSize
      const lastPage = Math.ceil(total / pageSize);

      // 确保数据刷新完成后再跳转到最后一页
      setTimeout(() => {
        actionRef.current?.setPageInfo?.({ current: lastPage });
      }, 100);

      return true;
    } catch (e) {
      console.error(e);
      message.error(
        intl.formatMessage({
          id: "pages.groupingList.add.error",
          defaultMessage: "添加失败",
        }),
      );
      return false;
    }
  };

  // 编辑分组关系
  const handleEdit = async (values: { g1: string; g2: string }) => {
    if (!editingGrouping) return false;
    try {
      // 兼容rule为undefined的情况
      const oldGrouping: string[] =
        editingGrouping.rule && Array.isArray(editingGrouping.rule)
          ? editingGrouping.rule.map((s) => s || "")
          : [editingGrouping.g1 || "", editingGrouping.g2 || ""];
      await editGroupingAPI({
        oldGrouping,
        newGrouping: [values.g1, values.g2],
      });
      message.success(
        intl.formatMessage({
          id: "pages.groupingList.edit.success",
          defaultMessage: "修改成功",
        }),
      );
      await actionRef.current?.reload();
      setEditModalVisible(false);
      setEditingGrouping(null);
      return true;
    } catch (e) {
      console.error(e);
      message.error(
        intl.formatMessage({
          id: "pages.groupingList.edit.error",
          defaultMessage: "修改失败",
        }),
      );
      return false;
    }
  };

  // 批量删除
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      message.info(
        intl.formatMessage({
          id: "pages.groupingList.batchDelete.selectTip",
          defaultMessage: "请先选择要删除的规则",
        }),
      );
      return;
    }
    try {
      const groupings: string[][] = selectedRows.map((r) =>
        r.rule ? r.rule.map((s) => s || "") : [r.g1 || "", r.g2 || ""],
      );
      await deleteGroupingAPI({ groupings });
      message.success(
        intl.formatMessage({
          id: "pages.groupingList.batchDelete.success",
          defaultMessage: "批量删除成功",
        }),
      );
      actionRef.current?.reload();
      setSelectedRows([]);
    } catch (e) {
      console.error(e);
      message.error(
        intl.formatMessage({
          id: "pages.groupingList.batchDelete.error",
          defaultMessage: "批量删除失败",
        }),
      );
    }
  };

  return (
    <ProCard>
      <Title level={4}>
        {intl.formatMessage({
          id: "pages.groupingList.title",
          defaultMessage: "规则列表",
        })}{" "}
      </Title>
      <Text type="secondary">
        {intl.formatMessage({
          id: "pages.groupingList.description",
          defaultMessage: "管理G1和G2之间的继承关系，查看用户所属的角色信息",
        })}
      </Text>

      <ProTable<GroupingItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        pagination={{
          pageSize: 10,
          defaultPageSize: 10,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => {
            return intl.formatMessage(
              {
                id: "pages.groupingList.pagination.total",
                defaultMessage: "共 {total} 条记录",
              },
              { total },
            );
          },
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
          // 使用 24 栅格来配合每列的 colSize（12/12/24）布局
          span: 12,
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
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            {intl.formatMessage({
              id: "pages.groupingList.add",
              defaultMessage: "新建",
            })}
          </Button>,
          <Popconfirm
            key="deleteSelected"
            title={intl.formatMessage(
              {
                id: "pages.groupingList.batchDelete.confirmTitle",
                defaultMessage: "确认删除选中的 {count} 条关系？",
              },
              { count: selectedRows.length },
            )}
            onConfirm={handleDeleteSelected}
            okText={intl.formatMessage({
              id: "pages.groupingList.batchDelete.ok",
              defaultMessage: "确定",
            })}
            cancelText={intl.formatMessage({
              id: "pages.groupingList.batchDelete.cancel",
              defaultMessage: "取消",
            })}
            disabled={selectedRows.length === 0}
          >
            <Button
              danger
              disabled={selectedRows.length === 0}
              style={{ minWidth: 90 }}
            >
              {intl.formatMessage({
                id: "pages.groupingList.batchDelete",
                defaultMessage: "批量删除",
              })}
            </Button>
          </Popconfirm>,
        ]}
        rowSelection={{
          onChange: (_keys, rows) => setSelectedRows(rows as GroupingItem[]),
        }}
        request={async (params) => filterGroupings(params)}
        scroll={{ x: 1200 }}
      />

      {/* 添加分组关系弹窗 */}
      <ModalForm
        title={intl.formatMessage({
          id: "pages.groupingList.addGroupingTitle",
          defaultMessage: "添加角色继承规则",
        })}
        width={400}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleAdd}
      >
        <ProFormText
          name="g1"
          label="G1"
          placeholder={intl.formatMessage({
            id: "pages.groupingList.g1.add.placeholder",
            defaultMessage: "请输入G1",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.groupingList.g1.add.placeholder",
                defaultMessage: "请输入G1",
              }),
            },
          ]}
        />
        <ProFormText
          name="g2"
          label="G2"
          placeholder={intl.formatMessage({
            id: "pages.groupingList.g2.add.placeholder",
            defaultMessage: "请输入G2",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.groupingList.g2.add.placeholder",
                defaultMessage: "请输入G2",
              }),
            },
          ]}
        />
      </ModalForm>

      {/* 编辑角色继承关系弹窗 */}
      <ModalForm
        key={
          editingGrouping
            ? editingGrouping.rule
              ? editingGrouping.rule.join(",")
              : `${editingGrouping.g1 || ""},${editingGrouping.g2 || ""}`
            : "empty"
        }
        title={intl.formatMessage({
          id: "pages.groupingList.editRole",
          defaultMessage: "编辑角色继承关系",
        })}
        width={400}
        open={editModalVisible}
        onOpenChange={(v) => {
          setEditModalVisible(v);
          if (!v) setEditingGrouping(null);
        }}
        initialValues={
          editingGrouping
            ? {
                g1: editingGrouping.g1,
                g2: editingGrouping.g2,
              }
            : {}
        }
        onFinish={handleEdit}
      >
        <ProFormText
          name="g1"
          label="G1"
          placeholder="请输入G1"
          rules={[{ required: true, message: "请输入G1" }]}
        />
        <ProFormText
          name="g2"
          label="G2"
          placeholder="请输入G2"
          rules={[{ required: true, message: "请输入G2" }]}
        />
      </ModalForm>
    </ProCard>
  );
};

export default GroupingTabContent;
