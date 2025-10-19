import { CalendarOutlined, RiseOutlined } from "@ant-design/icons";
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
import { getBillingStatsTodayTotal } from "@/services/uniauthService/billing";

const { Title, Text } = Typography;
const { Option } = Select;

const BillingGraphPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statsData, setStatsData] =
    useState<API.GetTodayTotalConsumptionRes | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");

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

  // 服务选择变化处理
  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    fetchStatsData(value);
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchStatsData();
  }, []);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>今日消费统计</Title>
        <Text type="secondary">查看今日各项服务的消费统计数据和增长率</Text>

        {/* 服务筛选器 */}
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
      </ProCard>
    </PageContainer>
  );
};

export default BillingGraphPage;
