import type { ActionType } from "@ant-design/pro-components";
import {
  GridContent,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import { Badge, Button, Card, Descriptions, Progress } from "antd";
import type { FC } from "react";
import { useRef, useState } from "react";
import { getQuotaPool as getConfigAPI } from "@/services/uniauthService/quotaPool";

// uniauth-gf.api.quotaPool.v1.GetQuotaPoolRes
interface GetQuotaPoolConfigData {
  // 是否为全部数据查询
  isAll?: boolean;
  // 配额池列表或单个配置
  items?: [
    {
      createdAt?: string;
      cronCycle?: string;
      disabled?: boolean;
      extraQuota?: { [key: string]: any };
      id?: number;
      lastResetAt?: string;
      personal?: boolean;
      quotaPoolName?: string;
      regularQuota?: { [key: string]: any };
      remainingQuota?: { [key: string]: any };
      updatedAt?: string;
      userinfosRules?: { [key: string]: any };
      [property: string]: any;
    },
  ][];
  total?: number;
  // 当前页码
  page?: number;
  // 总页数
  totalPages?: number;
  // 每页条数
  pageSize?: number;
  //
  [property: string]: any;
}

const getData = async (params: any) => {
  // 请求参数
  const getRequestParams = {
    quotaPoolName: "student_pool",
  };

  const res = await getConfigAPI({ ...getRequestParams, ...params });

  const formattedData = res.items?.map((item: any) => ({
    id: item.id,
    quotaPoolName: item.quotaPoolName,
    cronCycle: item.cronCycle,
    regularQuota: item.regularQuota,
    remainingQuota: item.remainingQuota,
    lastResetAt: item.lastResetAt,
    extraQuota: item.extraQuota,
    personal: item.personal,
    disabled: item.disabled,
    userinfosRules: item.userinfosRules,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
  return {
    data: formattedData,
    success: true,
    total: formattedData?.length,
  };
};

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
      render: (_, record) =>
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
      render: (_, record) => [
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
    // TODO: 替换为实际请求
    let example_data = [
      {
        upn: "user1@cuhk.edu.cn",
        displayName: "张三",
        identity: "管理员",
        tags: ["VIP", "研发"],
        department: "信息技术部",
      },
      {
        upn: "user2@cuhk.edu.cn",
        displayName: "李四",
        identity: "普通用户",
        tags: ["测试"],
        department: "测试部",
      },
      {
        upn: "user3@cuhk.edu.cn",
        displayName: "王五",
        identity: "管理员",
        tags: ["运维"],
        department: "运维部",
      },
      {
        upn: "user4@cuhk.edu.cn",
        displayName: "赵六",
        identity: "普通用户",
        tags: ["AI"],
        department: "人工智能部",
      },
      {
        upn: "user5@cuhk.edu.cn",
        displayName: "钱七",
        identity: "普通用户",
        tags: ["大数据"],
        department: "大数据部",
      },
    ];

    if (params.upn) {
      example_data = example_data.filter((item) =>
        item.upn.includes(params.upn as string),
      );
    }
    if (params.displayName) {
      example_data = example_data.filter((item) =>
        item.displayName.includes(params.displayName as string),
      );
    }
    if (params.identity) {
      example_data = example_data.filter((item) =>
        item.identity.includes(params.identity as string),
      );
    }
    if (params.department) {
      example_data = example_data.filter((item) =>
        item.department.includes(params.department as string),
      );
    }

    return {
      data: example_data,
      success: true,
      total: example_data.length,
    };
  };

  const quotaPoolRulesDataRequest = async (_params: any) => {
    // TODO: 替换为实际请求
    const example_data = [
      {
        id: 1,
        sub: "alice",
        dom: "domain1",
        obj: "data1",
        act: "read",
        eft: "allow",
        g: "group1",
      },
      {
        id: 2,
        sub: "bob",
        dom: "domain2",
        obj: "data2",
        act: "write",
        eft: "deny",
        g: "group2",
      },
      {
        id: 3,
        sub: "data2_admin",
        dom: "domain2",
        obj: "data2",
        act: "read|write|delete",
        eft: "allow",
        g: "group3",
      },
      {
        id: 4,
        sub: "data1_admin",
        dom: "domain1",
        obj: "data1",
        act: "read|write|delete",
        eft: "allow",
        g: "group1",
      },
    ];

    return {
      data: example_data,
      success: true,
      total: example_data.length,
    };
  };

  const itToolsRulesDataRequest = async (params: any) => {
    // 请求参数
    const getRequestParams = {
      quotaPoolName: "student_pool",
    };

    const res = await getConfigAPI({ ...getRequestParams });

    const formattedData = res.items?.map((item: any) => ({
      id: item.id,
      quotaPoolName: item.quotaPoolName,
      cronCycle: item.cronCycle,
      regularQuota: item.regularQuota,
      remainingQuota: item.remainingQuota,
      lastResetAt: item.lastResetAt,
      extraQuota: item.extraQuota,
      personal: item.personal,
      disabled: item.disabled,
      userinfosRules: item.userinfosRules,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
    return {
      data: formattedData,
      success: true,
    };
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
          search={false}
          pagination={{ pageSize: 5 }}
          request={itToolsRulesDataRequest}
        />
      </Card>
    </GridContent>
  );
};

export default ConfigDetailTab;
