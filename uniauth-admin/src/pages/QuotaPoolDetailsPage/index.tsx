import {
  GridContent,
  PageContainer,
  ProTable,
  RouteContext,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Space,
  Statistic,
  Progress,
} from "antd";

import type { FC } from "react";
import { useIntl } from '@umijs/max';
import useStyles from "./style.style";

const QuotaPoolDetailsPage: FC<{}> = () => {
  const intl = useIntl();
  const { styles } = useStyles();

  const associatedUsersColumns: ProColumns<any>[] = [
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersColumns.upn' }),
      valueType: "text",
      dataIndex: "upn",
      search: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersColumns.displayName' }),
      valueType: "text",
      dataIndex: "displayName",
      search: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersColumns.identity' }),
      valueType: "text",
      dataIndex: "identity",
      search: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersColumns.tags' }),
      valueType: "text",
      dataIndex: "tags",
      search: false,
      render: (_, record) =>
        record.tags?.map((tag: string) => (
          <Badge key={tag} color="blue" text={tag} />
        )),
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersColumns.department' }),
      valueType: "text",
      dataIndex: "department",
      search: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersColumns.actions' }),
      valueType: "option",
      width: 100,
      render: (_, record) => [
        <Button
          type="link"
          key="detail"
          onClick={() => handleUserDetail(record)}
        >
          {intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersColumns.viewDetails' })}
        </Button>,
      ],
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
        item.upn.includes(params.upn as string)
      );
    }
    if (params.displayName) {
      example_data = example_data.filter((item) =>
        item.displayName.includes(params.displayName as string)
      );
    }
    if (params.identity) {
      example_data = example_data.filter((item) =>
        item.identity.includes(params.identity as string)
      );
    }
    if (params.department) {
      example_data = example_data.filter((item) =>
        item.department.includes(params.department as string)
      );
    }

    return {
      data: example_data,
      success: true,
      total: 2,
    };
  };

  const itToolsRulesColumns: ProColumns<any>[] = [
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.columns.subject' }),
      dataIndex: "sub",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.columns.domain' }),
      dataIndex: "dom",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.columns.object' }),
      dataIndex: "obj",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.columns.action' }),
      dataIndex: "act",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.columns.effect' }),
      dataIndex: "eft",
      valueType: "select",
      valueEnum: {
        allow: { text: intl.formatMessage({ id: 'pages.quotaPoolDetails.allow' }), status: "Success" },
        deny: { text: intl.formatMessage({ id: 'pages.quotaPoolDetails.deny' }), status: "Error" },
      },
      ellipsis: true,
      search: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.quotaPoolDetails.columns.roleGroup' }),
      dataIndex: "g",
      valueType: "text",
      ellipsis: true,
      search: true,
    },
  ];

  const itToolsRulesDataRequest = async (_params: any) => {
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
      total: 2,
    };
  };

  const action = (
    <RouteContext.Consumer>
      {() => {
        return (
          <Space>
            <Button type="primary">{intl.formatMessage({ id: 'pages.quotaPoolDetails.resetPool' })}</Button>
            <Button color="danger" variant="solid">
              {intl.formatMessage({ id: 'pages.quotaPoolDetails.disablePool' })}
            </Button>
          </Space>
        );
      }}
    </RouteContext.Consumer>
  );

  const extra = (
    <div className={styles.moreInfo}>
      <Statistic title={intl.formatMessage({ id: 'pages.quotaPoolDetails.status' })} value={intl.formatMessage({ id: 'pages.quotaPoolDetails.inUse' })} valueStyle={{ color: "green" }} />
      <Statistic title={intl.formatMessage({ id: 'pages.quotaPoolDetails.balance' })} value={496} prefix="$" />
    </div>
  );

  const description = (
    <RouteContext.Consumer>
      {({ isMobile }) => (
        <Descriptions
          className={styles.headerList}
          size="small"
          column={isMobile ? 1 : 2}
        >
          <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.poolName' })}>sutdent_pool</Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.creator' })}>{intl.formatMessage({ id: 'pages.quotaPoolDetails.itAdmin' })}</Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.poolType' })}>{intl.formatMessage({ id: 'pages.quotaPoolDetails.selfBuiltPool' })}</Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.createTime' })}>2025-9-8</Descriptions.Item>
        </Descriptions>
      )}
    </RouteContext.Consumer>
  );

  const handleUserDetail = (record: any) => {
    // TODO: 跳转展示用户详情页
    console.log(intl.formatMessage({ id: 'pages.quotaPoolDetails.viewUserDetails' }), record);
  };

  return (
    <PageContainer
      title={intl.formatMessage({ id: 'pages.quotaPoolDetails.title' })}
      extra={action}
      className={styles.pageHeader}
      content={description}
      extraContent={extra}
      tabList={[
        {
          key: "config_detail",
          tab: intl.formatMessage({ id: 'pages.quotaPoolDetails.configTab' }),
        },
        {
          key: "bill_detail",
          tab: intl.formatMessage({ id: 'pages.quotaPoolDetails.billTab' }),
        },
      ]}
    >
      <div className={styles.main}>
        <GridContent>
          <Card
            title={intl.formatMessage({ id: 'pages.quotaPoolDetails.detailsTitle' })}
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
              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.poolName' })}>
                example@cuhk.edu.cn
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.refreshCycle' })}>{intl.formatMessage({ id: 'pages.quotaPoolDetails.weekly' })}</Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.lastRefreshTime' })}>
                2025-8-29 19:30:00
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.regularQuota' })}>$648.00</Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.remainingQuota' })}>$328.00</Descriptions.Item>

              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.topUpPackage' })}>$168.00</Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: 'pages.quotaPoolDetails.balancePercentage' })}>
                <Progress
                  percent={Number(
                    (((328 + 168) / (648 + 168)) * 100).toFixed(1)
                  )}
                  success={{
                    percent: Number(((328 / (648 + 168)) * 100).toFixed(1)),
                  }}
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card
            title={intl.formatMessage({ id: 'pages.quotaPoolDetails.associatedUsersTitle' })}
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
            title={intl.formatMessage({ id: 'pages.quotaPoolDetails.itToolsRulesTitle' })}
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
      </div>
    </PageContainer>
  );
};

export default QuotaPoolDetailsPage;
