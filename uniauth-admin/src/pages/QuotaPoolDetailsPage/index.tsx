import { PageContainer, RouteContext } from "@ant-design/pro-components";
import { useParams } from "@umijs/max";
import { Button, Descriptions, message, Space, Statistic } from "antd";

import type { FC } from "react";
import { useEffect, useState } from "react";
import { postQuotaPoolAdminResetBalance } from "@/services/uniauthService/admin";
import {
  getQuotaPool,
  putQuotaPool,
} from "@/services/uniauthService/quotaPool";
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

  // 获取配额池详细信息的函数
  const fetchQuotaPoolDetail = async () => {
    if (!quotaPoolName) return;

    setDetailLoading(true);
    try {
      const resData = await getQuotaPool({
        quotaPoolName: quotaPoolName,
      });

      if (resData) {
        setQuotaPoolDetail({
          quotaPoolName: resData.quotaPoolName || "",
          cronCycle: resData.cronCycle || "",
          regularQuota: Number(resData.regularQuota) || 0,
          remainingQuota: Number(resData.remainingQuota) || 0,
          extraQuota: Number(resData.extraQuota) || 0,
          lastResetAt: resData.lastResetAt || "",
          personal: resData.personal || false,
          disabled: resData.disabled || false,
          createdAt: resData.createdAt || "",
        });
      }
    } catch (error) {
      console.error("获取配额池详情失败:", error);
      message.error("获取配额池详情失败");
    } finally {
      setDetailLoading(false);
    }
  };

  // 刷新配额池详细信息
  const refreshQuotaPoolDetail = async () => {
    await fetchQuotaPoolDetail();
  };

  // 获取配额池详细信息
  useEffect(() => {
    fetchQuotaPoolDetail();
  }, [quotaPoolName]);

  // Tab 切换处理函数
  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  // 重置配额池
  const handleResetQuotaPool = async () => {
    const res = await postQuotaPoolAdminResetBalance({
      quotaPool: quotaPoolName,
    });
    if (res.ok) {
      message.success("重置配额池成功");
      // 重置成功后刷新配额池详情
      await refreshQuotaPoolDetail();
    } else {
      message.error("重置配额池失败");
    }
  };

  // 启用配额池
  const handleEnableQuotaPool = async () => {
    const res = await putQuotaPool({
      quotaPoolName: quotaPoolName,
      cronCycle: quotaPoolDetail?.cronCycle || "",
      regularQuota: quotaPoolDetail?.regularQuota || 0,
      personal: quotaPoolDetail?.personal || false,
      disabled: false,
    });
    if (res.ok) {
      message.success("启用配额池成功");
      // 启用成功后刷新配额池详情
      await refreshQuotaPoolDetail();
    } else {
      message.error("启用配额池失败");
    }
  };

  // 禁用配额池
  const handleDisableQuotaPool = async () => {
    const res = await putQuotaPool({
      quotaPoolName: quotaPoolName,
      cronCycle: quotaPoolDetail?.cronCycle || "",
      regularQuota: quotaPoolDetail?.regularQuota || 0,
      personal: quotaPoolDetail?.personal || false,
      disabled: true,
    });
    if (res.ok) {
      message.success("禁用配额池成功");
      // 禁用成功后刷新配额池详情
      await refreshQuotaPoolDetail();
    } else {
      message.error("禁用配额池失败");
    }
  };

  const action = (
    <RouteContext.Consumer>
      {() => {
        return (
          <Space>
            <Button type="primary" onClick={handleResetQuotaPool}>
              重置配额池
            </Button>
            {quotaPoolDetail?.disabled ? (
              <Button
                color="cyan"
                variant="solid"
                onClick={handleEnableQuotaPool}
              >
                启用配额池
              </Button>
            ) : (
              <Button
                color="danger"
                variant="solid"
                onClick={handleDisableQuotaPool}
              >
                禁用配额池
              </Button>
            )}
          </Space>
        );
      }}
    </RouteContext.Consumer>
  );

  const extra = (
    <div className={styles.moreInfo}>
      {quotaPoolDetail?.disabled ? (
        <Statistic title="状态" value="已禁用" valueStyle={{ color: "red" }} />
      ) : (
        <Statistic
          title="状态"
          value="使用中"
          valueStyle={{ color: "green" }}
        />
      )}
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
            onRefresh={refreshQuotaPoolDetail}
          />
        );
      case "bill_detail":
        return <BillingDetailTab quotaPoolName={quotaPoolName} />;
      default:
        return (
          <ConfigDetailTab
            quotaPoolName={quotaPoolName}
            quotaPoolDetail={quotaPoolDetail}
            onRefresh={refreshQuotaPoolDetail}
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
