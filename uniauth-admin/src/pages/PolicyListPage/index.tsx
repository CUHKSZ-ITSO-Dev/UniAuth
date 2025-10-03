import { PageContainer } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import { useState } from "react";
import GPolicyTab from "./GPolicyTab";
import PPolicyTab from "./PPolicyTab";

const PolicyListPage: React.FC = () => {
  const intl = useIntl();
  const [activeTabKey, setActiveTabKey] = useState("policy_tab1");

  // Tab 切换处理
  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  // 根据当前激活的 tab 渲染对应内容
  const renderTabContent = () => {
    switch (activeTabKey) {
      case "policy_tab1":
        return <PPolicyTab />;
      case "policy_tab2":
        return <GPolicyTab />;
      default:
        return <PPolicyTab />;
    }
  };

  return (
    <PageContainer
      title={intl.formatMessage({
        id: "pages.policyList.title",
        defaultMessage: "规则列表",
      })}
      tabList={[
        {
          key: "policy_tab1",
          tab: intl.formatMessage({
            id: "pages.policyList.tab_p",
            defaultMessage: "P规则列表",
          }),
        },
        {
          key: "policy_tab2",
          tab: intl.formatMessage({
            id: "pages.policyList.tab_g",
            defaultMessage: "G规则列表",
          }),
        },
      ]}
      tabActiveKey={activeTabKey}
      onTabChange={handleTabChange}
    >
      {renderTabContent()}
    </PageContainer>
  );
};

export default PolicyListPage;
