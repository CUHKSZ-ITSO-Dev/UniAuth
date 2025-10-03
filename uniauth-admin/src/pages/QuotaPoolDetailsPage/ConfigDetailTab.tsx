import { getLocale, useIntl } from "@@/plugin-locale/localeExports";
import type { ActionType } from "@ant-design/pro-components";
import {
  GridContent,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { Link } from "@umijs/max";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Progress,
  Radio,
  Space,
  Switch,
} from "antd";
import cronstrue from "cronstrue/i18n";
import type { FC } from "react";
import { useRef, useState } from "react";
import { getAuthQuotaPoolsUsers as getUsersAPI } from "@/services/uniauthService/auth";
import { postAuthAdminPoliciesFilter as getPolcyAPI } from "@/services/uniauthService/query";
import {
  postQuotaPoolRefreshUsers,
  putQuotaPool,
} from "@/services/uniauthService/quotaPool";
import { postUserinfosFilter } from "@/services/uniauthService/userInfo";

// 配额池详细信息接口
interface QuotaPoolDetail {
  quotaPoolName: string;
  cronCycle: string;
  regularQuota: number;
  remainingQuota: number;
  extraQuota: number;
  lastResetAt: string;
  personal?: boolean;
  disabled?: boolean;
}

// 从props接收配额池名称和详细信息
interface ConfigDetailTabProps {
  quotaPoolName: string;
  quotaPoolDetail: QuotaPoolDetail | null;
  onRefresh?: () => Promise<void>;
}

// 用户信息接口
interface UserInfo {
  key: string;
  upn: string;
  name: string;
  employeeId: string;
  tags: string[];
  department: string;
}

