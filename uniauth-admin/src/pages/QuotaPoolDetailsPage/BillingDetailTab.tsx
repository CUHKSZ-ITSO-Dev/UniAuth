import { useIntl } from "@@/plugin-locale/localeExports";
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
import { postBillingOptions } from "@/services/uniauthService/billing";

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

// 配额池详细信息接口
interface QuotaPoolDetail {
  quotaPoolName: string;
  cronCycle: string;
  regularQuota: number;
  remainingQuota: number;
  extraQuota: number;
  lastResetAt: string;
}

// 从 props 接收配额池名称和详细信息
interface BillingDetailTabProps {
  quotaPoolName: string;
  quotaPoolDetail?: QuotaPoolDetail | null;
}

const BillingDetailTab: FC<BillingDetailTabProps> = ({
  quotaPoolName = "itso-deep-research-vip",
}) => {
  const intl = useIntl();

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

  // 获取完整的服务和产品选项
  const fetchBillingOptions = async () => {
    try {
      const response = await postBillingOptions({
        quotaPool: quotaPoolName,
      });

      if (response.services && response.products) {
        // 转换为选项格式
        const svcOpts = response.services.map((svc) => ({
          label: svc,
          value: svc,
        }));

        const productOpts = response.products.map((product) => ({
          label: product,
          value: product,
        }));

        // 设置valueEnum格式
        const svcEnum: Record<string, { text: string; status?: string }> = {};
        const productEnum: Record<string, { text: string; status?: string }> =
          {};

        response.services.forEach((svc) => {
          svcEnum[svc] = { text: svc, status: "Default" };
        });

        response.products.forEach((product) => {
          productEnum[product] = { text: product, status: "Default" };
        });

        setSvcOptions(svcOpts);
        setProductOptions(productOpts);
        setSvcValueEnum(svcEnum);
        setProductValueEnum(productEnum);
      }
    } catch (error) {
      console.error("获取计费选项失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.billingDetail.fetchOptionsFailed",
          defaultMessage: "获取服务和产品选项失败，请刷新页面重试",
        }),
      );
    }
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

        const stats = calculateStatistics(allRecords);
        setStatistics({
          ...stats,
          recordCount: allRecords.length,
        });
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.billingDetail.fetchStatisticsFailed",
          defaultMessage: "获取统计数据失败",
        }),
      );
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

      message.success(
        intl.formatMessage({
          id: "pages.billingDetail.exportSuccess",
          defaultMessage: "账单导出成功！",
        }),
      );
      setExportModalVisible(false);
      exportForm.resetFields();
    } catch (error) {
      console.error("导出账单失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.billingDetail.exportFailed",
          defaultMessage: "导出账单失败，请重试",
        }),
      );
    } finally {
      setExportLoading(false);
    }
  };

  // 打开导出模态框
  const handleOpenExportModal = async () => {
    // 设置默认时间范围为往前30天
    const now = dayjs();
    const thirtyDaysAgo = now.subtract(30, "day");

    exportForm.setFieldsValue({
      dateRange: [thirtyDaysAgo, now],
      svc: [],
      product: [],
    });

    // 确保获取最新的计费选项
    await fetchBillingOptions();

    setExportModalVisible(true);
  };

  // 页面加载时获取数据
  useState(() => {
    // 首先获取完整的计费选项
    fetchBillingOptions();
    // 然后获取统计数据
    fetchStatistics();
  });
  const billingRecordsColumns: ProColumns<BillingRecord>[] = [
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.user",
        defaultMessage: "用户",
      }),
      dataIndex: "upn",
      valueType: "text",
      search: true,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.svc",
        defaultMessage: "服务",
      }),
      dataIndex: "svc",
      valueType: "select",
      search: true,
      ellipsis: true,

      valueEnum: svcValueEnum,
    },
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.product",
        defaultMessage: "产品",
      }),
      dataIndex: "product",
      valueType: "select",
      search: true,
      ellipsis: true,

      valueEnum: productValueEnum,
    },
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.cost",
        defaultMessage: "费用",
      }),
      dataIndex: "cost",
      valueType: "money",
      search: false,

      render: (_, record) => (
        <Text type="danger">${Number(record.cost).toFixed(4)}</Text>
      ),
    },
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.billingScheme",
        defaultMessage: "计费方案",
      }),
      dataIndex: "plan",
      valueType: "text",
      search: false,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.source",
        defaultMessage: "来源",
      }),
      dataIndex: "source",
      valueType: "text",
      search: false,
      ellipsis: true,

      render: (_, record) => <Tag color="blue">{record.source}</Tag>,
    },
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.remark",
        defaultMessage: "备注",
      }),
      dataIndex: "remark",
      valueType: "text",
      search: false,
      ellipsis: true,
      width: 180,
      render: (_, record) => {
        if (!record.remark)
          return (
            <Text type="secondary">
              {intl.formatMessage({
                id: "pages.billingDetail.noRemark",
                defaultMessage: "-",
              })}
            </Text>
          );

        const summary = getJsonSummary(record.remark);
        const formattedJson = formatJsonObject(record.remark);

        return (
          <Space size="small">
            <Popover
              title={intl.formatMessage({
                id: "pages.billingDetail.remarkDetail",
                defaultMessage: "备注详情",
              })}
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
                title={intl.formatMessage({
                  id: "pages.billingDetail.remarkHover",
                  defaultMessage: "悬停查看详情，点击查看完整内容",
                })}
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
              title={intl.formatMessage({
                id: "pages.billingDetail.remarkClick",
                defaultMessage: "查看完整备注",
              })}
            />
          </Space>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.createdAt",
        defaultMessage: "创建时间",
      }),
      dataIndex: "created_at",
      valueType: "dateTime",
      hideInTable: false,
      ellipsis: true,
      search: false, // 在表格列中禁用搜索
    },
    // 添加一个专门用于时间范围搜索的虚拟列
    {
      title: intl.formatMessage({
        id: "pages.billingDetail.dateRange",
        defaultMessage: "时间范围",
      }),
      dataIndex: "dateRange",
      valueType: "dateRange",
      hideInTable: true, // 在表格中隐藏此列
      search: {
        transform: (value: any) => {
          if (value && Array.isArray(value) && value.length === 2) {
            return {
              startTime: dayjs(value[0]).format("YYYY-MM-DD"),
              endTime: dayjs(value[1]).format("YYYY-MM-DD"),
            };
          }
          return {};
        },
      },
      fieldProps: {
        format: "YYYY-MM-DD",
        placeholder: [
          intl.formatMessage({
            id: "pages.billingDetail.startDate",
            defaultMessage: "开始日期",
          }),
          intl.formatMessage({
            id: "pages.billingDetail.endDate",
            defaultMessage: "结束日期",
          }),
        ],
      },
    },
  ];

  const billingRecordsDataRequest = async (params: any) => {
    try {
      // 获取默认时间范围：往前30天到当前时间
      const now = dayjs();
      const thirtyDaysAgo = now.subtract(30, "day");
      const defaultStartTime = thirtyDaysAgo.format("YYYY-MM-DD");
      const defaultEndTime = now.format("YYYY-MM-DD");

      // 构建API请求参数
      const requestParams = {
        quotaPools: [quotaPoolName],
        svc: params.svc ? [params.svc] : [],
        product: params.product ? [params.product] : [],
        // 优先使用用户选择的时间范围，如果没有则使用默认值
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
      message.error(
        intl.formatMessage({
          id: "pages.billingDetail.fetchRecordsFailed",
          defaultMessage: "获取账单数据失败",
        }),
      );
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
        title={intl.formatMessage({
          id: "pages.billingDetail.billingOverview",
          defaultMessage: "账单概览",
        })}
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <Descriptions column={3}>
          <Descriptions.Item
            label={intl.formatMessage({
              id: "pages.billingDetail.currentMonthCost",
              defaultMessage: "本月消费",
            })}
          >
            <Text type="danger">${statistics.currentMonthCost.toFixed(4)}</Text>
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: "pages.billingDetail.totalCost",
              defaultMessage: "累计消费",
            })}
          >
            <Text strong>${statistics.totalCost.toFixed(4)}</Text>
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: "pages.billingDetail.recordCount",
              defaultMessage: "总记录数",
            })}
          >
            <Text>{statistics.recordCount} 条</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={`${quotaPoolName} - ${intl.formatMessage({
          id: "pages.billingDetail.title",
          defaultMessage: "消费明细",
        })}`}
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
          // 设置表单默认值
          form={{
            initialValues: {
              dateRange: [dayjs().subtract(30, "day"), dayjs()],
            },
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          request={billingRecordsDataRequest}
          dateFormatter="string"
          headerTitle={intl.formatMessage({
            id: "pages.billingDetail.billingRecords",
            defaultMessage: "消费记录",
          })}
          scroll={{ x: 1200 }}
          options={{
            reload: true,
            density: true,
            fullScreen: true,
          }}
          toolBarRender={() => [
            <Button key="export" type="primary" onClick={handleOpenExportModal}>
              {intl.formatMessage({
                id: "pages.billingDetail.exportBill",
                defaultMessage: "导出账单",
              })}
            </Button>,
          ]}
        />
      </Card>

      {/* 导出账单模态框 */}
      <Modal
        title={intl.formatMessage({
          id: "pages.billingDetail.exportBill",
          defaultMessage: "导出账单",
        })}
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
            {intl.formatMessage({
              id: "pages.billingDetail.exportModal.cancel",
              defaultMessage: "取消",
            })}
          </Button>,
          <Button
            key="export"
            type="primary"
            loading={exportLoading}
            onClick={() => {
              exportForm.submit();
            }}
          >
            {intl.formatMessage({
              id: "pages.billingDetail.exportModal.export",
              defaultMessage: "确定导出",
            })}
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
            label={intl.formatMessage({
              id: "pages.billingDetail.exportModal.dateRange",
              defaultMessage: "时间范围",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.billingDetail.exportModal.dateRange.required",
                  defaultMessage: "请选择时间范围",
                }),
              },
            ]}
          >
            <RangePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              placeholder={[
                intl.formatMessage({
                  id: "pages.billingDetail.startDate",
                  defaultMessage: "开始日期",
                }),
                intl.formatMessage({
                  id: "pages.billingDetail.endDate",
                  defaultMessage: "结束日期",
                }),
              ]}
            />
          </Form.Item>

          <Form.Item
            name="svc"
            label={intl.formatMessage({
              id: "pages.billingDetail.exportModal.service",
              defaultMessage: "服务类型",
            })}
            extra={intl.formatMessage({
              id: "pages.billingDetail.exportModal.service.extraInfo",
              defaultMessage: "不选择表示导出所有服务类型",
            })}
          >
            <Select
              mode="multiple"
              placeholder={intl.formatMessage({
                id: "pages.billingDetail.exportModal.service.placeholder",
                defaultMessage: "请选择服务类型",
              })}
              options={svcOptions}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="product"
            label={intl.formatMessage({
              id: "pages.billingDetail.exportModal.product",
              defaultMessage: "产品类型",
            })}
            extra={intl.formatMessage({
              id: "pages.billingDetail.exportModal.product.extraInfo",
              defaultMessage: "不选择表示导出所有产品类型",
            })}
          >
            <Select
              mode="multiple"
              placeholder={intl.formatMessage({
                id: "pages.billingDetail.exportModal.product.placeholder",
                defaultMessage: "请选择产品类型",
              })}
              options={productOptions}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 备注详情模态框 */}
      <Modal
        title={intl.formatMessage({
          id: "pages.billingDetail.viewRemark",
          defaultMessage: "备注详情",
        })}
        open={remarkModalVisible}
        onCancel={() => setRemarkModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setRemarkModalVisible(false)}>
            {intl.formatMessage({
              id: "pages.billingDetail.closeRemark",
              defaultMessage: "关闭",
            })}
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
