import {
  GridContent,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { Card, Descriptions, Tag, Typography } from "antd";
import { type FC, useEffect, useState } from "react";
import { postBillingAdminGet } from "@/services/uniauthService/admin";

const { Text } = Typography;

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

// 从 props 接收配额池名称
interface BillingDetailTabProps {
  quotaPoolName?: string;
}

const BillingDetailTab: FC<BillingDetailTabProps> = ({
  quotaPoolName = "student_pool",
}) => {
  const [statistics, setStatistics] = useState({
    currentMonthCost: 0,
    lastMonthCost: 0,
    totalCost: 0,
    avgDailyCost: 0,
    recordCount: 0,
  });

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
    }
  };

  // 页面加载时获取统计数据
  useState(() => {
    fetchStatistics();
  });
  const billingRecordsColumns: ProColumns<BillingRecord>[] = [
    {
      title: "时间",
      dataIndex: "created_at",
      valueType: "dateTime",
      search: false,
      ellipsis: true,
      width: 160,
    },
    {
      title: "用户",
      dataIndex: "upn",
      valueType: "text",
      search: true,
      ellipsis: true,
      width: 200,
    },
    {
      title: "服务",
      dataIndex: "svc",
      valueType: "select",
      search: true,
      ellipsis: true,
      width: 120,
      valueEnum: {
        chat: { text: "聊天服务", status: "Default" },
        voice: { text: "语音服务", status: "Processing" },
        image: { text: "图像服务", status: "Success" },
      },
    },
    {
      title: "产品",
      dataIndex: "product",
      valueType: "select",
      search: true,
      ellipsis: true,
      width: 120,
      valueEnum: {
        gpt4: { text: "GPT-4", status: "Default" },
        gpt35: { text: "GPT-3.5", status: "Processing" },
        claude: { text: "Claude", status: "Success" },
      },
    },
    {
      title: "费用",
      dataIndex: "cost",
      valueType: "money",
      search: false,
      width: 100,
      render: (_, record) => (
        <Text type="danger">${Number(record.cost).toFixed(4)}</Text>
      ),
    },
    {
      title: "计费方案",
      dataIndex: "plan",
      valueType: "text",
      search: true,
      ellipsis: true,
      width: 120,
    },
    {
      title: "来源",
      dataIndex: "source",
      valueType: "text",
      search: false,
      ellipsis: true,
      width: 120,
      render: (_, record) => <Tag color="blue">{record.source}</Tag>,
    },
    {
      title: "备注",
      dataIndex: "remark",
      valueType: "text",
      search: false,
      ellipsis: true,
      width: 150,
      render: (_, record) => {
        if (!record.remark) return "-";
        try {
          const remarkObj =
            typeof record.remark === "string"
              ? JSON.parse(record.remark)
              : record.remark;
          return <Text ellipsis>{JSON.stringify(remarkObj)}</Text>;
        } catch {
          return <Text ellipsis>{String(record.remark)}</Text>;
        }
      },
    },
  ];

  const billingRecordsDataRequest = async (params: any) => {
    try {
      // 构建API请求参数
      const requestParams = {
        quotaPools: [quotaPoolName],
        svc: params.svc ? [params.svc] : [],
        product: params.product ? [params.product] : [],
        startTime: params.created_at?.[0] || "2024-01-01",
        endTime: params.created_at?.[1] || "2025-12-31",
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
        />
      </Card>
    </GridContent>
  );
};

export default BillingDetailTab;
