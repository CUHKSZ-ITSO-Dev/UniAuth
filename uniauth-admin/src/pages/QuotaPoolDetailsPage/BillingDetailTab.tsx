import {
  GridContent,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import { Card, Descriptions, Tag, Typography } from "antd";
import type { FC } from "react";

const { Text } = Typography;

const BillingDetailTab: FC = () => {
  const billingRecordsColumns: ProColumns<any>[] = [
    {
      title: "时间",
      dataIndex: "date",
      valueType: "dateTime",
      search: false,
      ellipsis: true,
    },
    {
      title: "类型",
      dataIndex: "type",
      valueType: "select",
      valueEnum: {
        consumption: { text: "消费", status: "Error" },
        refund: { text: "退款", status: "Success" },
        recharge: { text: "充值", status: "Processing" },
      },
      ellipsis: true,
    },
    {
      title: "金额",
      dataIndex: "amount",
      valueType: "money",
      search: false,
      render: (_, record) => (
        <Text type={record.type === "consumption" ? "danger" : "success"}>
          {record.type === "consumption" ? "-" : "+"}${record.amount}
        </Text>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      valueType: "text",
      ellipsis: true,
      search: false,
    },
    {
      title: "状态",
      dataIndex: "status",
      valueType: "select",
      valueEnum: {
        completed: { text: "已完成", status: "Success" },
        pending: { text: "处理中", status: "Processing" },
        failed: { text: "失败", status: "Error" },
      },
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          completed: "green",
          pending: "orange",
          failed: "red",
        };
        return (
          <Tag color={colorMap[record.status] || "default"}>
            {record.statusText}
          </Tag>
        );
      },
    },
  ];

  const billingRecordsDataRequest = async (params: any) => {
    // TODO: 替换为实际请求
    let example_data = [
      {
        id: 1,
        date: "2025-09-20 10:30:00",
        type: "consumption",
        amount: 25.5,
        description: "API调用费用",
        status: "completed",
        statusText: "已完成",
      },
      {
        id: 2,
        date: "2025-09-19 14:15:00",
        type: "consumption",
        amount: 18.2,
        description: "模型使用费用",
        status: "completed",
        statusText: "已完成",
      },
      {
        id: 3,
        date: "2025-09-18 09:45:00",
        type: "recharge",
        amount: 100.0,
        description: "账户充值",
        status: "completed",
        statusText: "已完成",
      },
      {
        id: 4,
        date: "2025-09-17 16:20:00",
        type: "consumption",
        amount: 32.8,
        description: "数据处理费用",
        status: "completed",
        statusText: "已完成",
      },
      {
        id: 5,
        date: "2025-09-16 11:10:00",
        type: "refund",
        amount: 5.6,
        description: "服务退款",
        status: "completed",
        statusText: "已完成",
      },
    ];

    // 简单的筛选逻辑
    if (params.type) {
      example_data = example_data.filter((item) => item.type === params.type);
    }
    if (params.status) {
      example_data = example_data.filter(
        (item) => item.status === params.status,
      );
    }

    return {
      data: example_data,
      success: true,
      total: example_data.length,
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
        <Descriptions column={2}>
          <Descriptions.Item label="本月消费">
            <Text type="danger">$120.00</Text>
          </Descriptions.Item>
          <Descriptions.Item label="上月消费">
            <Text>$98.50</Text>
          </Descriptions.Item>
          <Descriptions.Item label="累计消费">
            <Text>$1,256.30</Text>
          </Descriptions.Item>
          <Descriptions.Item label="平均日消费">
            <Text>$4.00</Text>
          </Descriptions.Item>
          <Descriptions.Item label="本月充值">
            <Text type="success">$200.00</Text>
          </Descriptions.Item>
          <Descriptions.Item label="账户余额">
            <Text strong>$496.00</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="消费明细"
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <ProTable
          columns={billingRecordsColumns}
          rowKey="id"
          search={{ labelWidth: "auto" }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          request={billingRecordsDataRequest}
          dateFormatter="string"
          headerTitle="账单记录"
          toolBarRender={() => []}
        />
      </Card>

      <Card
        title="使用统计"
        style={{
          marginBottom: 24,
        }}
        variant="borderless"
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>使用统计图表功能开发中...</p>
          <p>此处将显示消费趋势图、使用量分析等可视化内容</p>
        </div>
      </Card>
    </GridContent>
  );
};

export default BillingDetailTab;
