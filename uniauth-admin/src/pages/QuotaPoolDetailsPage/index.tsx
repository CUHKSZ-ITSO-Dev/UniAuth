import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormText,
  ProFormDigit,
  ProFormSwitch,
  ProFormDateTimePicker,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Typography } from "antd";

const { Title, Text } = Typography;

// 示例数据，实际应由接口获取
const quotaPoolDetail = {
  id: 1,
  quota_pool_name: "研发配额池",
  cron_cycle: "0 0 * * *",
  regular_quota: 1000.0,
  remaining_quota: 800.0,
  last_reset_at: "2024-09-01 00:00:00",
  extra_quota: 200.0,
  personal: false,
  disabled: false,
  userinfos_rules: '{"group": "研发"}',
  created_at: "2024-08-01 10:00:00",
};

const QuotaPoolDetailsPage: React.FC = () => {
  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>配额池详情</Title>
        <Text type="secondary">查看配额池的详细信息</Text>
        <ProForm
          layout="horizontal"
          submitter={false}
          initialValues={quotaPoolDetail}
        >
          <ProFormText name="id" label="ID" disabled tooltip="自增主键" />
          <ProFormText
            name="quota_pool_name"
            label="配额池名称"
            disabled
            tooltip="配额池名称"
          />
          <ProFormText
            name="cron_cycle"
            label="刷新周期"
            disabled
            tooltip="cron表达式"
          />
          <ProFormDigit
            name="regular_quota"
            label="定期配额"
            disabled
            tooltip="定期分配的配额"
          />
          <ProFormDigit
            name="remaining_quota"
            label="剩余配额"
            disabled
            tooltip="当前剩余可用配额"
          />
          <ProFormDateTimePicker
            name="last_reset_at"
            label="上次刷新时间"
            disabled
            tooltip="上次配额重置时间"
          />
          <ProFormDigit
            name="extra_quota"
            label="加油包"
            disabled
            tooltip="额外分配的配额"
          />
          <ProFormSwitch
            name="personal"
            label="是否个人配额池"
            disabled
            tooltip="是否为个人专属配额池"
          />
          <ProFormSwitch
            name="disabled"
            label="是否禁用"
            disabled
            tooltip="配额池是否禁用"
          />
          <ProFormTextArea
            name="userinfos_rules"
            label="ITTools规则"
            disabled
            tooltip="配额池的用户规则(JSON)"
          />
          <ProFormDateTimePicker
            name="created_at"
            label="创建时间"
            disabled
            tooltip="配额池创建时间"
          />
        </ProForm>
      </ProCard>
    </PageContainer>
  );
};

export default QuotaPoolDetailsPage;
