import { Bar, Line } from "@ant-design/charts";
import {
  BarChartOutlined,
  CalendarOutlined,
  RiseOutlined,
  TableOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Card,
  Col,
  Modal,
  Row,
  Select,
  Spin,
  Statistic,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import {
  getBillingStatsActiveUsersList,
  getBillingStatsActiveUsersSummary,
  getBillingStatsAllName,
  getBillingStatsModelConsumption,
  getBillingStatsModelUsage,
  getBillingStatsTodayTotal,
} from "@/services/uniauthService/billing";

// 动态获取选项的API函数
const getAllName = async (name: string): Promise<string[]> => {
  try {
    const response = await getBillingStatsAllName({ name });
    console.log(`API响应数据 for ${name}:`, response);
    return response?.allName || [];
  } catch (error) {
    console.error(`获取${name}列表失败:`, error);
    return [];
  }
};

const { Title, Text } = Typography;
const { Option } = Select;

const BillingGraphPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeUsersLoading, setActiveUsersLoading] = useState<boolean>(false);

  const [modelConsumptionLoading, setModelConsumptionLoading] =
    useState<boolean>(false);
  const [modelUsageLoading, setModelUsageLoading] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [statsData, setStatsData] =
    useState<API.GetTodayTotalConsumptionRes | null>(null);
  const [activeUsersData, setActiveUsersData] =
    useState<API.GetActiveUsersNumRes | null>(null);

  const [modelConsumptionData, setModelConsumptionData] =
    useState<API.GetProductConsumptionRes | null>(null);
  const [modelUsageData, setModelUsageData] =
    useState<API.GetProductUsageChartRes | null>(null);

  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [selectedModelDays, setSelectedModelDays] = useState<number>(7);
  const [selectedModelService, setSelectedModelService] =
    useState<string>("all");
  const [selectedModelProduct, setSelectedModelProduct] =
    useState<string>("all");

  // 新增状态：弹窗显示控制
  const [isConsumptionModalVisible, setIsConsumptionModalVisible] =
    useState<boolean>(false);

  // 动态选项状态
  const [serviceOptions, setServiceOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "all" }]);

  const [productOptions, setProductOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "all" }]);

  // 天数选项（保持不变）
  const daysOptions = [
    { value: 7, label: "7" },
    { value: 30, label: "30" },
    { value: 90, label: "90" },
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
      const params: API.GetActiveUsersNumReq = { days: days || selectedDays };
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

  // 服务选择变化处理 - 更新为统一处理
  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    fetchStatsData(value);
    // 同时更新模型统计的服务筛选器
    setSelectedModelService(value);
    fetchModelConsumptionData(selectedModelDays, value, selectedModelProduct);
    fetchModelUsageData(selectedModelDays, value, selectedModelProduct);
  };

  // 天数选择变化处理 - 更新为统一处理
  const handleDaysChange = (value: number) => {
    setSelectedDays(value);
    fetchActiveUsersData(value);
    fetchAllUsersData(value);
    // 同时更新模型统计的天数筛选器
    setSelectedModelDays(value);
    fetchModelConsumptionData(
      value,
      selectedModelService,
      selectedModelProduct,
    );
    fetchModelUsageData(value, selectedModelService, selectedModelProduct);
  };

  // 模型选择变化处理 - 更新为统一处理
  const handleModelChange = (value: string) => {
    setSelectedModelProduct(value);
    fetchModelConsumptionData(selectedModelDays, selectedModelService, value);
    fetchModelUsageData(selectedModelDays, selectedModelService, value);
  };

  // 获取所有活跃用户列表
  const fetchAllUsersData = async (days?: number) => {
    setError("");

    try {
      const params: API.GetAllActiveUsersReq = {
        days: days || 7,
        page: 1,
        pageSize: 10,
        sortBy: "cost",
        sortOrder: "desc",
      };
      const response = await getBillingStatsActiveUsersList(params);
      if (response) {
        // 数据获取成功，但不再存储到状态中
      }
    } catch (err) {
      setError("获取所有用户数据失败，请稍后重试");
      console.error("获取所有用户数据失败:", err);
    }
  };

  // 获取动态选项
  const fetchDynamicOptions = async () => {
    try {
      // 获取服务选项 - getAllName直接返回string[]
      const services = await getAllName("service");
      const serviceOptions = services.map((service) => ({
        value: service,
        label: service,
      }));
      setServiceOptions(serviceOptions);

      // 获取产品选项 - getAllName直接返回string[]
      const products = await getAllName("product");
      const productOptions = products.map((product) => ({
        value: product,
        label: product,
      }));
      setProductOptions(productOptions);
    } catch (error) {
      console.error("获取动态选项失败:", error);
    }
  };

  // 获取模型消费金额统计
  const fetchModelConsumptionData = async (
    days?: number,
    service?: string,
    product?: string,
  ) => {
    setModelConsumptionLoading(true);
    setError("");

    try {
      const params: API.GetProductConsumptionReq = {
        nDays: days || 7,
        service: service || "",
        product: product || "",
      };
      const response = await getBillingStatsModelConsumption(params);
      if (response) {
        setModelConsumptionData(response);
      }
    } catch (err) {
      setError("获取模型消费金额统计失败，请稍后重试");
      console.error("获取模型消费金额统计失败:", err);
    } finally {
      setModelConsumptionLoading(false);
    }
  };

  // 获取模型调用次数图表
  const fetchModelUsageData = async (
    days?: number,
    service?: string,
    product?: string,
  ) => {
    setModelUsageLoading(true);
    setError("");

    try {
      const params: API.GetProductUsageChartReq = {
        nDays: days || 7,
        service: service || "",
        product: product || "",
      };
      const response = await getBillingStatsModelUsage(params);
      if (response) {
        setModelUsageData(response);
      }
    } catch (err) {
      setError("获取模型调用次数图表失败，请稍后重试");
      console.error("获取模型调用次数图表失败:", err);
    } finally {
      setModelUsageLoading(false);
    }
  };

  // 模型统计筛选变化处理
  const handleModelFilterChange = (
    days?: number,
    service?: string,
    product?: string,
  ) => {
    setSelectedModelDays(days || 7);
    setSelectedModelService(service || "");
    setSelectedModelProduct(product || "");
    fetchModelConsumptionData(days, service, product);
    fetchModelUsageData(days, service, product);
  };

  useEffect(() => {
    fetchDynamicOptions();
    fetchStatsData();
    fetchActiveUsersData();
    fetchAllUsersData();
    fetchModelConsumptionData();
    fetchModelUsageData();
  }, []);

  return (
    <PageContainer>
      {/* 统一的筛选器组件 */}
      <Card style={{ marginBottom: "24px" }}>
        <Title level={4}>筛选条件</Title>
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
              allowClear
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
          </Col>
          <Col>
            <span style={{ marginRight: "8px" }}>模型:</span>
          </Col>
          <Col>
            <Select
              value={selectedModelProduct}
              onChange={handleModelChange}
              style={{ width: 200 }}
              placeholder="选择模型"
              allowClear
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
          </Col>
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
              {daysOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 今日消费统计和模型消费统计 */}
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={4}>今日消费统计</Title>
            <Text type="secondary">查看最近{selectedDays}天消费情况</Text>

            {/* 移除筛选器区域 */}
            {/* 今日消费统计内容保持不变 */}
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
                <Col xs={24} sm={12} md={12}>
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
                <Col xs={24} sm={12} md={12}>
                  <Card>
                    <Statistic
                      title="消费增长率"
                      value={statsData.increaseRate}
                      precision={2}
                      valueStyle={{
                        color:
                          statsData.increaseRate > 0 ? "#cf1322" : "#3f8600",
                      }}
                      prefix={
                        statsData.increaseRate > 0 ? (
                          <RiseOutlined />
                        ) : undefined
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
                    color: "#999",
                  }}
                >
                  暂无数据
                </div>
              </Card>
            )}
          </Card>

          {/* 模型消费统计 - 移动到今日消费统计下面 */}
          <Card style={{ marginTop: "24px" }}>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: "16px" }}
            >
              <Col>
                <Title level={4} style={{ margin: 0 }}>
                  模型消费统计
                </Title>
                <Text type="secondary">
                  查看最近{selectedDays}天模型消费情况
                </Text>
              </Col>
              <Col>
                <Button
                  style={{
                    backgroundColor: "#fff",
                    color: "#000",
                    border: "1px solid #d9d9d9",
                  }}
                  icon={<TableOutlined />}
                  onClick={() => setIsConsumptionModalVisible(true)}
                >
                  查看消费明细
                </Button>
              </Col>
            </Row>

            {/* 移除筛选器区域 */}
            {/* 模型消费统计内容保持不变 */}
            {modelConsumptionLoading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
              </div>
            ) : modelConsumptionData ? (
              <>
                <Row gutter={16} style={{ marginBottom: "24px" }}>
                  <Col xs={24} sm={12} md={12}>
                    <Card>
                      <Statistic
                        title="总消费金额"
                        value={modelConsumptionData.totalCost || 0}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: "#cf1322" }}
                        suffix="CNY"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={12}>
                    <Card>
                      <Statistic
                        title="总调用次数"
                        value={modelConsumptionData.totalCalls || 0}
                        valueStyle={{ color: "#1890ff" }}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 弹窗 */}
                <Modal
                  title="消费明细"
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
                      pagination={{
                        showSizeChanger: true,
                        showTotal: (total: number) => `共 ${total} 条记录`,
                        pageSizeOptions: ["10", "20", "30"],
                        onChange: (page: number, pageSize: number) => {
                          console.log(`切换到第${page}页，每页${pageSize}条`);
                        },
                        onShowSizeChange: (_: number, size: number) => {
                          console.log(`每页条数改为${size}条`);
                        },
                      }}
                      scroll={{ x: 800 }}
                      columns={[
                        {
                          title: "日期",
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
                          filterSearch: true,
                        },
                        {
                          title: "模型",
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
                          filterSearch: true,
                        },
                        {
                          title: "服务类型",
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
                          filterSearch: true,
                        },
                        {
                          title: "调用次数",
                          dataIndex: "calls",
                          key: "calls",
                          width: 100,
                          sorter: (a: any, b: any) =>
                            (a.calls || 0) - (b.calls || 0),
                          render: (_: React.ReactNode, record: any) =>
                            (record.calls || 0).toLocaleString(),
                        },
                        {
                          title: "消费金额(CNY)",
                          dataIndex: "costCNY",
                          key: "costCNY",
                          width: 120,
                          sorter: (a: any, b: any) =>
                            (a.costCNY || 0) - (b.costCNY || 0),
                          render: (_: React.ReactNode, record: any) =>
                            `¥${(record.costCNY || 0).toFixed(2)}`,
                        },
                        {
                          title: "平均单价",
                          dataIndex: "avgPrice",
                          key: "avgPrice",
                          width: 100,
                          sorter: (a: any, b: any) =>
                            (a.avgPrice || 0) - (b.avgPrice || 0),
                          render: (_: React.ReactNode, record: any) =>
                            `¥${(record.avgPrice || 0).toFixed(4)}`,
                        },
                      ]}
                    />
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "50px",
                        color: "#999",
                      }}
                    >
                      暂无消费明细数据
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
                    color: "#999",
                  }}
                >
                  暂无模型消费数据
                </div>
              </Card>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={4}>活跃用户统计</Title>
            <Text type="secondary">查看最近{selectedDays}天的活跃用户数据</Text>

            {/* 移除筛选器区域 */}
            {/* 活跃用户统计内容保持不变 */}
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
                        textAlign: "center",
                        textBaseline: "alphabetic",
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
                      title: false,
                      items: [
                        {
                          channel: "x",
                          name: "日期",
                          valueFormatter: (v: any) => v,
                        },
                        {
                          channel: "y",
                          name: "活跃用户数",
                          valueFormatter: (v: any) => `${v} 人`,
                        },
                        {
                          name: "活跃率变化",
                          field: "activeRateInc",
                          valueFormatter: (v: any) => `${v}%`,
                        },
                      ],
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
                  style={{
                    textAlign: "center",
                    padding: "50px",
                    color: "#999",
                  }}
                >
                  暂无活跃用户数据
                </div>
              </Card>
            )}
          </Card>
        </Col>
      </Row>

      {/* 模型调用次数统计 */}
      <Card style={{ marginTop: "24px" }}>
        <Title level={4}>模型调用次数统计</Title>
        <Text type="secondary">查看最近{selectedModelDays}天模型调用情况</Text>

        {/* 筛选器区域 */}
        <Card style={{ marginBottom: "24px", marginTop: "16px" }}>
          <Row gutter={16} align="middle">
            <Col>
              <span style={{ marginRight: "8px" }}>服务类型:</span>
            </Col>
            <Col>
              <Select
                value={selectedModelService}
                onChange={(value) =>
                  handleModelFilterChange(
                    selectedModelDays,
                    value,
                    selectedModelProduct,
                  )
                }
                style={{ width: 200 }}
                placeholder="选择服务类型"
                allowClear
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
            </Col>
            <Col>
              <span style={{ marginRight: "8px" }}>模型:</span>
            </Col>
            <Col>
              <Select
                value={selectedModelProduct}
                onChange={(value) =>
                  handleModelFilterChange(
                    selectedModelDays,
                    selectedModelService,
                    value,
                  )
                }
                style={{ width: 200 }}
                placeholder="选择模型"
                allowClear
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
            </Col>
            <Col>
              <span style={{ marginRight: "8px" }}>天数:</span>
            </Col>
            <Col>
              <Select
                value={selectedModelDays}
                onChange={(value) =>
                  handleModelFilterChange(
                    value,
                    selectedModelService,
                    selectedModelProduct,
                  )
                }
                style={{ width: 120 }}
                placeholder="选择天数"
              >
                {daysOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>

        {modelUsageLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : modelUsageData ? (
          <>
            <Row gutter={16} style={{ marginBottom: "24px" }}>
              <Col xs={24} sm={12} md={12}>
                <Card>
                  <Statistic
                    title="总调用次数"
                    value={modelUsageData.totalCalls || 0}
                    valueStyle={{ color: "#1890ff" }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Card>
                  <Statistic
                    title="统计周期"
                    value={`${selectedModelDays}天`}
                    valueStyle={{ color: "#52c41a" }}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* 模型调用次数图表 */}
            <Row gutter={16}>
              <Col xs={24}>
                <Card title="调用次数趋势图（折线图）">
                  <div style={{ height: "300px" }}>
                    {modelUsageData.lineChartData ? (
                      <Line
                        data={(
                          modelUsageData.lineChartData as any
                        ).series.flatMap((seriesItem: any) =>
                          (seriesItem.data as any[]).map(
                            (value: number, index: number) => ({
                              date: (modelUsageData.lineChartData as any).dates[
                                index
                              ],
                              calls: value,
                              model: seriesItem.name,
                            }),
                          ),
                        )}
                        height={300}
                        xField="date"
                        yField="calls"
                        seriesField="model"
                        meta={{
                          date: { alias: "日期" },
                          calls: { alias: "调用次数" },
                          model: { alias: "模型" },
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "50px",
                          color: "#999",
                        }}
                      >
                        暂无折线图数据
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: "16px" }}>
              <Col xs={24}>
                <Card title="模型调用分布（条形图）">
                  <div style={{ height: "300px" }}>
                    {modelUsageData.barChartData ? (
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
                        meta={{
                          product: { alias: "模型" },
                          calls: { alias: "调用次数" },
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "50px",
                          color: "#999",
                        }}
                      >
                        暂无条形图数据
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
              style={{ textAlign: "center", padding: "50px", color: "#999" }}
            >
              暂无模型调用数据
            </div>
          </Card>
        )}
      </Card>
    </PageContainer>
  );
};

export default BillingGraphPage;
