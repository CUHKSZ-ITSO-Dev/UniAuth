import {
  GridContent,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { Badge, Button, Card, Descriptions, Progress } from "antd";
import type { FC } from "react";
import { getAuthQuotaPoolsUsers as getUsersAPI } from "@/services/uniauthService/auth";
import { postAuthAdminPoliciesFilter as getPolcyAPI } from "@/services/uniauthService/query";
import { getQuotaPool as getConfigAPI } from "@/services/uniauthService/quotaPool";

const ConfigDetailTab: FC = () => {
  const associatedUsersColumns: ProColumns<any>[] = [
    {
      title: "UPN",
      valueType: "text",
      dataIndex: "upn",
      search: true,
      ellipsis: true,
    },
    {
      title: "显示名",
      valueType: "text",
      dataIndex: "displayName",
      search: true,
      ellipsis: true,
    },
    {
      title: "身份",
      valueType: "text",
      dataIndex: "identity",
      search: true,
      ellipsis: true,
    },
    {
      title: "标签",
      valueType: "text",
      dataIndex: "tags",
      search: false,
      render: (_: any, record: any) =>
        record.tags?.map((tag: string) => (
          <Badge key={tag} color="blue" text={tag} />
        )),
    },
    {
      title: "部门信息",
      valueType: "text",
      dataIndex: "department",
      search: true,
      ellipsis: true,
    },
    {
      title: "操作",
      valueType: "option",
      width: 100,
      render: (_: any, record: any) => [
        <Button
          type="link"
          key="detail"
          onClick={() => handleUserDetail(record)}
        >
          查看详情
        </Button>,
      ],
    },
  ];

  const quotaPoolRulesColumns: ProColumns<any>[] = [
    {
      title: "主体",
      dataIndex: "sub",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: "对象",
      dataIndex: "obj",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: "操作",
      dataIndex: "act",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: "效果",
      dataIndex: "eft",
      valueType: "select",
      valueEnum: {
        allow: {
          text: "允许",
          status: "Success",
        },
        deny: {
          text: "拒绝",
          status: "Error",
        },
      },
      ellipsis: true,
      search: true,
    },
    {
      title: "角色分组",
      dataIndex: "g",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
  ];

  const itToolsRulesColumns: ProColumns<any>[] = [
    {
      title: "完整规则",
      dataIndex: "userinfosRules",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
  ];

  const associatedUsersDataRequest = async (params: any) => {
    try {
      console.log("开始获取配额池关联用户...", params);

      // 构建API请求参数
      const requestParams = {
        quotaPool: "student_pool", // 可以从props或URL参数获取
      };

      // 调用真实API获取配额池关联用户
      const response = await getUsersAPI(requestParams);

      console.log("API响应:", response);

      if (response && response.users) {
        // Mock API返回的是随机字符串数组，转换为表格需要的格式
        const userData = response.users.map((userId: string, index: number) => {
          // 为Mock数据生成合理的显示信息
          const mockUserInfo = {
            key: index,
            upn: `${userId}@link.cuhk.edu.cn`, // 将Mock ID转换为UPN格式
            displayName: `用户${index + 1}`, // 生成显示名
            identity:
              index % 3 === 0 ? "管理员" : index % 3 === 1 ? "教师" : "学生",
            tags: index % 2 === 0 ? ["VIP"] : ["普通用户"],
            department: [
              "计算机科学系",
              "数学系",
              "物理系",
              "化学系",
              "生物系",
            ][index % 5],
          };
          return mockUserInfo;
        });

        // 根据前端搜索参数进行客户端过滤
        let filteredData = userData;

        if (params.upn) {
          filteredData = filteredData.filter((item) =>
            item.upn.toLowerCase().includes(params.upn.toLowerCase()),
          );
        }
        if (params.displayName) {
          filteredData = filteredData.filter((item) =>
            item.displayName
              .toLowerCase()
              .includes(params.displayName.toLowerCase()),
          );
        }
        if (params.identity) {
          filteredData = filteredData.filter((item) =>
            item.identity.toLowerCase().includes(params.identity.toLowerCase()),
          );
        }
        if (params.department) {
          filteredData = filteredData.filter((item) =>
            item.department
              .toLowerCase()
              .includes(params.department.toLowerCase()),
          );
        }

        // 处理分页参数
        const { current = 1, pageSize = 5 } = params;
        const startIndex = (current - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        console.log("处理后的用户数据:", {
          total: filteredData.length,
          current,
          pageSize,
          paginatedData,
        });

        return {
          data: paginatedData,
          success: true,
          total: filteredData.length,
        };
      }

      // 如果没有数据，直接返回错误
      console.log("没有用户数据");
      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error("获取配额池关联用户失败:", error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const quotaPoolRulesDataRequest = async (params: any) => {
    try {
      console.log("开始获取权限规则...", params);

      // 请求参数
      const getPolicyRequestParams = {
        sub: params.sub,
        obj: params.obj,
        act: params.act,
        eft: params.eft,
      };

      const res = await getPolcyAPI(getPolicyRequestParams);

      console.log("权限规则API响应:", res);

      if (res && res.policies) {
        // Mock API返回的是二维字符串数组，转换为策略格式
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

        // 处理分页参数
        const { current = 1, pageSize = 5 } = params;
        const startIndex = (current - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = formattedData.slice(startIndex, endIndex);

        console.log("权限规则分页数据:", {
          total: formattedData.length,
          current,
          pageSize,
          paginatedData,
        });

        return {
          data: paginatedData,
          success: true,
          total: formattedData.length,
        };
      }

      // 没有数据直接返回错误
      console.log("没有权限规则数据");
      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error("获取权限规则失败:", error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const itToolsRulesDataRequest = async (params: any = {}) => {
    try {
      console.log("开始获取ITTools规则...");

      // 请求参数
      const getRequestParams = {
        quotaPoolName: "student_pool",
      };

      const res = await getConfigAPI({ ...getRequestParams });

      console.log("ITTools规则API响应:", res);

      if (res && (res as any).quotaPool) {
        // Mock API返回的格式与类型定义不完全匹配，使用any类型处理
        const mockQuotaPool = (res as any).quotaPool;
        const formattedData = [
          {
            id: 1,
            quotaPoolName: "student_pool",
            userinfosRules: `Rules for ${mockQuotaPool}: department='CS' OR tags contains 'student'`,
          },
        ];

        // 处理分页参数
        const { current = 1, pageSize = 5 } = params;
        const startIndex = (current - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = formattedData.slice(startIndex, endIndex);

        console.log("ITTools规则分页数据:", {
          total: formattedData.length,
          current,
          pageSize,
          paginatedData,
        });

        return {
          data: paginatedData,
          success: true,
          total: formattedData.length,
        };
      }

      // 没有数据直接返回错误
      console.log("没有ITTools规则数据");
      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error("获取ITTools规则失败:", error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  const handleUserDetail = (record: any) => {
    // TODO: 跳转展示用户详情页
    console.log("查看用户详情", record);
  };

  return (
    <GridContent>
      <Card
        title="详细信息"
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
          <Descriptions.Item label="配额池名称">
            example@cuhk.edu.cn
          </Descriptions.Item>
          <Descriptions.Item label="刷新周期">每周</Descriptions.Item>
          <Descriptions.Item label="上次刷新时间">
            2025-8-29 19:30:00
          </Descriptions.Item>
          <Descriptions.Item label="定期配额">$648.00</Descriptions.Item>
          <Descriptions.Item label="剩余配额">$328.00</Descriptions.Item>
          <Descriptions.Item label="加油包">$168.00</Descriptions.Item>
          <Descriptions.Item label="余额百分比">
            <Progress
              percent={Number((((328 + 168) / (648 + 168)) * 100).toFixed(1))}
              success={{
                percent: Number(((328 / (648 + 168)) * 100).toFixed(1)),
              }}
            />
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
        <ProTable
          columns={associatedUsersColumns}
          rowKey="upn"
          search={{ labelWidth: "auto" }}
          pagination={{ pageSize: 5 }}
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
          pagination={{ pageSize: 5 }}
          request={quotaPoolRulesDataRequest}
        />
      </Card>

      <Card
        title="配额池ITTools规则"
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <ProTable
          columns={itToolsRulesColumns}
          rowKey="id"
          search={false}
          pagination={{ pageSize: 5 }}
          request={itToolsRulesDataRequest}
        />
      </Card>
    </GridContent>
  );
};

export default ConfigDetailTab;
