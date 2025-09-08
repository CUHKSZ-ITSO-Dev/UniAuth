import { DingdingOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
  GridContent,
  PageContainer,
  RouteContext,
} from "@ant-design/pro-components";
import { useRequest } from "@umijs/max";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Popover,
  Space,
  Statistic,
  Steps,
  Table,
  Flex,
  Progress,
  Tooltip,
  Row,
  Col,
} from "antd";
import classNames from "classnames";
import type { FC } from "react";
import React, { useState } from "react";
import type { AdvancedProfileData } from "./data.d";
import { queryAdvancedProfile } from "./service";
import useStyles from "./style.style";

const { Step } = Steps;
const ButtonGroup = Button.Group;

const action = (
  <RouteContext.Consumer>
    {({ isMobile }) => {
      return (
        <Space>
          <Button type="primary">禁用配额池</Button>
        </Space>
      );
    }}
  </RouteContext.Consumer>
);

const operationTabList = [
  {
    key: "tab1",
    tab: "操作日志一",
  },
  {
    key: "tab2",
    tab: "操作日志二",
  },
  {
    key: "tab3",
    tab: "操作日志三",
  },
];
const columns = [
  {
    title: "操作类型",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "操作人",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "执行结果",
    dataIndex: "status",
    key: "status",
    render: (text: string) => {
      if (text === "agree") {
        return <Badge status="success" text="成功" />;
      }
      return <Badge status="error" text="驳回" />;
    },
  },
  {
    title: "操作时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
  },
  {
    title: "备注",
    dataIndex: "memo",
    key: "memo",
  },
];
type AdvancedState = {
  operationKey: "tab1" | "tab2" | "tab3";
  tabActiveKey: string;
};
const QuotaPoolDetailsPage: FC = () => {
  const { styles } = useStyles();

  const extra = (
    <div className={styles.moreInfo}>
      <Statistic title="状态" value="使用中" valueStyle={{ color: "green" }} />
      <Statistic title="配额池余额" value={496} prefix="$" />
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
          <Descriptions.Item label="创建人">IT管理员</Descriptions.Item>
          <Descriptions.Item label="配额池类型">自建配额池</Descriptions.Item>
          <Descriptions.Item label="创建时间">2025-9-8</Descriptions.Item>
          <Descriptions.Item label="备注">不知道写啥随便写点</Descriptions.Item>
        </Descriptions>
      )}
    </RouteContext.Consumer>
  );

  const [tabStatus, seTabStatus] = useState<AdvancedState>({
    operationKey: "tab1",
    tabActiveKey: "detail",
  });

  const { data = {}, loading } = useRequest<{
    data: AdvancedProfileData;
  }>(queryAdvancedProfile);
  const { advancedOperation1, advancedOperation2, advancedOperation3 } = data;
  const contentList = {
    tab1: (
      <Table
        pagination={false}
        loading={loading}
        dataSource={advancedOperation1}
        columns={columns}
      />
    ),
    tab2: (
      <Table
        pagination={false}
        loading={loading}
        dataSource={advancedOperation2}
        columns={columns}
      />
    ),
    tab3: (
      <Table
        pagination={false}
        loading={loading}
        dataSource={advancedOperation3}
        columns={columns}
      />
    ),
  };
  const onTabChange = (tabActiveKey: string) => {
    seTabStatus({
      ...tabStatus,
      tabActiveKey,
    });
  };
  const onOperationTabChange = (key: string) => {
    seTabStatus({
      ...tabStatus,
      operationKey: key as "tab1",
    });
  };
  return (
    <PageContainer
      title="配额池详情"
      extra={action}
      className={styles.pageHeader}
      content={description}
      extraContent={extra}
      tabActiveKey={tabStatus.tabActiveKey}
      onTabChange={onTabChange}
      tabList={[
        {
          key: "config_detail",
          tab: "配置详情",
        },
        {
          key: "bill_detail",
          tab: "账单详情",
        },
      ]}
    >
      <div className={styles.main}>
        <GridContent>
          <Card
            title="详细信息"
            style={{
              marginBottom: 24,
            }}
            variant="borderless"
          >
            <Row>
              <Col span={18}>
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
                  <Descriptions.Item label="定期配额">
                    $648.00
                  </Descriptions.Item>
                  <Descriptions.Item label="剩余配额">
                    $328.00
                  </Descriptions.Item>

                  <Descriptions.Item label="加油包">$168.00</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={6}>
                <Tooltip title="3 done / 3 in progress / 4 to do">
                  <Progress
                    percent={Number(
                      (((328 + 168) / (648 + 168)) * 100).toFixed(1)
                    )}
                    success={{
                      percent: Number(((328 / (648 + 168)) * 100).toFixed(1)),
                    }}
                    type="dashboard"
                  />
                </Tooltip>
              </Col>
            </Row>
          </Card>
          <Card
            title="配额池关联用户"
            style={{
              marginBottom: 24,
            }}
            variant="borderless"
          >
            <Empty />
          </Card>
          <Card
            title="配置池 ITTools 规则"
            style={{
              marginBottom: 24,
            }}
            variant="borderless"
          >
            <Empty />
          </Card>
        </GridContent>
      </div>
    </PageContainer>
  );
};

export default QuotaPoolDetailsPage;
