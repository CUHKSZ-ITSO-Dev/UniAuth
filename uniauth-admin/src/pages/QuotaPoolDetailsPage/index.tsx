import { PageContainer, RouteContext } from "@ant-design/pro-components";
import { useParams } from "@umijs/max";
import { Button, Descriptions, Space, Statistic } from "antd";

import type { FC } from "react";
import { useEffect, useState } from "react";
import BillingDetailTab from "./BillingDetailTab";
import ConfigDetailTab from "./ConfigDetailTab";
import useStyles from "./style.style";

const QuotaPoolDetailsPage: FC = () => {
  const { styles } = useStyles();
  const { quotaPoolName: urlQuotaPoolName } = useParams<{
    quotaPoolName: string;
  }>();

  // quotaPoolName 状态管理
  const [quotaPoolName, setQuotaPoolName] = useState("");
  const [loading, setLoading] = useState(true);

  // Tab 状态管理
  const [activeTabKey, setActiveTabKey] = useState("config_detail");

  // 从URL参数获取配额池名称
  useEffect(() => {
    if (urlQuotaPoolName) {
      try {
        // URL解码配额池名称（处理特殊字符如@符号）
        const decodedQuotaPoolName = decodeURIComponent(urlQuotaPoolName);
        setQuotaPoolName(decodedQuotaPoolName);
      } catch (error) {
        console.error("Failed to decode quota pool name:", error);
        // 如果解码失败，直接使用原始值
        setQuotaPoolName(urlQuotaPoolName);
      }
    }
    setLoading(false);
  }, [urlQuotaPoolName]);

  // Tab 切换处理函数
  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  const action = (
    <RouteContext.Consumer>
      {() => {
        return (
          <Space>
            <Button type="primary">重置配额池</Button>
            <Button color="danger" variant="solid">
              禁用配额池
            </Button>
          </Space>
        );
      }}
    </RouteContext.Consumer>
  );

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
          <Descriptions.Item label="配额池名称">
            {loading
              ? "加载中..."
              : quotaPoolName || urlQuotaPoolName || "未知配额池"}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">IT管理员</Descriptions.Item>
          <Descriptions.Item label="配额池类型">自建配额池</Descriptions.Item>
          <Descriptions.Item label="创建时间">2025-9-8</Descriptions.Item>
        </Descriptions>
      )}
    </RouteContext.Consumer>
  );

  // 根据当前激活的 tab 渲染对应内容
  const renderTabContent = () => {
    switch (activeTabKey) {
      case "config_detail":
        return <ConfigDetailTab quotaPoolName={quotaPoolName} />;
      case "bill_detail":
        return <BillingDetailTab quotaPoolName={quotaPoolName} />;
      default:
        return <ConfigDetailTab quotaPoolName={quotaPoolName} />;
    }
  };

  return (
    <PageContainer
      title="配额池详情"
      extra={action}
      className={styles.pageHeader}
      content={description}
      extraContent={extra}
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
      tabActiveKey={activeTabKey}
      onTabChange={handleTabChange}
    >
      <div className={styles.main}>{renderTabContent()}</div>
    </PageContainer>
  );
};

export default QuotaPoolDetailsPage;
