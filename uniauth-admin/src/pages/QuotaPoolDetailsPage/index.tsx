import { PageContainer, RouteContext } from "@ant-design/pro-components";
import { useParams } from "@umijs/max";
import { Button, Descriptions, message, Space, Statistic } from "antd";

import type { FC } from "react";
import { useEffect, useState } from "react";
import { getQuotaPool } from "@/services/uniauthService/quotaPool";
import BillingDetailTab from "./BillingDetailTab";
import ConfigDetailTab from "./ConfigDetailTab";
import useStyles from "./style.style";

// 配额池详细信息接口
interface QuotaPoolDetail {
  quotaPoolName: string;
  cronCycle: string;
  regularQuota: number;
  remainingQuota: number;
  extraQuota: number;
  lastResetAt: string;
  personal: boolean;
  disabled: boolean;
  createdAt: string;
}

const QuotaPoolDetailsPage: FC = () => {
  const { styles } = useStyles();
  const { quotaPoolName: urlQuotaPoolName } = useParams<{
    quotaPoolName: string;
  }>();

  // quotaPoolName 状态管理
  const [quotaPoolName, setQuotaPoolName] = useState("");
  const [loading, setLoading] = useState(true);

  // 配额池详细信息状态管理
  const [quotaPoolDetail, setQuotaPoolDetail] =
    useState<QuotaPoolDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  // 获取配额池详细信息
  useEffect(() => {
    const fetchQuotaPoolDetail = async () => {
      if (!quotaPoolName) return;

      setDetailLoading(true);
      try {
        const response = await getQuotaPool({
          quotaPoolName: quotaPoolName,
        });

        if (response?.items && response.items.length > 0) {
          const item = response.items[0];
          setQuotaPoolDetail({
            quotaPoolName: item.quotaPoolName || "",
            cronCycle: item.cronCycle || "",
            regularQuota: Number(item.regularQuota) || 0,
            remainingQuota: Number(item.remainingQuota) || 0,
            extraQuota: Number(item.extraQuota) || 0,
            lastResetAt: item.lastResetAt || "",
            personal: item.personal || false,
            disabled: item.disabled || false,
            createdAt: item.createdAt || "",
          });
        }
      } catch (error) {
        console.error("获取配额池详情失败:", error);
        message.error("获取配额池详情失败");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchQuotaPoolDetail();
  }, [quotaPoolName]);

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
      <Statistic
        title="配额池余额"
        value={
          quotaPoolDetail
            ? (
                quotaPoolDetail.remainingQuota + quotaPoolDetail.extraQuota
              ).toFixed(2)
            : 0
        }
        prefix="$"
        loading={detailLoading}
      />
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
          <Descriptions.Item label="配额池类型">
            {quotaPoolDetail?.personal ? "个人配额池" : "共享配额池"}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {quotaPoolDetail?.createdAt || "未知时间"}
          </Descriptions.Item>
          <Descriptions.Item label="重置时间">
            {quotaPoolDetail?.lastResetAt || "未知时间"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </RouteContext.Consumer>
  );

  // 根据当前激活的 tab 渲染对应内容
  const renderTabContent = () => {
    switch (activeTabKey) {
      case "config_detail":
        return (
          <ConfigDetailTab
            quotaPoolName={quotaPoolName}
            quotaPoolDetail={quotaPoolDetail}
          />
        );
      case "bill_detail":
        return <BillingDetailTab quotaPoolName={quotaPoolName} />;
      default:
        return (
          <ConfigDetailTab
            quotaPoolName={quotaPoolName}
            quotaPoolDetail={quotaPoolDetail}
          />
        );
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
