import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  ModalForm,
  PageContainer,
  ProCard,
  ProFormSelect,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import {
  Button,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useRef, useState } from "react";
import {
  postAuthAdminPoliciesAdd as addPoliciesAPI,
  postAuthAdminPoliciesOpenApiDelete as deletePoliciesAPI,
  postAuthAdminPoliciesEdit as editPolicyAPI,
} from "@/services/uniauthService/crud";
import { postAuthAdminPoliciesFilter as filterPoliciesAPI } from "@/services/uniauthService/query";

const { Title, Text } = Typography;

// 规则类型
interface PolicyItem {
  id?: string;
  subject: string;
  object: string;
  action: string;
  effect: string;
  raw?: string[];
}

// API 请求函数
const filterPolicies = async (params: any) => {
  // 构建筛选参数，使用字符串格式（符合API类型定义）
  const filterRequest = {
    sub: params.sub || undefined,
    obj: params.obj || undefined,
    act: params.act || undefined,
    eft: params.eft || undefined,
  };

  try {
    const response = await filterPoliciesAPI(filterRequest);

    if (!response || !response.policies) {
      return {
        data: [],
        success: false,
        total: 0,
      };
    }

    // 将 API 返回的二维数组转换为表格需要的格式
    const formattedData = response.policies.map((policy: any) => ({
      id: policy.join(","),
      subject: policy[0] || "",
      object: policy[1] || "",
      action: policy[2] || "",
      effect: policy[3] || "",
      raw: policy,
    }));

    // 处理分页参数
    const { current = 1, pageSize = 10 } = params;
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = formattedData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      success: true,
      total: formattedData.length,
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      total: 0,
    };
  }
};

const addPolicies = async (policies: string[][]) => {
  try {
    await addPoliciesAPI({
      policies: policies,
      skip: false,
    });
    return true;
  } catch (error) {
    console.error("Add policies error:", error);
    message.error("添加规则失败");
    return false;
  }
};

const deletePolicies = async (policies: string[][]) => {
  try {
    await deletePoliciesAPI({
      policies: policies,
    });
    return true;
  } catch (error) {
    console.error("Delete policies error:", error);
    message.error("删除规则失败");
    return false;
  }
};

const editPolicy = async (oldPolicy: string[], newPolicy: string[]) => {
  try {
    await editPolicyAPI({
      oldPolicy,
      newPolicy,
    });
    return true;
  } catch (error) {
    console.error("Edit policy error:", error);
    message.error("编辑规则失败");
    return false;
  }
};

