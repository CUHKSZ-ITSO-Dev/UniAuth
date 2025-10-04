import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  ModalForm,
  ProCard,
  ProFormSelect,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import { useIntl, useSearchParams } from "@umijs/max";
import {
  Button,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  postAuthAdminPoliciesAdd as addPoliciesAPI,
  postAuthAdminPoliciesOpenApiDelete as deletePoliciesAPI,
  postAuthAdminPoliciesEdit as editPolicyAPI,
} from "@/services/uniauthService/crud";
import { postAuthAdminPoliciesFilter as filterPoliciesAPI } from "@/services/uniauthService/query";

const { Title, Text } = Typography;

interface PolicyItem {
  sub: string;
  obj: string;
  act: string;
  eft: string;
  rule?: string[];
}

const PPolicyTab: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<PolicyItem[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // 记忆分页参数，响应URL变化
  const initialPagination = useMemo(() => {
    const current = parseInt(searchParams.get("current") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    return {
      current,
      pageSize,
    };
  }, [searchParams]);

  // 更新URL参数
  const updateURLParams = (params: { current?: number; pageSize?: number }) => {
    const newSearchParams = new URLSearchParams(searchParams);
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

  // 监听URL参数变化，重载表格
  useEffect(() => {
    if (actionRef.current && actionRef.current.reload) {
      actionRef.current.reload();
    }
  }, [initialPagination.current, initialPagination.pageSize]);

  const filterPolicies = async (params: any) => {
    const filterRequestParams = {
      sub: params.sub || undefined,
      obj: params.obj || undefined,
      act: params.act || undefined,
      eft: params.eft || undefined,
      rule: params.rule || undefined,
      page: params.current || 1,
      pageSize: params.pageSize || 10,
    };
    try {
      const res = await filterPoliciesAPI(filterRequestParams);
      if (!res || !res.policies) {
        return {
          data: [],
          success: false,
          total: 0,
        };
      }
      const formattedData = res.policies.map((policy: any) => ({
        sub: policy[0] || "",
        obj: policy[1] || "",
        act: policy[2] || "",
        eft: policy[3] || "",
        rule: policy,
        raw: policy,
      }));
      return {
        data: formattedData,
        success: true,
        total: typeof res.total === "number" ? res.total : 0,
      };
    } catch (_error) {
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
      message.error(
        intl.formatMessage({
          id: "pages.policyList.add.error",
          defaultMessage: "添加失败",
        }),
      );
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
      message.error(
        intl.formatMessage({
          id: "pages.policyList.delete.error",
          defaultMessage: "删除失败",
        }),
      );
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
      message.error(
        intl.formatMessage({
          id: "pages.policyList.edit.error",
          defaultMessage: "编辑失败",
        }),
      );
      return false;
    }
  };

  const handleEdit = (record: PolicyItem) => {
    setEditingPolicy(record);
    setEditModalVisible(true);
  };

  const handleDelete = async (record: PolicyItem) => {
    if (record.rule) {
      const success = await deletePolicies([record.rule]);
      if (success) {
        message.success(
          intl.formatMessage({
            id: "pages.policyList.delete.success",
            defaultMessage: "删除成功",
          }),
        );
        // 强制重置到第一页并刷新，确保UI立即反映
        if (actionRef.current && actionRef.current.reloadAndRest) {
          await actionRef.current.reloadAndRest();
        } else if (actionRef.current && actionRef.current.reload) {
          await actionRef.current.reload();
        }
      }
    }
  };

  const handleBatchDelete = async (selectedRows: PolicyItem[]) => {
    const policies = selectedRows
      .map((row) => row.rule)
      .filter(Boolean) as string[][];
    const success = await deletePolicies(policies);
    if (success) {
      message.success(
        intl.formatMessage({
          id: "pages.policyList.batchDelete.success",
          defaultMessage: "批量删除成功",
        }),
      );
      // 强制重置到第一页并刷新，确保UI立即反映
      if (actionRef.current && actionRef.current.reloadAndRest) {
        await actionRef.current.reloadAndRest();
      } else if (actionRef.current && actionRef.current.reload) {
        await actionRef.current.reload();
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
    }
  };

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
      render: (_, record) => <Tag color="blue">{record.sub}</Tag>,
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
      render: (_, record) => <Tag color="green">{record.obj}</Tag>,
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
      render: (_, record) => <Tag color="orange">{record.act}</Tag>,
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
            record.eft === "allow"
              ? "success"
              : record.eft === "deny"
                ? "error"
                : "default"
          }
        >
          {record.eft}
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
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.policyList.search.raw.placeholder",
          defaultMessage: "请输入完整规则进行搜索",
        }),
        style: { minWidth: 200 },
      },
      ellipsis: true,
      width: 500,
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          p, {record.rule?.map((item) => `${item}`).join(", ")}
        </Text>
      ),
      search: {
        transform: (value) => ({
          rule: typeof value === "string" ? value.trim() : value,
        }),
      },
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
            <EditOutlined />{" "}
            {intl.formatMessage({
              id: "pages.policyList.edit",
              defaultMessage: "编辑",
            })}
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
    <ProCard>
      <Title level={4}>
        {intl.formatMessage({
          id: "pages.policyList.tab_p",
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
        rowKey={(record) => record.rule?.join(",") || ""}
        pagination={{
          current: initialPagination.current,
          pageSize: initialPagination.pageSize,
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: false,
          showTotal: (total) => {
            return intl.formatMessage(
              {
                id: "pages.policyList.pagination.total",
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
              disabled={selectedRowKeys.length === 0}
            >
              <Button
                danger
                disabled={selectedRowKeys.length === 0}
                style={{ minWidth: 90 }}
              >
                {intl.formatMessage({
                  id: "pages.policyList.batchDelete",
                  defaultMessage: "批量删除",
                })}
              </Button>
            </Popconfirm>
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
          // 分页参数同步到URL
          updateURLParams({
            current: params.current || 1,
            pageSize: params.pageSize || 10,
          });
          const searchParams = {
            sub: params.sub,
            obj: params.obj,
            act: params.act,
            ...params,
          };
          return await filterPolicies(searchParams);
        }}
        scroll={{ x: 1200 }}
      />

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
        key={
          editingPolicy
            ? editingPolicy.rule
              ? editingPolicy.rule.join(",")
              : ""
            : "empty"
        }
        title={intl.formatMessage({
          id: "pages.policyList.editRule",
          defaultMessage: "编辑规则",
        })}
        width={500}
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        initialValues={
          editingPolicy
            ? {
                subject: editingPolicy.sub,
                object: editingPolicy.obj,
                action: editingPolicy.act,
                effect: editingPolicy.eft,
              }
            : {}
        }
        onFinish={async (values) => {
          if (editingPolicy?.rule) {
            const oldPolicyStr = [
              editingPolicy.rule[0],
              editingPolicy.rule[1],
              editingPolicy.rule[2],
              editingPolicy.rule[3],
            ];
            const newPolicy = [
              values.subject,
              values.object,
              values.action,
              values.effect || "allow",
            ];
            const success = await editPolicy(oldPolicyStr, newPolicy);
            if (success) {
              message.success(
                intl.formatMessage({
                  id: "pages.policyList.edit.success",
                  defaultMessage: "编辑成功",
                }),
              );
              actionRef.current?.reload();
              setEditModalVisible(false);
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
    </ProCard>
  );
};

export default PPolicyTab;
