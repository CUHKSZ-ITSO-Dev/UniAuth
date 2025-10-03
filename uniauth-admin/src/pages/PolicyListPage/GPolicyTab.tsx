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
  id?: string;
  user?: string;
  role?: string;
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

// 使用新增的 Grouping CRUD API，实现简单的增删改交互
interface GroupingTabContentProps {
  tabName: string;
}

const GroupingTabContent: React.FC<GroupingTabContentProps> = ({ tabName }) => {
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);
  const [selectedRows, setSelectedRows] = useState<GroupingItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGrouping, setEditingGrouping] = useState<GroupingItem | null>(
    null,
  );

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
            title={`确认删除关系 ${record.user} -> ${record.role} ?`}
            onConfirm={async () => {
              try {
                const raw: string[][] = record.raw
                  ? [record.raw.map((s) => s || "")]
                  : [[record.user || "", record.role || ""]];
                await deleteGroupingAPI({ groupings: raw });
                message.success("删除成功");
                actionRef.current?.reload();
              } catch (e) {
                console.error(e);
                message.error("删除失败");
              }
            }}
            okText="确定"
            cancelText="取消"
          >
            <a style={{ color: "#ff4d4f" }}>
              <DeleteOutlined /> 删除
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 添加分组关系
  const handleAdd = async (values: { user: string; role: string }) => {
    try {
      await addGroupingAPI({ groupings: [[values.user, values.role]] });
      message.success("添加成功");
      actionRef.current?.reload();
      setCreateModalVisible(false);
      return true;
    } catch (e) {
      console.error(e);
      message.error("添加失败");
      return false;
    }
  };

  // 编辑分组关系
  const handleEdit = async (values: { user: string; role: string }) => {
    if (!editingGrouping) return false;
    try {
      const oldGrouping: string[] = (
        editingGrouping.raw ?? [editingGrouping.user, editingGrouping.role]
      ).map((s) => s || "");
      await editGroupingAPI({
        oldGrouping,
        newGrouping: [values.user, values.role],
      });
      message.success("修改成功");
      actionRef.current?.reload();
      setEditModalVisible(false);
      setEditingGrouping(null);
      return true;
    } catch (e) {
      console.error(e);
      message.error("修改失败");
      return false;
    }
  };

  // 批量删除
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      message.info("请先选择要删除的记录");
      return;
    }
    try {
      const groupings: string[][] = selectedRows.map((r) =>
        r.raw ? r.raw.map((s) => s || "") : [r.user || "", r.role || ""],
      );
      await deleteGroupingAPI({ groupings });
      message.success("删除成功");
      actionRef.current?.reload();
      setSelectedRows([]);
    } catch (e) {
      console.error(e);
      message.error("删除失败");
    }
  };

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
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            {intl.formatMessage({
              id: "pages.groupingList.add",
              defaultMessage: "添加",
            })}
          </Button>,
          <Popconfirm
            key="deleteSelected"
            title={`确认删除选中的 ${selectedRows.length} 条关系？`}
            onConfirm={handleDeleteSelected}
            okText="确定"
            cancelText="取消"
            disabled={selectedRows.length === 0}
          >
            <Button danger disabled={selectedRows.length === 0}>
              {intl.formatMessage({
                id: "pages.groupingList.deleteSelected",
                defaultMessage: "删除选中",
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
        title="添加分组关系"
        width={400}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleAdd}
      >
        <ProFormText
          name="user"
          label="用户"
          placeholder="请输入用户"
          rules={[{ required: true, message: "请输入用户" }]}
        />
        <ProFormText
          name="role"
          label="角色"
          placeholder="请输入角色"
          rules={[{ required: true, message: "请输入角色" }]}
        />
      </ModalForm>

      {/* 编辑分组关系弹窗 */}
      <ModalForm
        title="编辑分组关系"
        width={400}
        open={editModalVisible}
        onOpenChange={(v) => {
          setEditModalVisible(v);
          if (!v) setEditingGrouping(null);
        }}
        initialValues={editingGrouping || {}}
        onFinish={handleEdit}
      >
        <ProFormText
          name="user"
          label="用户"
          placeholder="请输入用户"
          rules={[{ required: true, message: "请输入用户" }]}
        />
        <ProFormText
          name="role"
          label="角色"
          placeholder="请输入角色"
          rules={[{ required: true, message: "请输入角色" }]}
        />
      </ModalForm>
    </ProCard>
  );
};

export default GroupingTabContent;