const PolicyListPage: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<PolicyItem[]>([]);

  // 处理函数
  const handleEdit = (record: PolicyItem) => {
    setEditingPolicy(record);
    setEditModalVisible(true);
  };

  const handleDelete = async (record: PolicyItem) => {
    if (record.raw) {
      const success = await deletePolicies([record.raw]);
      if (success) {
        message.success("删除成功");
        actionRef.current?.reload();
      }
    }
  };

  const handleBatchDelete = async (selectedRows: PolicyItem[]) => {
    const policies = selectedRows
      .map((row) => row.raw)
      .filter(Boolean) as string[][];
    const success = await deletePolicies(policies);
    if (success) {
      message.success(`批量删除 ${policies.length} 条规则成功`);
      actionRef.current?.reload();
      setSelectedRowKeys([]);
      setSelectedRows([]);
    }
  };

  // 表格列配置
  const columns: ProColumns<PolicyItem>[] = [
    {
      title: intl.formatMessage({
        id: "pages.policyList.subject",
        defaultMessage: "主体",
      }),
      dataIndex: "sub",
      valueType: "text",
      width: 200,
      ellipsis: true,
      render: (_, record) => <Tag color="blue">{record.subject}</Tag>,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.policyList.search.subject.placeholder",
          defaultMessage: "请输入主体进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.object",
        defaultMessage: "对象",
      }),
      dataIndex: "obj",
      valueType: "text",
      width: 200,
      ellipsis: true,
      render: (_, record) => <Tag color="green">{record.object}</Tag>,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.policyList.search.object.placeholder",
          defaultMessage: "请输入对象进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.action",
        defaultMessage: "操作",
      }),
      dataIndex: "act",
      valueType: "text",
      width: 150,
      ellipsis: true,
      render: (_, record) => <Tag color="orange">{record.action}</Tag>,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.policyList.search.action.placeholder",
          defaultMessage: "请输入操作进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.effect",
        defaultMessage: "效果",
      }),
      dataIndex: "eft",
      valueType: "select",
      width: 150,
      render: (_, record) => (
        <Tag
          color={
            record.effect === "allow"
              ? "success"
              : record.effect === "deny"
                ? "error"
                : "default"
          }
        >
          {record.effect}
        </Tag>
      ),
      valueEnum: {
        allow: {
          text: intl.formatMessage({
            id: "pages.policyList.effect.allow",
            defaultMessage: "Allow",
          }),
          status: "Success",
        },
        deny: {
          text: intl.formatMessage({
            id: "pages.policyList.effect.deny",
            defaultMessage: "Deny",
          }),
          status: "Error",
        },
      },
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.policyList.search.effect.placeholder",
          defaultMessage: "请选择效果",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.raw",
        defaultMessage: "完整规则",
      }),
      dataIndex: "raw",
      valueType: "text",
      ellipsis: true,
      width: 300,
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          p, {record.raw?.map((item) => `${item}`).join(", ")}
        </Text>
      ),
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.action",
        defaultMessage: "操作",
      }),
      valueType: "option",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <a key="edit" onClick={() => handleEdit(record)}>
            <EditOutlined /> 编辑
          </a>
          <Popconfirm
            key="delete"
            title={intl.formatMessage({
              id: "pages.policyList.deleteConfirmTitle",
              defaultMessage: "确定要删除该规则吗？",
            })}
            description={intl.formatMessage({
              id: "pages.policyList.deleteConfirmDescription",
              defaultMessage: "删除后将无法恢复",
            })}
            onConfirm={() => handleDelete(record)}
            okText={intl.formatMessage({
              id: "pages.policyList.deleteConfirmOk",
              defaultMessage: "确定",
            })}
            cancelText={intl.formatMessage({
              id: "pages.policyList.deleteConfirmCancel",
              defaultMessage: "取消",
            })}
          >
            <a style={{ color: "#ff4d4f" }}>
              <DeleteOutlined />{" "}
              {intl.formatMessage({
                id: "pages.policyList.delete",
                defaultMessage: "删除",
              })}
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>
          {intl.formatMessage({
            id: "pages.policyList.title",
            defaultMessage: "规则列表",
          })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({
            id: "pages.policyList.description",
            defaultMessage:
              "管理系统访问控制规则，配置用户、资源和操作的权限规则",
          })}
        </Text>

        <ProTable<PolicyItem>
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
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
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
            selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys);
              setSelectedRows(rows);
            },
          }}
          tableAlertRender={({ selectedRowKeys, onCleanSelected }) => {
            return (
              <Space size={24}>
                <span>
                  {intl.formatMessage(
                    {
                      id: "pages.policyList.tableAlert.selected",
                      defaultMessage: "已选 {count} 项",
                    },
                    {
                      count: selectedRowKeys.length,
                    },
                  )}
                  <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                    {intl.formatMessage({
                      id: "pages.policyList.tableAlert.cancel",
                      defaultMessage: "取消选择",
                    })}
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={() => {
            return (
              <Space size={16}>
                <Popconfirm
                  title={intl.formatMessage(
                    {
                      id: "pages.policyList.deleteConfirmTitle2",
                      defaultMessage: "确定要删除选中的 {count} 条规则吗？",
                    },
                    {
                      count: selectedRowKeys.length,
                    },
                  )}
                  onConfirm={() => handleBatchDelete(selectedRows)}
                  okText={intl.formatMessage({
                    id: "pages.policyList.deleteConfirmOk",
                    defaultMessage: "确定",
                  })}
                  cancelText={intl.formatMessage({
                    id: "pages.policyList.deleteConfirmCancel",
                    defaultMessage: "取消",
                  })}
                >
                  <a style={{ color: "#ff4d4f" }}>
                    {intl.formatMessage({
                      id: "pages.policyList.batchDelete",
                      defaultMessage: "批量删除",
                    })}
                  </a>
                </Popconfirm>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button
              type="primary"
              key="new"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              {intl.formatMessage({
                id: "pages.policyList.searchTable.new",
                defaultMessage: "新建",
              })}
            </Button>,
          ]}
          request={async (params) => {
            const searchParams = {
              subject: params.subject,
              object: params.object,
              action: params.action,
              ...params,
            };
            return await filterPolicies(searchParams);
          }}
          scroll={{ x: 1200 }}
        />
      </ProCard>

      {/* 创建规则弹窗 */}
      <ModalForm
        title={intl.formatMessage({
          id: "pages.policyList.searchTable.newPolicy",
          defaultMessage: "添加规则",
        })}
        width={500}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={async (values) => {
          const policy = [
            values.subject,
            values.object,
            values.action,
            values.effect || "allow",
          ];
          const success = await addPolicies([policy]);
          if (success) {
            message.success(
              intl.formatMessage({
                id: "pages.policyList.searchTable.addPolicySuccess",
                defaultMessage: "添加成功",
              }),
            );
            actionRef.current?.reload();
            return true;
          }
          return false;
        }}
      >
        <ProFormText
          name="subject"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.subject.label",
            defaultMessage: "主体",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.subject.placeholder",
            defaultMessage: "请输入主体，如: alice, user_group",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.subject.required",
                defaultMessage: "请输入主体",
              }),
            },
          ]}
        />
        <ProFormText
          name="object"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.object",
            defaultMessage: "对象",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.object.placeholder",
            defaultMessage: "请输入对象，如: chat_production, database",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.object.required",
                defaultMessage: "请输入对象",
              }),
            },
          ]}
        />
        <ProFormText
          name="action"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.action",
            defaultMessage: "操作",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.action.placeholder",
            defaultMessage: "请输入操作，如: read, write, manage",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.action.required",
                defaultMessage: "请输入操作",
              }),
            },
          ]}
        />
        <ProFormSelect
          name="effect"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.effect",
            defaultMessage: "效果",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.effect.placeholder",
            defaultMessage: "请选择效果, 如: allow, deny",
          })}
          options={[
            {
              label: intl.formatMessage({
                id: "pages.policyList.searchTable.effect.allow",
                defaultMessage: "允许",
              }),
              value: "allow",
            },
            {
              label: intl.formatMessage({
                id: "pages.policyList.searchTable.effect.deny",
                defaultMessage: "拒绝",
              }),
              value: "deny",
            },
          ]}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.effect.required",
                defaultMessage: "请选择效果",
              }),
            },
          ]}
        />
      </ModalForm>

      {/* 编辑规则弹窗 */}
      <ModalForm
        title={intl.formatMessage({
          id: "pages.policyList.editRule",
          defaultMessage: "编辑规则",
        })}
        width={500}
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        initialValues={editingPolicy || {}}
        onFinish={async (values) => {
          if (editingPolicy?.raw) {
            const oldPolicyStr = [
              editingPolicy.raw[0],
              editingPolicy.raw[1],
              editingPolicy.raw[2],
              editingPolicy.raw[3],
            ];
            const newPolicy = [
              values.subject,
              values.object,
              values.action,
              values.effect || "allow",
            ];
            const success = await editPolicy(oldPolicyStr, newPolicy);
            if (success) {
              message.success("编辑成功");
              actionRef.current?.reload();
              setEditingPolicy(null);
              return true;
            }
          }
          return false;
        }}
      >
        <ProFormText
          name="subject"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.subject.label",
            defaultMessage: "主体",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.subject.required",
            defaultMessage: "请输入主体",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.subject.required",
                defaultMessage: "请输入主体",
              }),
            },
          ]}
        />
        <ProFormText
          name="object"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.object.label",
            defaultMessage: "对象",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.object.required",
            defaultMessage: "请输入对象",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.object.required",
                defaultMessage: "请输入对象",
              }),
            },
          ]}
        />
        <ProFormText
          name="action"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.action.label",
            defaultMessage: "操作",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.action.required",
            defaultMessage: "请输入操作",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.action.required",
                defaultMessage: "请输入操作",
              }),
            },
          ]}
        />
        <ProFormSelect
          name="effect"
          label={intl.formatMessage({
            id: "pages.policyList.searchTable.effect.label",
            defaultMessage: "效果 (Effect)",
          })}
          placeholder={intl.formatMessage({
            id: "pages.policyList.searchTable.effect.required",
            defaultMessage: "请选择效果",
          })}
          options={[
            {
              label: intl.formatMessage({
                id: "pages.policyList.searchTable.effect.allow",
                defaultMessage: "Allow",
              }),
              value: "allow",
            },
            {
              label: intl.formatMessage({
                id: "pages.policyList.searchTable.effect.deny",
                defaultMessage: "Deny",
              }),
              value: "deny",
            },
          ]}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.policyList.searchTable.effect.required",
                defaultMessage: "请选择效果",
              }),
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default PolicyListPage;
