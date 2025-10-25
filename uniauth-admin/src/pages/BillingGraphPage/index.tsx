import { Bar, Line } from "@ant-design/charts";
import {
  BarChartOutlined,
  CalendarOutlined,
  RiseOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import {
  Alert,
  Card,
  Col,
  Row,
  Select,
  Spin,
  Statistic,
  Tag,
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
  const [allUsersLoading, setAllUsersLoading] = useState<boolean>(false);

  const [modelConsumptionLoading, setModelConsumptionLoading] =
    useState<boolean>(false);
  const [modelUsageLoading, setModelUsageLoading] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [statsData, setStatsData] =
    useState<API.GetTodayTotalConsumptionRes | null>(null);
  const [activeUsersData, setActiveUsersData] =
    useState<API.GetActiveUsersNumRes | null>(null);
  const [allUsersData, setAllUsersData] =
    useState<API.GetAllActiveUsersRes | null>(null);

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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

  // 获取所有活跃用户列表
  const fetchAllUsersData = async (
    days?: number,
    page?: number,
    pageSize?: number,
  ) => {
    setAllUsersLoading(true);
    setError("");

    try {
      const params: API.GetAllActiveUsersReq = {
        days: days || 7,
        page: page || 1,
        pageSize: pageSize || 10,
        sortBy: "cost",
        sortOrder: "desc",
      };
      const response = await getBillingStatsActiveUsersList(params);
      if (response) {
        setAllUsersData(response);
      }
    } catch (err) {
      setError("获取所有用户数据失败，请稍后重试");
      console.error("获取所有用户数据失败:", err);
    } finally {
      setAllUsersLoading(false);
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

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    setPageSize(pageSize || 10);
    fetchAllUsersData(selectedDays, page, pageSize);
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
      <ProCard>
        {/* 今日消费统计和活跃用户统计并排显示 */}
        <Row gutter={24}>
          {/* 今日消费统计 */}
          <Col xs={24} lg={12}>
            <Card style={{ marginBottom: "24px" }}>
              <Title level={4}>今日消费统计</Title>
              <Text type="secondary">
                查看今日各项服务的消费统计数据和增长率
              </Text>

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
          </Col>

          {/* 活跃用户统计 */}
          <Col xs={24} lg={12}>
            <Card>
              <Title level={4}>活跃用户统计</Title>
              <Text type="secondary">
                查看最近{selectedDays}天的活跃用户数据
              </Text>

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
                      <Option value={7}>7</Option>
                      <Option value={30}>30</Option>
                      <Option value={90}>90</Option>
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

        {/* 所有用户数据展示 */}
        <Card style={{ marginTop: "24px" }}>
          <Title level={4}>所有用户数据</Title>
          <Text type="secondary">查看所有活跃用户的详细信息</Text>

          {/* 筛选器区域 */}
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
                  {daysOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>

          {allUsersLoading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : allUsersData ? (
            <>
              <Row gutter={16} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={24} md={24}>
                  <Card>
                    <Statistic
                      title="活跃用户总数"
                      value={allUsersData.total || 0}
                      valueStyle={{ color: "#52c41a" }}
                      prefix={<TeamOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 用户数据表格 */}
              <Card title="用户详细信息" style={{ marginTop: "16px" }}>
                <ProTable
                  dataSource={allUsersData.activeUsers || []}
                  columns={[
                    {
                      title: "UPN",
                      dataIndex: "upn",
                      key: "upn",
                      render: (_, record: any) => (
                        <Text strong>{record.upn || ""}</Text>
                      ),
                      filters: Array.from(
                        new Set(
                          allUsersData.activeUsers
                            ?.map((item) => item.upn)
                            .filter(Boolean) || [],
                        ),
                      ).map((upn) => ({
                        text: upn as string,
                        value: upn as string,
                      })),
                      onFilter: (value: any, record: any) =>
                        record.upn === value,
                      filterSearch: true,
                    },
                    {
                      title: "总消费(CNY)",
                      dataIndex: "totalCost",
                      key: "totalCost",
                      render: (_, record: any) => (
                        <Text type="danger">¥{record.totalCost}</Text>
                      ),
                      sorter: (a: any, b: any) => {
                        const costA = a.totalCost
                          ? parseFloat(a.totalCost.toString())
                          : 0;
                        const costB = b.totalCost
                          ? parseFloat(b.totalCost.toString())
                          : 0;
                        return costA - costB;
                      },
                    },
                    {
                      title: "总调用次数",
                      dataIndex: "totalCalls",
                      key: "totalCalls",
                      render: (_, record: any) => (
                        <Tag color="blue">{record.totalCalls || 0}</Tag>
                      ),
                      sorter: (a: any, b: any) =>
                        (a.totalCalls || 0) - (b.totalCalls || 0),
                    },
                    {
                      title: "最后活跃时间",
                      dataIndex: "lastActive",
                      key: "lastActive",
                      sorter: (a: any, b: any) =>
                        (a.lastActive || "").localeCompare(b.lastActive || ""),
                    },
                  ]}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: allUsersData.total || 0,
                    onChange: handlePageChange,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "30"],
                    showTotal: (total: number, range: number[]) => {
                      const totalPages = allUsersData.totalPages || 0;
                      return `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录，共 ${totalPages} 页`;
                    },
                    showQuickJumper: true,
                  }}
                  rowKey={(record: any) => record.upn || ""}
                />
              </Card>
            </>
          ) : (
            <Card>
              <div
                style={{ textAlign: "center", padding: "50px", color: "#999" }}
              >
                暂无用户数据
              </div>
            </Card>
          )}
        </Card>

        {/* 模型消费统计 */}
        <Card style={{ marginTop: "24px" }}>
          <Title level={4}>模型消费统计</Title>
          <Text type="secondary">
            查看最近{selectedModelDays}天模型消费情况
          </Text>

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

          {modelConsumptionLoading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : modelConsumptionData ? (
            <>
              <Row gutter={16} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={12} md={8}>
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
                <Col xs={24} sm={12} md={8}>
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

              {/* 消费数据表格 */}
              <Card title="消费明细" style={{ marginTop: "16px" }}>
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
                        title: "配额池",
                        dataIndex: "quotaPool",
                        key: "quotaPool",
                        width: 150,
                        sorter: (a: any, b: any) =>
                          (a.quotaPool || "").localeCompare(b.quotaPool || ""),
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
                        filterSearch: true,
                      },
                      {
                        title: "消费金额(CNY)",
                        dataIndex: "cost",
                        key: "cost",
                        width: 120,
                        sorter: (a: any, b: any) => {
                          const costA = a.cost
                            ? parseFloat(a.cost.toString())
                            : 0;
                          const costB = b.cost
                            ? parseFloat(b.cost.toString())
                            : 0;
                          return costA - costB;
                        },
                        render: (_, record: any) => (
                          <span
                            style={{ color: "#cf1322", fontWeight: "bold" }}
                          >
                            ¥
                            {record.cost
                              ? parseFloat(record.cost.toString()).toFixed(2)
                              : "0.00"}
                          </span>
                        ),
                      },
                      {
                        title: "调用次数",
                        dataIndex: "calls",
                        key: "calls",
                        width: 100,
                        sorter: (a: any, b: any) =>
                          (a.calls || 0) - (b.calls || 0),
                        render: (_, record: any) => (
                          <span style={{ color: "#1890ff" }}>
                            {record.calls || 0}
                          </span>
                        ),
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
              </Card>
            </>
          ) : (
            <Card>
              <div
                style={{ textAlign: "center", padding: "50px", color: "#999" }}
              >
                暂无模型消费数据
              </div>
            </Card>
          )}
        </Card>

        {/* 模型调用次数统计 */}
        <Card style={{ marginTop: "24px" }}>
          <Title level={4}>模型调用次数统计</Title>
          <Text type="secondary">
            查看最近{selectedModelDays}天模型调用情况
          </Text>

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
      </ProCard>
    </PageContainer>
  );
};

export default BillingGraphPage;
