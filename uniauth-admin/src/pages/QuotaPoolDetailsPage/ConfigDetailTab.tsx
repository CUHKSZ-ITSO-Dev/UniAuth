import { useIntl } from "@@/plugin-locale/localeExports";
import {
  GridContent,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { Link } from "@umijs/max";
import { Card, Descriptions, message, Progress, Space } from "antd";
import cronstrue from "cronstrue/i18n";
import type { FC } from "react";
import { getAuthQuotaPoolsUsers as getUsersAPI } from "@/services/uniauthService/auth";
import { postAuthAdminPoliciesFilter as getPolcyAPI } from "@/services/uniauthService/query";
import { postUserinfosFilter } from "@/services/uniauthService/userInfo";

// 配额池详细信息接口
interface QuotaPoolDetail {
  quotaPoolName: string;
  cronCycle: string;
  regularQuota: number;
  remainingQuota: number;
  extraQuota: number;
  lastResetAt: string;
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
}) => {
  const intl = useIntl();

  // 解析 cron 表达式为中文描述
  const parseCronExpression = (cronExpression: string): string => {
    if (!cronExpression || typeof cronExpression !== "string") {
      return cronExpression || "-";
    }

    try {
      return cronstrue.toString(cronExpression, {
        locale: "zh_CN",
        use24HourTimeFormat: true,
        verbose: true,
      });
    } catch (error) {
      console.error("解析 cron 表达式失败:", error);
      // 如果解析失败，返回原始表达式
      return cronExpression;
    }
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
      search: true,
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
          <Link to={`/user-list/userDetail/${record.upn}`}>详情</Link>
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
      if (params.displayName) {
        filter.conditions?.push({
          field: "displayName",
          op: "like",
          value: `%${params.displayName}%`,
        });
      }
      if (params.identity) {
        filter.conditions?.push({
          field: "employeeType",
          op: "like",
          value: `%${params.identity}%`,
        });
      }
      if (params.department) {
        filter.conditions?.push({
          field: "department",
          op: "like",
          value: `%${params.department}%`,
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
        (user: any) => ({
          key: user.upn || `user-${Math.random()}`,
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
      message.error("获取配额池关联用户失败");
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
      message.error("获取权限规则失败");
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
      >
        <Descriptions
          style={{
            marginBottom: 24,
          }}
        >
          <Descriptions.Item label="刷新周期">
            {quotaPoolDetail?.cronCycle
              ? parseCronExpression(quotaPoolDetail.cronCycle)
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="定期配额">
            ${quotaPoolDetail?.regularQuota?.toFixed(2) || "0.00"}
          </Descriptions.Item>
          <Descriptions.Item label="加油包">
            ${quotaPoolDetail?.extraQuota?.toFixed(2) || "0.00"}
          </Descriptions.Item>
          <Descriptions.Item label="余额百分比">
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
        title="配额池关联用户"
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <ProTable<UserInfo>
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
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          request={associatedUsersDataRequest}
        />
      </Card>

      <Card
        title="配额池权限规则"
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
            showTotal: (total) => `共 ${total} 条`,
          }}
          request={quotaPoolRulesDataRequest}
        />
      </Card>
    </GridContent>
  );
};

export default ConfigDetailTab;
