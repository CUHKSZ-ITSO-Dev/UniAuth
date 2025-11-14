import { Line } from "@ant-design/charts";
import {
  FallOutlined,
  MinusOutlined,
  RiseOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import {
  Card,
  Col,
  InputNumber,
  Row,
  Select,
  Spin,
  Statistic,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import {
  getBillingStatsActiveUsersSummary,
  getBillingStatsAllName,
  getBillingStatsModelConsumption,
  getBillingStatsModelUsage,
  getBillingStatsTodayTotal,
} from "@/services/uniauthService/billing";

const getAllName = async (name: string): Promise<string[]> => {
  try {
    const response = await getBillingStatsAllName({ name });
    return response?.allName || [];
  } catch (err) {
    return [];
  }
};

const { Title, Text } = Typography;
const { Option } = Select;

const BillingGraphPage: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState<boolean>(true);
  const [activeUsersLoading, setActiveUsersLoading] = useState<boolean>(false);
  const [modelConsumptionLoading, setModelConsumptionLoading] =
    useState<boolean>(false);

  const [statsData, setStatsData] =
    useState<API.GetTodayTotalConsumptionRes | null>(null);
  const [activeUsersData, setActiveUsersData] =
    useState<API.GetActiveUsersNumRes | null>(null);

  const [modelConsumptionData, setModelConsumptionData] =
    useState<API.GetProductConsumptionRes | null>(null);
  const [modelUsageData, setModelUsageData] =
    useState<API.GetProductUsageChartRes | null>(null);

  const [selectedService, setSelectedService] = useState<string[]>(["all"]);
  const [globalDays, setGlobalDays] = useState<number>(7);
  const [customDays, setCustomDays] = useState<number>(7);
  const [useCustomDays, setUseCustomDays] = useState<boolean>(false);
  const [activeUsersSelectedDays, setActiveUsersSelectedDays] =
    useState<number>(7);
  const [selectedModelService, setSelectedModelService] = useState<string[]>([
    "all",
  ]);
  const [selectedModelProduct, setSelectedModelProduct] = useState<string[]>([
    "all",
  ]);

  const [serviceOptions, setServiceOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "all" }]);

  const [productOptions, setProductOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "all" }]);

  const daysOptions = [
    { value: 7, label: "7" },
    { value: 30, label: "30" },
    { value: 90, label: "90" },
    { value: -1, label: "自定义" },
  ];

  const getActualDays = (days: number, customDays: number) => {
    return days === -1 ? customDays : days;
  };

  const fetchStatsData = async (services?: string[]) => {
    setLoading(true);

    try {
      const params: API.GetTodayTotalConsumptionReq = {};
      if (services && !services.includes("all")) {
        params.service = services.join(",");
      }
      const response = await getBillingStatsTodayTotal(params);
      if (response) {
        setStatsData(response);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveUsersData = async (days?: number) => {
    setActiveUsersLoading(true);

    try {
      const actualDays = getActualDays(
        days || activeUsersSelectedDays,
        customDays,
      );
      const params: API.GetActiveUsersNumReq = {
        days: actualDays,
      };
      const response = await getBillingStatsActiveUsersSummary(params);
      if (response) {
        setActiveUsersData(response);
      }
    } catch (err) {
    } finally {
      setActiveUsersLoading(false);
    }
  };

  const handleServiceChange = (value: string[]) => {
    setSelectedService(value);
    fetchStatsData(value);
  };

  const handleGlobalDaysChange = (value: number) => {
    if (value === -1) {
      setUseCustomDays(true);
    } else {
      setUseCustomDays(false);
      setGlobalDays(value);
      setActiveUsersSelectedDays(value);
      fetchActiveUsersData(value);
      fetchModelConsumptionData(
        selectedModelService,
        selectedModelProduct,
        value,
      );
      fetchModelUsageData(selectedModelService, selectedModelProduct, value);
    }
  };

  const handleCustomDaysChange = (value: number | null) => {
    if (value !== null) {
      setCustomDays(value);
      setActiveUsersSelectedDays(value);
      fetchActiveUsersData(value);
      fetchModelConsumptionData(
        selectedModelService,
        selectedModelProduct,
        value,
      );
      fetchModelUsageData(selectedModelService, selectedModelProduct, value);
    }
  };

  const fetchDynamicOptions = async () => {
    try {
      const services = await getAllName("service");
      const serviceOptions = services.map((service) => ({
        value: service,
        label: service,
      }));
      setServiceOptions(serviceOptions);

      const products = await getAllName("product");
      const productOptions = products.map((product) => ({
        value: product,
        label: product,
      }));
      setProductOptions(productOptions);
    } catch (err) {}
  };

  const fetchModelConsumptionData = async (
    services?: string[],
    products?: string[],
    days?: number,
  ) => {
    setModelConsumptionLoading(true);

    try {
      const params: API.GetProductConsumptionReq = {};
      if (services && !services.includes("all")) {
        params.service = services.join(",");
      }
      if (products && !products.includes("all")) {
        params.product = products.join(",");
      }
      const actualDays = getActualDays(days || globalDays, customDays);
      params.nDays = actualDays;
      const response = await getBillingStatsModelConsumption(params);
      if (response) {
        setModelConsumptionData(response);
      }
    } catch (err) {
    } finally {
      setModelConsumptionLoading(false);
    }
  };

  const fetchModelUsageData = async (
    services?: string[],
    products?: string[],
    days?: number,
  ) => {
    try {
      const params: API.GetProductUsageChartReq = {};
      if (services && !services.includes("all")) {
        params.service = services.join(",");
      }
      if (products && !products.includes("all")) {
        params.product = products.join(",");
      }
      const actualDays = getActualDays(days || globalDays, customDays);
      params.nDays = actualDays;
      const response = await getBillingStatsModelUsage(params);
      if (response) {
        setModelUsageData(response);
      }
    } catch (err) {
    } finally {
    }
  };

  const handleModelFilterChange = (
    services?: string[],
    products?: string[],
    days?: number,
  ) => {
    setSelectedModelService(services || ["all"]);
    setSelectedModelProduct(products || ["all"]);
    const actualDays = getActualDays(days || globalDays, customDays);
    fetchModelConsumptionData(services, products, actualDays);
    fetchModelUsageData(services, products, actualDays);
  };

  useEffect(() => {
    fetchDynamicOptions();
    fetchStatsData();
    fetchActiveUsersData();
    fetchModelConsumptionData();
    fetchModelUsageData();
  }, []);

  return (
    <PageContainer>
      <div>
        {/* 全局天数选择器 */}
        <Card style={{ marginBottom: 12 }}>
          <Row align="middle" gutter={12}>
            <Col>
              <Text strong>时间范围：</Text>
            </Col>
            <Col>
              <Select
                value={useCustomDays ? -1 : globalDays}
                onChange={handleGlobalDaysChange}
                style={{ width: 120 }}
              >
                {daysOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            {useCustomDays && (
              <Col>
                <InputNumber
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={handleCustomDaysChange}
                  placeholder="输入天数"
                  style={{ width: 100 }}
                />
                <Text style={{ marginLeft: 8 }}>天</Text>
              </Col>
            )}
          </Row>
        </Card>

        {/* 今日消费统计 */}
        <Card style={{ marginBottom: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4}>
                {intl.formatMessage({ id: "pages.dashboard.todayTitle" })}
              </Title>
              <Text type="secondary">
                {intl.formatMessage({ id: "pages.dashboard.todaySub" })}
              </Text>
            </Col>
            <Col>
              <div>
                <span>
                  {intl.formatMessage({
                    id: "pages.dashboard.serviceOption",
                  })}
                </span>
                <Select
                  mode="multiple"
                  value={selectedService}
                  onChange={handleServiceChange}
                  style={{ width: 200 }}
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children;
                    const text = Array.isArray(children)
                      ? children.join("")
                      : String(children || "");
                    return text.toLowerCase().includes(input.toLowerCase());
                  }}
                  maxTagCount="responsive"
                >
                  {serviceOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : statsData ? (
            <Row gutter={12} style={{ marginTop: "12px" }}>
              <Col md={24}>
                <Card>
                  <Row align="middle" gutter={12}>
                    <Col>
                      <Statistic
                        title={intl.formatMessage({
                          id: "pages.dashboard.todayCost",
                        })}
                        value={statsData.totalCostCNY}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: "red", fontSize: "24px" }}
                      />
                    </Col>
                    <Col>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Text type="secondary" style={{ marginRight: 8 }}>
                          变化率：
                        </Text>
                        <Statistic
                          value={statsData.increaseRate}
                          precision={2}
                          valueStyle={{
                            color:
                              statsData.increaseRate > 0
                                ? "red"
                                : statsData.increaseRate === 0
                                  ? "black"
                                  : "green",
                            fontSize: "16px",
                          }}
                          prefix={
                            statsData.increaseRate > 0 ? (
                              <RiseOutlined />
                            ) : statsData.increaseRate === 0 ? (
                              <MinusOutlined />
                            ) : (
                              <FallOutlined />
                            )
                          }
                          suffix="%"
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          ) : (
            <Card>
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "grey",
                }}
              >
                {intl.formatMessage({ id: "pages.dashboard.noData" })}
              </div>
            </Card>
          )}
        </Card>

        {/* 模型消费统计 */}
        <Card style={{ marginBottom: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4}>
                {intl.formatMessage({ id: "pages.dashboard.modelTitle" })}
              </Title>
              <Text type="secondary">
                {intl.formatMessage({ id: "pages.dashboard.modelSub" })}
              </Text>
            </Col>
          </Row>

          <Card style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div>
                <span>
                  {intl.formatMessage({
                    id: "pages.dashboard.serviceOption",
                  })}
                </span>
                <Select
                  mode="multiple"
                  value={selectedModelService}
                  onChange={(value) =>
                    handleModelFilterChange(
                      value,
                      selectedModelProduct,
                      globalDays,
                    )
                  }
                  style={{ width: 200 }}
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children;
                    const text = Array.isArray(children)
                      ? children.join("")
                      : String(children || "");
                    return text.toLowerCase().includes(input.toLowerCase());
                  }}
                >
                  {serviceOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <span>
                  {intl.formatMessage({
                    id: "pages.dashboard.productOption",
                  })}
                </span>
                <Select
                  mode="multiple"
                  value={selectedModelProduct}
                  onChange={(value) =>
                    handleModelFilterChange(
                      selectedModelService,
                      value,
                      globalDays,
                    )
                  }
                  style={{ width: 200 }}
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children;
                    const text = Array.isArray(children)
                      ? children.join("")
                      : String(children || "");
                    return text.toLowerCase().includes(input.toLowerCase());
                  }}
                >
                  {productOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {modelConsumptionLoading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : modelConsumptionData ? (
            <>
              <Row gutter={16}>
                <Col md={12}>
                  {/* 次数趋势图 */}
                  <Card
                    title={intl.formatMessage({
                      id: "pages.dashboard.modelTrend",
                    })}
                  >
                    <div>
                      {modelUsageData?.lineChartData ? (
                        <Line
                          data={(
                            modelUsageData.lineChartData as any
                          ).series.flatMap((seriesItem: any) =>
                            (seriesItem.data as any[]).map(
                              (value: number, index: number) => ({
                                date: (modelUsageData.lineChartData as any)
                                  .dates[index],
                                calls: value,
                                model: seriesItem.name,
                              }),
                            ),
                          )}
                          height={300}
                          xField="date"
                          yField="calls"
                          seriesField="model"
                          point={{
                            size: 5,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "50px",
                            color: "grey",
                          }}
                        >
                          {intl.formatMessage({ id: "pages.dashboard.noData" })}
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
                <Col md={12}>
                  {/* 调用分布排行榜 */}
                  <Card
                    title={intl.formatMessage({
                      id: "pages.dashboard.modelDistribution",
                    })}
                  >
                    <div>
                      {modelUsageData?.barChartData ? (
                        <div style={{ maxHeight: 400, overflowY: "auto" }}>
                          {/* 对数据进行排序，调用次数大的排在前面 */}
                          {(modelUsageData.barChartData as any).labels
                            .map((label: string, index: number) => ({
                              label,
                              calls:
                                (modelUsageData.barChartData as any).data[
                                  index
                                ] || 0,
                              index,
                            }))
                            .sort((a: any, b: any) => b.calls - a.calls) // 按调用次数降序排序
                            .map((item: any, sortedIndex: number) => {
                              const maxCalls = Math.max(
                                ...(modelUsageData.barChartData as any).data,
                              );
                              const percentage =
                                maxCalls > 0
                                  ? (item.calls / maxCalls) * 100
                                  : 0;

                              return (
                                <div
                                  key={item.index}
                                  style={{
                                    marginBottom: 8,
                                    padding: "12px 16px",
                                    borderRadius: 8,
                                    background: "rgba(24, 144, 255, 0.05)",
                                    border: "1px solid rgba(24, 144, 255, 0.1)",
                                    backdropFilter: "blur(4px)",
                                    position: "relative",
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* 背景渐变效果作为进度条 */}
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      background: `linear-gradient(90deg, rgba(24, 144, 255, 0.2) ${percentage}%, transparent ${percentage}%)`,
                                      zIndex: 0,
                                    }}
                                  />

                                  <Row
                                    justify="space-between"
                                    align="middle"
                                    style={{ position: "relative", zIndex: 1 }}
                                  >
                                    <Col span={16}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          marginBottom: 4,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            background: "#1890ff",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            marginRight: 12,
                                          }}
                                        >
                                          {sortedIndex + 1}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: "#1890ff",
                                          }}
                                        >
                                          {item.label}
                                        </div>
                                      </div>
                                    </Col>
                                    <Col
                                      span={8}
                                      style={{ textAlign: "right" }}
                                    >
                                      <div
                                        style={{
                                          fontSize: 18,
                                          fontWeight: 700,
                                          color: "#1890ff",
                                        }}
                                      >
                                        {item.calls.toLocaleString()}
                                      </div>
                                    </Col>
                                  </Row>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "50px",
                            color: "grey",
                          }}
                        >
                          {intl.formatMessage({ id: "pages.dashboard.noData" })}
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <Card>
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "grey",
                }}
              >
                {intl.formatMessage({ id: "pages.dashboard.noData" })}
              </div>
            </Card>
          )}
        </Card>

        {/* 活跃用户统计 */}
        <Card style={{ marginBottom: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4}>
                {intl.formatMessage({ id: "pages.dashboard.activeTitle" })}
              </Title>
              <Text type="secondary">
                {intl.formatMessage({ id: "pages.dashboard.activeSub" })}
              </Text>
            </Col>
          </Row>

          {activeUsersLoading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : activeUsersData ? (
            <>
              <Row gutter={12} style={{ marginTop: "12px" }}>
                <Col md={12}>
                  <Card>
                    <Statistic
                      title={intl.formatMessage({
                        id: "pages.dashboard.activeUser",
                      })}
                      value={activeUsersData.activeUsers?.length || 0}
                      valueStyle={{ color: "blue" }}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Card
                title={intl.formatMessage({
                  id: "pages.dashboard.activeTrend",
                })}
                style={{ marginTop: "12px" }}
              >
                <Line
                  data={
                    activeUsersData.activeUsers
                      ?.map((item) => ({
                        date: item.date || "",
                        activeUsersNum: item.activeUsersNum || 0,
                        activeRateInc: item.activeRateInc || 0,
                      }))
                      ?.sort((a, b) => {
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
                  }}
                  tooltip={{
                    title: false,
                    items: [
                      {
                        channel: "x",
                        name: intl.formatMessage({
                          id: "pages.dashboard.date",
                        }),
                        valueFormatter: (v: any) => v,
                      },
                      {
                        channel: "y",
                        name: intl.formatMessage({
                          id: "pages.dashboard.activeUser",
                        }),
                        valueFormatter: (v: any) => `${v} 人`,
                      },
                    ],
                  }}
                />
              </Card>
            </>
          ) : (
            <Card>
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "grey",
                }}
              >
                {intl.formatMessage({ id: "pages.dashboard.noData" })}
              </div>
            </Card>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

export default BillingGraphPage;
