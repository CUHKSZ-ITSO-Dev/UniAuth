import { Bar, Line } from "@ant-design/charts";
import {
  BarChartOutlined,
  FallOutlined,
  MinusOutlined,
  RiseOutlined,
  TableOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Statistic,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import {
  getBillingStatsActiveUserDetail,
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

  const [selectedService, setSelectedService] = useState<string>("all");
  const [modelSelectedDays, setModelSelectedDays] = useState<number>(7);
  const [activeUsersSelectedDays, setActiveUsersSelectedDays] =
    useState<number>(7);
  const [selectedModelService, setSelectedModelService] =
    useState<string>("all");
  const [selectedModelProduct, setSelectedModelProduct] =
    useState<string>("all");
  const [selectedModelQuotaPool, setSelectedModelQuotaPool] =
    useState<string>("all");

  const [isConsumptionModalVisible, setIsConsumptionModalVisible] =
    useState<boolean>(false);

  const [isActiveUserDetailModalVisible, setIsActiveUserDetailModalVisible] =
    useState<boolean>(false);
  const [activeUserDetailLoading, setActiveUserDetailLoading] =
    useState<boolean>(false);
  const [activeUserDetailData, setActiveUserDetailData] =
    useState<API.GetActiveUserDetailRes | null>(null);
  const [searchUpn, setSearchUpn] = useState<string>("");

  const [activeChartType, setActiveChartType] = useState<
    "usage" | "distribution"
  >("usage");

  const [serviceOptions, setServiceOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "all" }]);

  const [productOptions, setProductOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "all" }]);

  const [quotaPoolOptions, setQuotaPoolOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "all" }]);

  const daysOptions = [
    { value: 7, label: "7" },
    { value: 30, label: "30" },
    { value: 90, label: "90" },
  ];

  const fetchStatsData = async (service?: string) => {
    setLoading(true);

    try {
      const params: API.GetTodayTotalConsumptionReq = service
        ? { service }
        : {};
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
      const params: API.GetActiveUsersNumReq = {
        days: days || activeUsersSelectedDays,
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

  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    fetchStatsData(value);
  };

  const handleActiveUsersDaysChange = (value: number) => {
    setActiveUsersSelectedDays(value);
    fetchActiveUsersData(value);
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

      const quotaPools = await getAllName("quotaPool");
      const quotaPoolOptions = quotaPools.map((quotaPool) => ({
        value: quotaPool,
        label: quotaPool,
      }));
      setQuotaPoolOptions(quotaPoolOptions);
    } catch (err) {}
  };

  const fetchModelConsumptionData = async (
    service?: string,
    product?: string,
    quotaPool?: string,
    days?: number,
  ) => {
    setModelConsumptionLoading(true);

    try {
      const params: API.GetProductConsumptionReq = {};
      if (service) params.service = service;
      if (product) params.product = product;
      if (quotaPool) params.quotaPool = quotaPool;
      if (days) params.nDays = days;
      const response = await getBillingStatsModelConsumption(params);
      if (response) {
        setModelConsumptionData(response);
      }
    } catch (err) {
    } finally {
      setModelConsumptionLoading(false);
    }
  };

  const fetchActiveUserDetail = async (upn: string, nDays?: number) => {
    setActiveUserDetailLoading(true);
    setActiveUserDetailData(null);

    try {
      const params: API.GetActiveUserDetailReq = {
        upn,
        nDays: nDays || activeUsersSelectedDays,
      };
      const response = await getBillingStatsActiveUserDetail(params);
      if (response) {
        setActiveUserDetailData(response);
      }
    } catch (err) {
    } finally {
      setActiveUserDetailLoading(false);
    }
  };

  const handleSearchActiveUser = () => {
    if (!searchUpn.trim()) {
      return;
    }
    setIsActiveUserDetailModalVisible(true);
    fetchActiveUserDetail(searchUpn.trim());
  };

  const fetchModelUsageData = async (
    service?: string,
    product?: string,
    quotaPool?: string,
    days?: number,
  ) => {
    try {
      const params: API.GetProductUsageChartReq = {};
      if (service) params.service = service;
      if (product) params.product = product;
      if (quotaPool) params.quotaPool = quotaPool;
      if (days) params.nDays = days;
      const response = await getBillingStatsModelUsage(params);
      if (response) {
        setModelUsageData(response);
      }
    } catch (err) {
    } finally {
    }
  };

  const handleModelFilterChange = (
    service?: string,
    product?: string,
    quotaPool?: string,
    days?: number,
  ) => {
    setSelectedModelService(service || "");
    setSelectedModelProduct(product || "");
    setSelectedModelQuotaPool(quotaPool || "");
    setModelSelectedDays(days || 7);
    fetchModelConsumptionData(service, product, quotaPool, days);
    fetchModelUsageData(service, product, quotaPool, days);
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
      <Row gutter={12}>
        <Col md={12}>
          <Card>
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
                    value={selectedService}
                    onChange={handleServiceChange}
                    style={{ width: 100 }}
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
              </Col>
            </Row>

            {loading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
              </div>
            ) : statsData ? (
              <Row gutter={12} style={{ marginTop: "12px" }}>
                <Col md={12}>
                  <Card>
                    <Statistic
                      title={intl.formatMessage({
                        id: "pages.dashboard.todayCost",
                      })}
                      value={statsData.totalCostCNY}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: "red" }}
                    />
                  </Card>
                </Col>

                <Col md={12}>
                  <Card>
                    <Statistic
                      title={intl.formatMessage({
                        id: "pages.dashboard.todayRate",
                      })}
                      value={statsData.increaseRate}
                      precision={2}
                      valueStyle={{
                        color:
                          statsData.increaseRate > 0
                            ? "red"
                            : statsData.increaseRate === 0
                              ? "black"
                              : "green",
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

          <Card style={{ marginTop: "12px" }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>
                  {intl.formatMessage({ id: "pages.dashboard.modelTitle" })}
                </Title>
                <Text type="secondary">
                  {intl.formatMessage({ id: "pages.dashboard.modelSub" })}
                </Text>
              </Col>
              <Col>
                <Button
                  icon={<TableOutlined />}
                  onClick={() => setIsConsumptionModalVisible(true)}
                >
                  {intl.formatMessage({ id: "pages.dashboard.modelDetail" })}
                </Button>
              </Col>
            </Row>

            <Card style={{ marginTop: "12px" }}>
              <Row gutter={12}>
                <Col md={12}>
                  <div>
                    <span>
                      {intl.formatMessage({
                        id: "pages.dashboard.serviceOption",
                      })}
                    </span>
                    <Select
                      value={selectedModelService}
                      onChange={(value) =>
                        handleModelFilterChange(
                          value,
                          selectedModelProduct,
                          selectedModelQuotaPool,
                          modelSelectedDays,
                        )
                      }
                      style={{ width: 100 }}
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
                </Col>
                <Col span={12}>
                  <div>
                    <span>
                      {intl.formatMessage({
                        id: "pages.dashboard.productOption",
                      })}
                    </span>
                    <Select
                      value={selectedModelProduct}
                      onChange={(value) =>
                        handleModelFilterChange(
                          selectedModelService,
                          value,
                          selectedModelQuotaPool,
                          modelSelectedDays,
                        )
                      }
                      style={{ width: 100 }}
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
                </Col>
              </Row>
              <Row gutter={12} style={{ marginTop: "12px" }}>
                <Col span={12}>
                  <div>
                    <span>
                      {intl.formatMessage({
                        id: "pages.dashboard.quotaPoolOption",
                      })}
                    </span>
                    <Select
                      value={selectedModelQuotaPool}
                      onChange={(value) =>
                        handleModelFilterChange(
                          selectedModelService,
                          selectedModelProduct,
                          value,
                          modelSelectedDays,
                        )
                      }
                      style={{ width: 100 }}
                      showSearch
                      filterOption={(input, option) => {
                        const children = option?.children;
                        const text = Array.isArray(children)
                          ? children.join("")
                          : String(children || "");
                        return text.toLowerCase().includes(input.toLowerCase());
                      }}
                    >
                      {quotaPoolOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <span>
                      {intl.formatMessage({ id: "pages.dashboard.dayOption" })}
                    </span>
                    <Select
                      value={modelSelectedDays}
                      onChange={(value) =>
                        handleModelFilterChange(
                          selectedModelService,
                          selectedModelProduct,
                          selectedModelQuotaPool,
                          value,
                        )
                      }
                      style={{ width: 100 }}
                    >
                      {daysOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
              </Row>
            </Card>

            {modelConsumptionLoading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
              </div>
            ) : modelConsumptionData ? (
              <>
                <Row gutter={12}>
                  <Col md={12} style={{ marginTop: "12px" }}>
                    <Card>
                      <Statistic
                        title={intl.formatMessage({
                          id: "pages.dashboard.totalCost",
                        })}
                        value={modelConsumptionData.totalCost || 0}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: "red" }}
                      />
                    </Card>
                  </Col>
                  <Col md={12} style={{ marginTop: "12px" }}>
                    <Card>
                      <Statistic
                        title={intl.formatMessage({
                          id: "pages.dashboard.totalCall",
                        })}
                        value={modelConsumptionData.totalCalls || 0}
                        valueStyle={{ color: "blue" }}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
                <Row>
                  <Col style={{ marginTop: "12px" }}>
                    <Button
                      type={activeChartType === "usage" ? "primary" : "default"}
                      onClick={() => setActiveChartType("usage")}
                    >
                      {intl.formatMessage({
                        id: "pages.dashboard.modelTrend",
                      })}
                    </Button>
                    <Button
                      type={
                        activeChartType === "distribution"
                          ? "primary"
                          : "default"
                      }
                      onClick={() => setActiveChartType("distribution")}
                    >
                      {intl.formatMessage({
                        id: "pages.dashboard.modelDistribution",
                      })}
                    </Button>
                  </Col>
                </Row>
                {activeChartType === "usage" ? (
                  <Card>
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
                          label={{
                            style: {
                              textAlign: "center",
                              textBaseline: "alphabetic",
                            },
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
                ) : (
                  <Card>
                    <div>
                      {modelUsageData?.barChartData ? (
                        <Bar
                          data={(modelUsageData.barChartData as any).labels.map(
                            (label: string, index: number) => ({
                              product: label,
                              calls: (modelUsageData.barChartData as any).data[
                                index
                              ],
                            }),
                          )}
                          height={300}
                          xField="product"
                          yField="calls"
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
                )}

                <Modal
                  title={intl.formatMessage({
                    id: "pages.dashboard.modelDetail",
                  })}
                  open={isConsumptionModalVisible}
                  onCancel={() => setIsConsumptionModalVisible(false)}
                  footer={null}
                  width="90%"
                  style={{ top: 20 }}
                >
                  {modelConsumptionData.consumption &&
                  Array.isArray(modelConsumptionData.consumption) &&
                  modelConsumptionData.consumption.length > 0 ? (
                    <ProTable
                      dataSource={modelConsumptionData.consumption}
                      rowKey={(record: any, index) =>
                        `${record.date}-${record.product}-${record.service}-${index}`
                      }
                      search={false}
                      pagination={{
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "30"],
                        defaultPageSize: 10,
                        onChange: (_page: number, _pageSize: number) => {},
                        onShowSizeChange: (_: number, _size: number) => {},
                      }}
                      scroll={{ x: 800 }}
                      columns={[
                        {
                          title: intl.formatMessage({
                            id: "pages.dashboard.date",
                          }),
                          dataIndex: "date",
                          key: "date",
                          width: 120,
                          sorter: (a: any, b: any) =>
                            (a.date || "").localeCompare(b.date || ""),
                          filters: Array.from(
                            new Set(
                              modelConsumptionData.consumption
                                .map((item: any) => item.date)
                                .filter(Boolean),
                            ),
                          ).map((date) => ({
                            text: date as string,
                            value: date as string,
                          })),
                          onFilter: (value: any, record: any) =>
                            record.date === value,
                        },
                        {
                          title: intl.formatMessage({
                            id: "pages.dashboard.product",
                          }),
                          dataIndex: "product",
                          key: "product",
                          width: 150,
                          sorter: (a: any, b: any) =>
                            (a.product || "").localeCompare(b.product || ""),
                          filters: Array.from(
                            new Set(
                              modelConsumptionData.consumption
                                .map((item: any) => item.product)
                                .filter(Boolean),
                            ),
                          ).map((product) => ({
                            text: product as string,
                            value: product as string,
                          })),
                          onFilter: (value: any, record: any) =>
                            record.product === value,
                        },
                        {
                          title: intl.formatMessage({
                            id: "pages.dashboard.service",
                          }),
                          dataIndex: "service",
                          key: "service",
                          width: 120,
                          sorter: (a: any, b: any) =>
                            (a.service || "").localeCompare(b.service || ""),
                          filters: Array.from(
                            new Set(
                              modelConsumptionData.consumption
                                .map((item: any) => item.service)
                                .filter(Boolean),
                            ),
                          ).map((service) => ({
                            text: service as string,
                            value: service as string,
                          })),
                          onFilter: (value: any, record: any) =>
                            record.service === value,
                        },
                        {
                          title: intl.formatMessage({
                            id: "pages.dashboard.quotaPool",
                          }),
                          dataIndex: "quotaPool",
                          key: "quotaPool",
                          width: 150,
                          sorter: (a: any, b: any) =>
                            (a.quotaPool || "").localeCompare(
                              b.quotaPool || "",
                            ),
                          filters: Array.from(
                            new Set(
                              modelConsumptionData.consumption
                                .map((item: any) => item.quotaPool)
                                .filter(Boolean),
                            ),
                          ).map((quotaPool) => ({
                            text: quotaPool as string,
                            value: quotaPool as string,
                          })),
                          onFilter: (value: any, record: any) =>
                            record.quotaPool === value,
                        },
                        {
                          title: intl.formatMessage({
                            id: "pages.dashboard.cost",
                          }),
                          dataIndex: "cost",
                          key: "cost",
                          width: 120,
                          sorter: (a: any, b: any) => {
                            const aCost = a.cost
                              ? parseFloat(a.cost.toString())
                              : 0;
                            const bCost = b.cost
                              ? parseFloat(b.cost.toString())
                              : 0;
                            return aCost - bCost;
                          },
                          render: (_: React.ReactNode, record: any) => {
                            const costValue = record.cost
                              ? parseFloat(record.cost.toString())
                              : 0;
                            return `¥${costValue.toFixed(2)}`;
                          },
                        },
                        {
                          title: intl.formatMessage({
                            id: "pages.dashboard.call",
                          }),
                          dataIndex: "calls",
                          key: "calls",
                          width: 100,
                          sorter: (a: any, b: any) =>
                            (a.calls || 0) - (b.calls || 0),
                          render: (_: React.ReactNode, record: any) =>
                            (record.calls || 0).toLocaleString(),
                        },
                      ]}
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
                </Modal>
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
        </Col>
        <Col md={12}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>
                  {intl.formatMessage({ id: "pages.dashboard.activeTitle" })}
                </Title>
                <Text type="secondary">
                  {intl.formatMessage({ id: "pages.dashboard.activeSub" })}
                </Text>
              </Col>
              <Col>
                <Row gutter={8} align="middle">
                  <Col>
                    <div>
                      <span>
                        {intl.formatMessage({
                          id: "pages.dashboard.dayOption",
                        })}
                      </span>
                      <Select
                        value={activeUsersSelectedDays}
                        onChange={handleActiveUsersDaysChange}
                        style={{ width: 100 }}
                      >
                        {daysOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col>
                    <Button
                      icon={<TableOutlined />}
                      onClick={() => setIsActiveUserDetailModalVisible(true)}
                    >
                      {intl.formatMessage({
                        id: "pages.dashboard.activeQuery",
                      })}
                    </Button>
                  </Col>
                </Row>
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
                          id: "pages.dashboard.activeTotal",
                        })}
                        value={activeUsersData.totalUsers || 0}
                        valueStyle={{ color: "green" }}
                        prefix={<TeamOutlined />}
                      />
                    </Card>
                  </Col>
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
                    label={{
                      style: {
                        textAlign: "center",
                        textBaseline: "alphabetic",
                      },
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
                        {
                          name: intl.formatMessage({
                            id: "pages.dashboard.activeRate",
                          }),
                          field: "activeRateInc",
                          valueFormatter: (v: any) => `${v}%`,
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
        </Col>
      </Row>

      <Modal
        title={intl.formatMessage({ id: "pages.dashboard.activeQuery" })}
        open={isActiveUserDetailModalVisible}
        onCancel={() => {
          setIsActiveUserDetailModalVisible(false);
          setSearchUpn("");
          setActiveUserDetailData(null);
        }}
        footer={null}
        width={600}
      >
        <div>
          <Row align="middle">
            <Col flex="auto" style={{ marginRight: 12 }}>
              <Input
                placeholder={intl.formatMessage({
                  id: "pages.dashboard.activeQueryUpnPlaceholder",
                })}
                value={searchUpn}
                onChange={(e) => setSearchUpn(e.target.value)}
                onPressEnter={handleSearchActiveUser}
              />
            </Col>
            <Col>
              <Button type="primary" onClick={handleSearchActiveUser}>
                {intl.formatMessage({ id: "pages.dashboard.search" })}
              </Button>
            </Col>
          </Row>
        </div>

        {activeUserDetailLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : activeUserDetailData ? (
          <Card style={{ marginTop: 12 }}>
            <Row>
              <Col md={12}>
                <Statistic
                  title={intl.formatMessage({
                    id: "pages.dashboard.totalCost",
                  })}
                  value={activeUserDetailData.totalCost || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: "red" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={intl.formatMessage({
                    id: "pages.dashboard.totalCall",
                  })}
                  value={activeUserDetailData.totalCalls || 0}
                  valueStyle={{ color: "blue" }}
                />
              </Col>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Col span={24}>
                <div>
                  <Text strong>
                    {intl.formatMessage({ id: "pages.dashboard.lastActive" })}
                  </Text>
                  <Text>
                    {activeUserDetailData.lastActive ||
                      intl.formatMessage({
                        id: "pages.dashboard.noData",
                      })}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        ) : null}
      </Modal>
    </PageContainer>
  );
};

export default BillingGraphPage;
