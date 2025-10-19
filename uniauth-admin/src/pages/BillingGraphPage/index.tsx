import { Line } from "@ant-design/charts";
import {
  CalendarOutlined,
  RiseOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import {
  Alert,
  Card,
  Col,
  Row,
  Select,
  Spin,
  Statistic,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import {
  getBillingStatsActiveUsersSummary,
  getBillingStatsTodayTotal,
} from "@/services/uniauthService/billing";

const { Title, Text } = Typography;
const { Option } = Select;

const BillingGraphPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeUsersLoading, setActiveUsersLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [statsData, setStatsData] =
    useState<API.GetTodayTotalConsumptionRes | null>(null);
  const [activeUsersData, setActiveUsersData] =
    useState<API.GetActiveUsersNumRes | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number>(30);

  // 服务选项
  const serviceOptions = [
    { value: "", label: "全部服务" },
    { value: "chat", label: "聊天服务" },
    { value: "image", label: "图像服务" },
  ];

  // 获取统计数据
  const fetchStatsData = async (service?: string) => {
    setLoading(true);
    setError("");

    try {
      // 正确处理可选参数，避免传递 undefined
      const params: API.GetTodayTotalConsumptionReq = service
        ? { service }
        : {};
      const response = await getBillingStatsTodayTotal(params);
      if (response) {
        setStatsData(response);
      }
    } catch (err) {
      setError("获取统计数据失败，请稍后重试");
      console.error("获取今日总消费数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 获取活跃用户统计数据
  const fetchActiveUsersData = async (days?: number) => {
    setActiveUsersLoading(true);
    setError("");

    try {
      const params: API.GetActiveUsersNumReq = days ? { days } : {};
      const response = await getBillingStatsActiveUsersSummary(params);
      if (response) {
        setActiveUsersData(response);
      }
    } catch (err) {
      setError("获取活跃用户数据失败，请稍后重试");
      console.error("获取活跃用户数据失败:", err);
    } finally {
      setActiveUsersLoading(false);
    }
  };

  // 服务选择变化处理
  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    fetchStatsData(value);
  };

  // 天数选择变化处理
  const handleDaysChange = (value: number) => {
    setSelectedDays(value);
    fetchActiveUsersData(value);
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchStatsData();
    fetchActiveUsersData();
  }, []);

  // 准备折线图数据（已废弃，现在直接在组件中使用）

  return (
    <PageContainer>
      <ProCard>
        {/* 今日消费统计 */}
        <Card style={{ marginBottom: "24px" }}>
          <Title level={4}>今日消费统计</Title>
          <Text type="secondary">查看今日各项服务的消费统计数据和增长率</Text>

          {/* 筛选器区域 */}
          <Card style={{ marginBottom: "24px", marginTop: "16px" }}>
            <Row gutter={16} align="middle">
              <Col>
                <span style={{ marginRight: "8px" }}>服务类型:</span>
              </Col>
              <Col>
                <Select
                  value={selectedService}
                  onChange={handleServiceChange}
                  style={{ width: 200 }}
                  placeholder="选择服务类型"
                >
                  {serviceOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>

          {error && (
            <Alert
              message="错误"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: "24px" }}
            />
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : statsData ? (
            <Row gutter={16}>
              {/* 总消费金额 */}
              <Col xs={24} sm={12} md={8}>
                <Card>
                  <Statistic
                    title="今日总消费"
                    value={statsData.totalCostCNY}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: "#cf1322" }}
                    suffix="CNY"
                  />
                </Card>
              </Col>

              {/* 增长率 */}
              <Col xs={24} sm={12} md={8}>
                <Card>
                  <Statistic
                    title="消费增长率"
                    value={statsData.increaseRate}
                    precision={1}
                    valueStyle={{
                      color: statsData.increaseRate > 0 ? "#cf1322" : "#3f8600",
                    }}
                    prefix={
                      statsData.increaseRate > 0 ? <RiseOutlined /> : undefined
                    }
                    suffix="%"
                  />
                </Card>
              </Col>

              {/* 统计日期 */}
              <Col xs={24} sm={12} md={8}>
                <Card>
                  <Statistic
                    title="统计日期"
                    value={statsData.date}
                    valueStyle={{ color: "#1890ff" }}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          ) : (
            <Card>
              <div
                style={{ textAlign: "center", padding: "50px", color: "#999" }}
              >
                暂无数据
              </div>
            </Card>
          )}
        </Card>

        {/* 活跃用户统计 */}
        <Card>
          <Title level={4}>活跃用户统计</Title>
          <Text type="secondary">查看最近{selectedDays}天的活跃用户数据</Text>

          {/* 活跃用户统计筛选器 */}
          <Card style={{ marginBottom: "24px", marginTop: "16px" }}>
            <Row gutter={16} align="middle">
              <Col>
                <span style={{ marginRight: "8px" }}>统计天数:</span>
              </Col>
              <Col>
                <Select
                  value={selectedDays}
                  onChange={handleDaysChange}
                  style={{ width: 120 }}
                  placeholder="选择天数"
                >
                  <Option value={7}>7天</Option>
                  <Option value={30}>30天</Option>
                  <Option value={90}>90天</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          {activeUsersLoading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : activeUsersData ? (
            <>
              <Row gutter={16} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={12} md={12}>
                  <Card>
                    <Statistic
                      title="总用户数"
                      value={activeUsersData.totalUsers || 0}
                      valueStyle={{ color: "#52c41a" }}
                      prefix={<TeamOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={12}>
                  <Card>
                    <Statistic
                      title="活跃用户数"
                      value={activeUsersData.totalActiveUsers || 0}
                      valueStyle={{ color: "#1890ff" }}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 活跃用户趋势折线图 */}
              <Card title="活跃用户趋势" style={{ marginTop: "16px" }}>
                <Line
                  data={
                    activeUsersData.activeUsers
                      ?.map((item) => ({
                        date: item.date || "",
                        activeUsersNum: item.activeUsersNum || 0,
                        activeRateInc: item.activeRateInc || 0,
                      }))
                      ?.sort((a, b) => {
                        // 按日期从旧到新排序
                        return (
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                        );
                      }) || []
                  }
                  xField="date"
                  yField="activeUsersNum"
                  height={300}
                  point={{
                    size: 5,
                    shape: "diamond",
                  }}
                  label={{
                    style: {
                      fill: "#aaa",
                    },
                  }}
                  meta={{
                    date: {
                      alias: "日期",
                      type: "cat",
                      range: [0, 1],
                    },
                    activeUsersNum: {
                      alias: "活跃用户数",
                    },
                    activeRateInc: {
                      alias: "活跃率增长",
                      formatter: (v: number) => `${v}%`,
                    },
                  }}
                  xAxis={{
                    label: {
                      autoRotate: false,
                    },
                  }}
                  tooltip={{
                    showMarkers: true,
                    formatter: (datum: any) => {
                      return {
                        name: "活跃用户数",
                        value: `${datum.activeUsersNum} 人`,
                      };
                    },
                    customContent: (_title: any, items: any[]) => {
                      if (!items || items.length === 0) return null;
                      const data = items[0].data;
                      return `<div style="padding: 8px;">
                        <div style="font-weight: bold; margin-bottom: 8px;">${data.date}</div>
                        <div style="color: #1890ff;">活跃用户数: ${data.activeUsersNum} 人</div>
                        <div style="color: #52c41a;">活跃率增长: ${data.activeRateInc}%</div>
                      </div>`;
                    },
                  }}
                  state={{
                    active: {
                      style: {
                        shadowBlur: 4,
                        stroke: "#000",
                        fill: "red",
                      },
                    },
                  }}
                  interactions={[
                    {
                      type: "marker-active",
                    },
                  ]}
                />
              </Card>
            </>
          ) : (
            <Card>
              <div
                style={{ textAlign: "center", padding: "50px", color: "#999" }}
              >
                暂无活跃用户数据
              </div>
            </Card>
          )}
        </Card>
      </ProCard>
    </PageContainer>
  );
};

export default BillingGraphPage;