const ConfigDetailTab: FC<ConfigDetailTabProps> = ({
  quotaPoolName,
  quotaPoolDetail,
  onRefresh,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [cronDescription, setCronDescription] = useState<string>("");
  const [cronError, setCronError] = useState<string>("");
  const [refreshUsersLoading, setRefreshUsersLoading] = useState(false);
  const associatedUsersActionRef = useRef<ActionType | null>(null);

  // 解析 cron 表达式
  const parseCronExpression = (cronExpression: string): string => {
    if (!cronExpression || typeof cronExpression !== "string") {
      return cronExpression || "-";
    }

    try {
      return cronstrue.toString(cronExpression, {
        locale: getLocale() === "zh-CN" ? "zh_CN" : "en_US",
        use24HourTimeFormat: true,
        verbose: true,
      });
    } catch (error) {
      console.error("解析 cron 表达式失败:", error);
      // 如果解析失败，返回原始表达式
      return cronExpression;
    }
  };

  // 手动刷新配额池关联用户（根据 UserInfos Rules 刷新 Casbin 继承关系）
  const handleRefreshUsers = async () => {
    try {
      setRefreshUsersLoading(true);
      const res = await postQuotaPoolRefreshUsers({
        qpNameList: [quotaPoolName],
      });
      if (res?.ok) {
        message.success(
          intl.formatMessage({
            id: "pages.quotaPoolConfigDetail.refreshUsers.success",
            defaultMessage: "已根据规则刷新关联用户",
          }),
        );
        // 刷新关联用户表格
        associatedUsersActionRef.current?.reload();
        // 需要的话也刷新上层详情
        if (onRefresh) await onRefresh();
      } else {
        message.error(
          intl.formatMessage({
            id: "pages.quotaPoolConfigDetail.refreshUsers.error",
            defaultMessage: "刷新关联用户失败",
          }),
        );
      }
    } catch (error) {
      console.error("刷新关联用户失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.refreshUsers.error",
          defaultMessage: "刷新关联用户失败",
        }),
      );
    } finally {
      setRefreshUsersLoading(false);
    }
  };

  // 处理 cron 表达式校验和解析
  const handleCronChange = (value: string) => {
    if (!value) {
      setCronDescription("");
      setCronError("");
      return;
    }

    try {
      const description = cronstrue.toString(value, {
        locale: getLocale() === "zh-CN" ? "zh_CN" : "en_US",
        use24HourTimeFormat: true,
        verbose: true,
      });
      setCronDescription(description);
      setCronError("");
    } catch (_error) {
      setCronDescription("");
      setCronError(
        intl.formatMessage({
          id: "pages.quotaPoolList.create.cronCycle.invalid",
          defaultMessage: "Cron 表达式格式不正确",
        }),
      );
    }
  };

  // 打开编辑模态框
  const handleEditClick = () => {
    if (quotaPoolDetail) {
      form.setFieldsValue({
        quotaPoolName: quotaPoolDetail.quotaPoolName,
        cronCycle: quotaPoolDetail.cronCycle,
        regularQuota: quotaPoolDetail.regularQuota,
        extraQuota: quotaPoolDetail.extraQuota,
        personal: quotaPoolDetail.personal ?? false,
        enabled: !quotaPoolDetail.disabled,
      });
      // 初始化 cron 描述
      if (quotaPoolDetail.cronCycle) {
        handleCronChange(quotaPoolDetail.cronCycle);
      }
    }
    setIsEditModalOpen(true);
  };

  // 确认编辑配额池
  const handleEditOk = async () => {
    try {
      const values = await form.validateFields();
      setEditLoading(true);

      const res = await putQuotaPool({
        quotaPoolName: quotaPoolName,
        cronCycle: values.cronCycle,
        regularQuota: values.regularQuota,
        extraQuota: values.extraQuota || 0,
        personal: values.personal,
        disabled: !values.enabled,
      });

      if (res?.ok) {
        message.success(
          intl.formatMessage({
            id: "pages.quotaPoolConfigDetail.edit.success",
            defaultMessage: "编辑配额池成功",
          }),
        );
        setIsEditModalOpen(false);
        form.resetFields();
        setCronDescription("");
        setCronError("");
        // 刷新数据
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        message.error(
          intl.formatMessage({
            id: "pages.quotaPoolConfigDetail.edit.error",
            defaultMessage: "编辑配额池失败",
          }),
        );
      }
    } catch (error: any) {
      if (error?.errorFields) {
        // 表单验证错误，不显示错误消息
        return;
      }
      console.error("编辑配额池失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.edit.error",
          defaultMessage: "编辑配额池失败",
        }),
      );
    } finally {
      setEditLoading(false);
    }
  };

  // 取消编辑配额池
  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    form.resetFields();
    setCronDescription("");
    setCronError("");
  };

  const associatedUsersColumns: ProColumns<UserInfo>[] = [
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolConfigDetail.name",
        defaultMessage: "姓名",
      }),
      valueType: "text",
      dataIndex: "name",
      search: true,
      ellipsis: true,
    },
    {
      title: "UPN",
      valueType: "text",
      dataIndex: "upn",
      search: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolConfigDetail.employeeId",
        defaultMessage: "员工/学号",
      }),
      valueType: "text",
      dataIndex: "employeeId",
      search: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolConfigDetail.department",
        defaultMessage: "部门",
      }),
      valueType: "text",
      dataIndex: "department",
      search: false,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolConfigDetail.operation",
        defaultMessage: "操作",
      }),
      valueType: "option",
      render: (_: any, record: any) => [
        <Space size="middle" key={record.upn}>
          <Link to={`/resource/user-list/${record.upn}`}>
            {intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.detail",
              defaultMessage: "详情",
            })}
          </Link>
        </Space>,
      ],
    },
  ];

  const quotaPoolRulesColumns: ProColumns<any>[] = [
    {
      title: intl.formatMessage({
        id: "pages.policyList.subject",
        defaultMessage: "主体",
      }),
      dataIndex: "sub",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.object",
        defaultMessage: "对象",
      }),
      dataIndex: "obj",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.action",
        defaultMessage: "操作",
      }),
      dataIndex: "act",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.policyList.effect",
        defaultMessage: "效果",
      }),
      dataIndex: "eft",
      valueType: "select",
      valueEnum: {
        allow: {
          text: intl.formatMessage({
            id: "pages.policyList.effect.allow",
            defaultMessage: "允许",
          }),
          status: "Success",
        },
        deny: {
          text: intl.formatMessage({
            id: "pages.policyList.effect.deny",
            defaultMessage: "拒绝",
          }),
          status: "Error",
        },
      },
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolConfigDetail.roleGroup",
        defaultMessage: "角色分组",
      }),
      dataIndex: "g",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
  ];

  const associatedUsersDataRequest = async (params: any) => {
    try {
      if (!quotaPoolName) {
        return {
          data: [],
          success: false,
          total: 0,
        };
      }

      // 先获取配额池关联的用户UPN列表
      const usersResponse = await getUsersAPI({
        quotaPool: quotaPoolName,
      });

      if (!usersResponse?.users || !Array.isArray(usersResponse.users)) {
        return {
          data: [],
          success: true,
          total: 0,
        };
      }

      // 构建搜索条件，基于获取到的用户UPN列表
      const filter: API.FilterGroup = {
        logic: "and",
        conditions: [
          {
            field: "upn",
            op: "in",
            value: usersResponse.users,
          },
        ],
      };

      // 添加搜索条件过滤
      if (params.upn) {
        filter.conditions?.push({
          field: "upn",
          op: "like",
          value: `%${params.upn}%`,
        });
      }
      if (params.name) {
        filter.conditions?.push({
          field: "name",
          op: "like",
          value: `%${params.name}%`,
        });
      }
      if (params.employeeId) {
        filter.conditions?.push({
          field: "employeeId",
          op: "like",
          value: `%${params.employeeId}%`,
        });
      }

      // 调用用户信息查询API获取详细信息
      const userInfoResponse = await postUserinfosFilter({
        filter,
        pagination: {
          page: params.current || 1,
          pageSize: params.pageSize || 10,
          all: false,
        },
        sort: [],
        verbose: true,
      });

      if (
        !userInfoResponse.userInfos ||
        !Array.isArray(userInfoResponse.userInfos)
      ) {
        return {
          data: [],
          success: true,
          total: 0,
        };
      }

      // 转换数据格式
      const userData: UserInfo[] = userInfoResponse.userInfos.map(
        (user: any, index: number) => ({
          key: user.upn || `user-${index}`,
          upn: user.upn || "",
          name: user.name || "",
          employeeId: user.employeeId || "-",
          tags: user.tags || [],
          department: user.department || "",
        }),
      );

      return {
        data: userData,
        success: true,
        total: userInfoResponse.total || userData.length,
      };
    } catch (error) {
      console.error("获取配额池关联用户失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.fetchUsersFailed",
          defaultMessage: "获取配额池关联用户失败",
        }),
      );
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const quotaPoolRulesDataRequest = async (params: any) => {
    try {
      // 请求参数
      const getPolicyRequestParams = {
        sub: params.sub || undefined,
        obj: params.obj || undefined,
        act: params.act || undefined,
        eft: params.eft || undefined,
        rule: params.raw || undefined,
        page: params.current || 1,
        pageSize: params.pageSize || 5,
      };

      const res = await getPolcyAPI(getPolicyRequestParams);

      if (res?.policies) {
        // 格式化数据
        const formattedData = res.policies.map(
          (policy: any, index: number) => ({
            id: `policy_${index}`,
            sub: policy[0] || `subject_${index}`,
            obj: policy[1] || `object_${index}`,
            act: policy[2] || `action_${index}`,
            eft: policy[3] || "allow",
            g: policy[4] || "",
            raw: policy,
          }),
        );

        return {
          data: formattedData,
          success: true,
          total: res.total || 0,
        };
      } else {
        // 没有数据直接返回空数据
        return {
          data: [],
          success: true,
          total: 0,
        };
      }
    } catch (error) {
      console.error("获取权限规则失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.fetchRulesFailed",
          defaultMessage: "获取权限规则失败",
        }),
      );
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <GridContent>
      <Card
        title={intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.detailInfo",
          defaultMessage: "详细信息",
        })}
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
        extra={
          <Space>
            <Button loading={refreshUsersLoading} onClick={handleRefreshUsers}>
              {intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.refreshUsers",
                defaultMessage: "刷新关联用户",
              })}
            </Button>
            <Button type="primary" onClick={handleEditClick}>
              {intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.edit",
                defaultMessage: "编辑",
              })}
            </Button>
          </Space>
        }
      >
        <Descriptions
          style={{
            marginBottom: 24,
          }}
        >
          <Descriptions.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.refreshCycle",
              defaultMessage: "刷新周期",
            })}
          >
            {quotaPoolDetail?.cronCycle
              ? parseCronExpression(quotaPoolDetail.cronCycle)
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.regularQuota",
              defaultMessage: "定期配额",
            })}
          >
            ${quotaPoolDetail?.regularQuota?.toFixed(2) || "0.00"}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.extraQuota",
              defaultMessage: "加油包",
            })}
          >
            ${quotaPoolDetail?.extraQuota?.toFixed(2) || "0.00"}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.balancePercentage",
              defaultMessage: "余额百分比",
            })}
          >
            {quotaPoolDetail ? (
              <Progress
                percent={Number(
                  (
                    ((quotaPoolDetail.remainingQuota +
                      quotaPoolDetail.extraQuota) /
                      (quotaPoolDetail.regularQuota +
                        quotaPoolDetail.extraQuota)) *
                    100
                  ).toFixed(1),
                )}
                success={{
                  percent: Number(
                    (
                      (quotaPoolDetail.remainingQuota /
                        (quotaPoolDetail.regularQuota +
                          quotaPoolDetail.extraQuota)) *
                      100
                    ).toFixed(1),
                  ),
                }}
              />
            ) : (
              <Progress percent={0} />
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.associatedUsers",
          defaultMessage: "配额池关联用户",
        })}
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <ProTable<UserInfo>
          actionRef={associatedUsersActionRef}
          columns={associatedUsersColumns}
          rowKey="upn"
          search={{
            labelWidth: "auto",
            defaultCollapsed: false,
            filterType: "query",
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) =>
              intl.formatMessage(
                {
                  id: "pages.quotaPoolConfigDetail.totalRecords",
                  defaultMessage: "共 {total} 条数据",
                },
                { total },
              ),
          }}
          request={associatedUsersDataRequest}
        />
      </Card>

      <Card
        title={intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.quotaPoolRules",
          defaultMessage: "配额池权限规则",
        })}
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <ProTable
          columns={quotaPoolRulesColumns}
          rowKey="id"
          search={false}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total) =>
              intl.formatMessage(
                {
                  id: "pages.quotaPoolConfigDetail.totalRecords",
                  defaultMessage: "共 {total} 条数据",
                },
                { total },
              ),
          }}
          request={quotaPoolRulesDataRequest}
        />
      </Card>

      {/* 编辑配额池模态框 */}
      <Modal
        title={intl.formatMessage({
          id: "pages.quotaPoolConfigDetail.edit.title",
          defaultMessage: "编辑配额池",
        })}
        open={isEditModalOpen}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        confirmLoading={editLoading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.edit.quotaPoolName",
              defaultMessage: "配额池名称",
            })}
            name="quotaPoolName"
          >
            <Input
              disabled
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.edit.quotaPoolName.placeholder",
                defaultMessage: "配额池名称（不可修改）",
              })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.edit.cronCycle",
              defaultMessage: "刷新周期（Cron表达式）",
            })}
            name="cronCycle"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.quotaPoolConfigDetail.edit.cronCycle.required",
                  defaultMessage: "请输入刷新周期",
                }),
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    cronstrue.toString(value, {
                      throwExceptionOnParseError: true,
                    });
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: "pages.quotaPoolConfigDetail.edit.cronCycle.invalid",
                          defaultMessage: "Cron 表达式格式不正确",
                        }),
                      ),
                    );
                  }
                },
              },
            ]}
            validateStatus={
              cronError ? "error" : cronDescription ? "success" : ""
            }
            help={
              cronError ? (
                <span style={{ color: "#ff4d4f" }}>{cronError}</span>
              ) : cronDescription ? (
                <span style={{ color: "#52c41a" }}>
                  {intl.formatMessage(
                    {
                      id: "pages.quotaPoolConfigDetail.edit.cronCycle.help",
                      defaultMessage: "执行时间：{description}",
                    },
                    { description: cronDescription },
                  )}
                </span>
              ) : null
            }
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.edit.cronCycle.placeholder",
                defaultMessage: "请输入标准 Cron 表达式，例如：0 3 * * *",
              })}
              onChange={(e) => handleCronChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.edit.regularQuota",
              defaultMessage: "定期配额",
            })}
            name="regularQuota"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.quotaPoolConfigDetail.edit.regularQuota.required",
                  defaultMessage: "请输入定期配额",
                }),
              },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.edit.regularQuota.placeholder",
                defaultMessage: "请输入定期配额，例如：10",
              })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.edit.extraQuota",
              defaultMessage: "额外配额",
            })}
            name="extraQuota"
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.edit.extraQuota.placeholder",
                defaultMessage: "请输入额外配额，默认为0",
              })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.edit.quotaPoolTypeLabel",
              defaultMessage: "配额池类型",
            })}
            name="personal"
          >
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={false}>
                {intl.formatMessage({
                  id: "pages.quotaPoolConfigDetail.edit.quotaPoolType.shared",
                  defaultMessage: "共享配额池",
                })}
              </Radio.Button>
              <Radio.Button value={true}>
                {intl.formatMessage({
                  id: "pages.quotaPoolConfigDetail.edit.quotaPoolType.personal",
                  defaultMessage: "个人配额池",
                })}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolConfigDetail.edit.enabledStatus",
              defaultMessage: "启用状态",
            })}
            name="enabled"
            valuePropName="checked"
          >
            <Switch
              checkedChildren={intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.edit.enabled",
                defaultMessage: "启用",
              })}
              unCheckedChildren={intl.formatMessage({
                id: "pages.quotaPoolConfigDetail.edit.disabled",
                defaultMessage: "禁用",
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </GridContent>
  );
};

export default ConfigDetailTab;
