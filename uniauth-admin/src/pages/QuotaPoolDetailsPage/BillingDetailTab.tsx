import { EyeOutlined } from "@ant-design/icons";
import {
  GridContent,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Modal,
  message,
  Popover,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { type FC, useState } from "react";
import {
  postBillingAdminGet,
  postBillingAdminOpenApiExport,
} from "@/services/uniauthService/admin";

const { Text } = Typography;
const { RangePicker } = DatePicker;

// 定义账单记录的数据类型
interface BillingRecord {
  id: number;
  upn: string;
  svc: string;
  product: string;
  cost: number;
  plan: string;
  source: string;
  remark?: any;
  created_at: string;
}

// 导出表单数据类型
interface ExportFormData {
  svc: string[];
  product: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
}

// 从 props 接收配额池名称
interface BillingDetailTabProps {
  quotaPoolName?: string;
}

const BillingDetailTab: FC<BillingDetailTabProps> = ({
  quotaPoolName = "itso-deep-research-vip",
}) => {
  const [statistics, setStatistics] = useState({
    currentMonthCost: 0,
    lastMonthCost: 0,
    totalCost: 0,
    avgDailyCost: 0,
    recordCount: 0,
  });

  // 状态管理
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<any>(null);

  // 导出模态框相关状态
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportForm] = Form.useForm<ExportFormData>();

  // 动态获取的服务和产品选项
  const [svcOptions, setSvcOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [productOptions, setProductOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [svcValueEnum, setSvcValueEnum] = useState<
    Record<string, { text: string; status?: string }>
  >({});
  const [productValueEnum, setProductValueEnum] = useState<
    Record<string, { text: string; status?: string }>
  >({});

  // 工具函数：格式化JSON对象
  const formatJsonObject = (obj: any): string => {
    try {
      if (obj === null || obj === undefined) return "-";
      if (typeof obj === "string") {
        // 尝试解析字符串是否为JSON
        try {
          const parsed = JSON.parse(obj);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return obj;
        }
      }
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  // 工具函数：获取JSON对象的简要描述
  const getJsonSummary = (obj: any): string => {
    try {
      if (!obj) return "-";

      const parsed = typeof obj === "string" ? JSON.parse(obj) : obj;

      if (typeof parsed === "object" && parsed !== null) {
        const keys = Object.keys(parsed);
        if (keys.length === 0) return "{}";
        if (keys.length === 1) return `{${keys[0]}: ...}`;
        return `{${keys.slice(0, 2).join(", ")}, ...}`;
      }

      return (
        String(parsed).substring(0, 20) +
        (String(parsed).length > 20 ? "..." : "")
      );
    } catch {
      return (
        String(obj).substring(0, 20) + (String(obj).length > 20 ? "..." : "")
      );
    }
  };

  // 处理备注点击事件
  const handleRemarkClick = (remark: any) => {
    setSelectedRemark(remark);
    setRemarkModalVisible(true);
  };

  // 从记录中提取唯一的服务和产品选项
  const extractOptionsFromRecords = (records: BillingRecord[]) => {
    const svcSet = new Set<string>();
    const productSet = new Set<string>();

    records.forEach((record) => {
      if (record.svc) {
        svcSet.add(record.svc);
      }
      if (record.product) {
        productSet.add(record.product);
      }
    });

    // 转换为选项格式
    const svcOpts = Array.from(svcSet).map((svc) => ({
      label: svc,
      value: svc,
    }));

    const productOpts = Array.from(productSet).map((product) => ({
      label: product,
      value: product,
    }));

    // 设置valueEnum格式
    const svcEnum: Record<string, { text: string; status?: string }> = {};
    const productEnum: Record<string, { text: string; status?: string }> = {};

    svcSet.forEach((svc) => {
      svcEnum[svc] = { text: svc, status: "Default" };
    });

    productSet.forEach((product) => {
      productEnum[product] = { text: product, status: "Default" };
    });

    setSvcOptions(svcOpts);
    setProductOptions(productOpts);
    setSvcValueEnum(svcEnum);
    setProductValueEnum(productEnum);
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const response = await postBillingAdminGet({
        quotaPools: [quotaPoolName],
        svc: [],
        product: [],
        startTime: startOfYear.toISOString().split("T")[0],
        endTime: now.toISOString().split("T")[0],
      });

      if (response.records) {
        const recordsData = response.records;
        let allRecords: BillingRecord[] = [];

        Object.keys(recordsData).forEach((poolName) => {
          const poolRecords = (recordsData as any)[poolName] || [];
          allRecords = allRecords.concat(poolRecords);
        });

        // 提取选项数据
        extractOptionsFromRecords(allRecords);

        const stats = calculateStatistics(allRecords);
        setStatistics({
          ...stats,
          recordCount: allRecords.length,
        });
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
    }
  };

  // 处理导出账单
  const handleExportBill = async (values: ExportFormData) => {
    try {
      setExportLoading(true);

      const startTime = values.dateRange[0].format("YYYY-MM-DD");
      const endTime = values.dateRange[1].format("YYYY-MM-DD");

      const response = await postBillingAdminOpenApiExport({
        quotaPools: [quotaPoolName],
        upns: [],
        svc: values.svc || [],
        product: values.product || [],
        startTime,
        endTime,
      });

      // 创建下载链接
      const blob = new Blob([response as any], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${quotaPoolName}_账单_${startTime}_${endTime}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success("账单导出成功！");
      setExportModalVisible(false);
      exportForm.resetFields();
    } catch (error) {
      console.error("导出账单失败:", error);
      message.error("导出账单失败，请重试");
    } finally {
      setExportLoading(false);
    }
  };

  // 打开导出模态框
  const handleOpenExportModal = () => {
    // 设置默认时间范围为本月
    const now = dayjs();
    const startOfMonth = now.startOf("month");

    exportForm.setFieldsValue({
      dateRange: [startOfMonth, now],
      svc: [],
      product: [],
    });

    setExportModalVisible(true);
  };

  // 页面加载时获取统计数据
  useState(() => {
    fetchStatistics();
  });
  const billingRecordsColumns: ProColumns<BillingRecord>[] = [
    {
      title: "用户",
      dataIndex: "upn",
      valueType: "text",
      search: true,
      ellipsis: true,
    },
    {
      title: "服务",
      dataIndex: "svc",
      valueType: "select",
      search: true,
      ellipsis: true,

      valueEnum: svcValueEnum,
    },
    {
      title: "产品",
      dataIndex: "product",
      valueType: "select",
      search: true,
      ellipsis: true,

      valueEnum: productValueEnum,
    },
    {
      title: "费用",
      dataIndex: "cost",
      valueType: "money",
      search: false,

      render: (_, record) => (
        <Text type="danger">${Number(record.cost).toFixed(4)}</Text>
      ),
    },
    {
      title: "计费方案",
      dataIndex: "plan",
      valueType: "text",
      search: false,
      ellipsis: true,
    },
    {
      title: "来源",
      dataIndex: "source",
      valueType: "text",
      search: false,
      ellipsis: true,

      render: (_, record) => <Tag color="blue">{record.source}</Tag>,
    },
    {
      title: "备注",
      dataIndex: "remark",
      valueType: "text",
      search: false,
      ellipsis: true,
      width: 180,
      render: (_, record) => {
        if (!record.remark) return <Text type="secondary">-</Text>;

        const summary = getJsonSummary(record.remark);
        const formattedJson = formatJsonObject(record.remark);

        return (
          <Space size="small">
            <Popover
              title="备注详情"
              content={
                <pre
                  style={{
                    maxWidth: 400,
                    maxHeight: 300,
                    overflow: "auto",
                    fontSize: "12px",
                    margin: 0,
                    background: "#f5f5f5",
                    padding: "8px",
                    borderRadius: "4px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {formattedJson}
                </pre>
              }
              trigger="hover"
              placement="left"
              overlayStyle={{ maxWidth: 500 }}
            >
              <Text
                ellipsis
                style={{ cursor: "pointer" }}
                title="悬停查看详情，点击查看完整内容"
              >
                {summary}
              </Text>
            </Popover>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleRemarkClick(record.remark)}
              style={{ padding: "0 4px", fontSize: "12px" }}
              title="查看完整备注"
            />
          </Space>
        );
      },
    },
    {
      title: "时间",
      dataIndex: "created_at",
      valueType: "dateTime",
      search: {
        transform: (value: any) => {
          return {
            startTime: value[0],
            endTime: value[1],
          };
        },
      },
      fieldProps: {
        format: "YYYY-MM-DD",
      },
      hideInTable: false,
      ellipsis: true,
      // 设置搜索表单的valueType为dateRange
      renderFormItem: () => {
        const now = dayjs();
        const startOfMonth = now.startOf("month");

        return (
          <RangePicker
            format="YYYY-MM-DD"
            placeholder={["开始日期", "结束日期"]}
            defaultValue={[startOfMonth, now]}
          />
        );
      },
    },
  ];

  const billingRecordsDataRequest = async (params: any) => {
    try {
      // 获取默认时间范围：本月初到当前时间
      const now = dayjs();
      const startOfMonth = now.startOf("month");
      const defaultStartTime = startOfMonth.format("YYYY-MM-DD");
      const defaultEndTime = now.format("YYYY-MM-DD");

      // 构建API请求参数
      const requestParams = {
        quotaPools: [quotaPoolName],
        svc: params.svc ? [params.svc] : [],
        product: params.product ? [params.product] : [],
        startTime: params.startTime || defaultStartTime,
        endTime: params.endTime || defaultEndTime,
      };

      const response = await postBillingAdminGet(requestParams);

      if (response.records) {
        // 解析返回的数据 - records 是一个 Map，key 是配额池名称
        const recordsData = response.records;
        let allRecords: BillingRecord[] = [];

        // 遍历所有配额池的数据
        Object.keys(recordsData).forEach((poolName) => {
          const poolRecords = (recordsData as any)[poolName] || [];
          allRecords = allRecords.concat(poolRecords);
        });

        // 每次请求都更新选项数据，确保获取到最新的服务和产品类型
        extractOptionsFromRecords(allRecords);

        // 过滤数据
        let filteredRecords = allRecords;
        if (params.upn) {
          filteredRecords = filteredRecords.filter((record: BillingRecord) =>
            record.upn.toLowerCase().includes(params.upn.toLowerCase()),
          );
        }
        if (params.plan) {
          filteredRecords = filteredRecords.filter((record: BillingRecord) =>
            record.plan.toLowerCase().includes(params.plan.toLowerCase()),
          );
        }

        return {
          data: filteredRecords,
          success: true,
          total: filteredRecords.length,
        };
      }
    } catch (error) {
      console.error("获取账单数据失败:", error);
    }

    // 如果 API 调用失败，返回空数据
    return {
      data: [],
      success: false,
      total: 0,
    };
  };

  // 计算统计数据
  const calculateStatistics = (records: BillingRecord[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthCost = 0;
    let lastMonthCost = 0;
    let totalCost = 0;

    records.forEach((record) => {
      const recordDate = new Date(record.created_at);
      const cost = Number(record.cost);
      totalCost += cost;

      if (
        recordDate.getFullYear() === currentYear &&
        recordDate.getMonth() === currentMonth
      ) {
        currentMonthCost += cost;
      }
      if (
        recordDate.getFullYear() === lastMonthYear &&
        recordDate.getMonth() === lastMonth
      ) {
        lastMonthCost += cost;
      }
    });

    const avgDailyCost = currentMonthCost / now.getDate();

    return {
      currentMonthCost,
      lastMonthCost,
      totalCost,
      avgDailyCost,
    };
  };

  return (
    <GridContent>
      <Card
        title="账单概览"
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <Descriptions column={3}>
          <Descriptions.Item label="配额池名称">
            <Tag color="blue">{quotaPoolName}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="本月消费">
            <Text type="danger">${statistics.currentMonthCost.toFixed(4)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="上月消费">
            <Text>${statistics.lastMonthCost.toFixed(4)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="累计消费">
            <Text strong>${statistics.totalCost.toFixed(4)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="平均日消费">
            <Text>${statistics.avgDailyCost.toFixed(4)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="总记录数">
            <Text>{statistics.recordCount} 条</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={`${quotaPoolName} - 消费明细`}
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <ProTable<BillingRecord>
          columns={billingRecordsColumns}
          rowKey="id"
          search={{
            labelWidth: "auto",
            collapsed: false,
            collapseRender: false,
          }}
          params={{
            // 设置初始搜索参数，确保默认显示本月到现在的数据
            startTime: dayjs().startOf("month").format("YYYY-MM-DD"),
            endTime: dayjs().format("YYYY-MM-DD"),
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          request={billingRecordsDataRequest}
          dateFormatter="string"
          headerTitle="消费记录"
          scroll={{ x: 1200 }}
          options={{
            reload: true,
            density: true,
            fullScreen: true,
          }}
          toolBarRender={() => [
            <Button key="export" type="primary" onClick={handleOpenExportModal}>
              导出账单
            </Button>,
          ]}
        />
      </Card>

      {/* 导出账单模态框 */}
      <Modal
        title="导出账单"
        open={exportModalVisible}
        onCancel={() => {
          setExportModalVisible(false);
          exportForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setExportModalVisible(false);
              exportForm.resetFields();
            }}
          >
            取消
          </Button>,
          <Button
            key="export"
            type="primary"
            loading={exportLoading}
            onClick={() => {
              exportForm.submit();
            }}
          >
            确定导出
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={exportForm}
          layout="vertical"
          onFinish={handleExportBill}
          initialValues={{
            svc: [],
            product: [],
          }}
        >
          <Form.Item
            name="dateRange"
            label="时间范围"
            rules={[{ required: true, message: "请选择时间范围" }]}
          >
            <RangePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              placeholder={["开始日期", "结束日期"]}
            />
          </Form.Item>

          <Form.Item
            name="svc"
            label="服务类型"
            extra="不选择表示导出所有服务类型"
          >
            <Select
              mode="multiple"
              placeholder="请选择服务类型"
              options={svcOptions}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="product"
            label="产品类型"
            extra="不选择表示导出所有产品类型"
          >
            <Select
              mode="multiple"
              placeholder="请选择产品类型"
              options={productOptions}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 备注详情模态框 */}
      <Modal
        title="备注详情"
        open={remarkModalVisible}
        onCancel={() => setRemarkModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setRemarkModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <pre
          style={{
            maxHeight: "60vh",
            overflow: "auto",
            fontSize: "13px",
            background: "#f8f9fa",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {formatJsonObject(selectedRemark)}
        </pre>
      </Modal>
    </GridContent>
  );
};

export default BillingDetailTab;
