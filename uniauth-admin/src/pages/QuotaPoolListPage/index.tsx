import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { Link, useSearchParams } from "@umijs/max";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Space,
  Switch,
  Table,
  Typography,
} from "antd";
import { useMemo, useRef, useState } from "react";
import {
  postQuotaPoolAdminBatchModify,
  postQuotaPoolAdminResetBalance,
} from "@/services/uniauthService/admin";
import {
  deleteQuotaPool,
  getQuotaPool,
  postQuotaPool,
} from "@/services/uniauthService/quotaPool";

const { Title, Text } = Typography;

const QuotaPoolListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // 获取当前的搜索参数
  const currentSearchParams = useMemo(() => {
    const personal = searchParams.get("personal") || "";
    const disabled = searchParams.get("disabled") || "";
    const current = parseInt(searchParams.get("current") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    return {
      personal,
      disabled,
      current,
      pageSize,
    };
  }, [searchParams]);

  const columns: ProColumns<any>[] = [
    {
      title: "配额池名称",
      dataIndex: "quotaPoolName",
      valueType: "text",
      search: false,
    },
    {
      title: "配额",
      dataIndex: "regularQuota",
      valueType: "digit",
      search: false,
      render: (_, record) => {
        return record.regularQuota ? record.regularQuota.toString() : "-";
      },
    },
    {
      title: "余额",
      dataIndex: "remainingQuota",
      valueType: "digit",
      search: false,
      render: (_, record) => {
        return record.remainingQuota ? record.remainingQuota.toString() : "-";
      },
    },
    {
      title: "配额池类型",
      dataIndex: "personal",
      valueType: "select",
      search: true,
      valueEnum: {
        true: { text: "个人配额池" },
        false: { text: "共享配额池" },
      },
      render: (_, record) => {
        return record.personal ? "个人配额池" : "共享配额池";
      },
    },
    {
      title: "启用状态",
      dataIndex: "disabled",
      valueType: "select",
      search: true,
      valueEnum: {
        false: { text: "启用" },
        true: { text: "禁用" },
      },
      render: (_, record) => {
        return record.disabled ? "禁用" : "启用";
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      valueType: "dateTime",
      search: false,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
    },
    {
      title: "操作",
      valueType: "option",
      width: 200,
      ellipsis: true,
      render: (_, record) => {
        // 获取当前的搜索参数并添加到详情页链接中
        const linkParams = new URLSearchParams();
        if (currentSearchParams.personal)
          linkParams.set("from_personal", currentSearchParams.personal);
        if (currentSearchParams.disabled)
          linkParams.set("from_disabled", currentSearchParams.disabled);
        if (currentSearchParams.current > 1)
          linkParams.set(
            "from_current",
            currentSearchParams.current.toString(),
          );
        if (currentSearchParams.pageSize !== 20)
          linkParams.set(
            "from_pageSize",
            currentSearchParams.pageSize.toString(),
          );

        const queryString = linkParams.toString();
        const detailUrl = `/quota-pool-list/${record.quotaPoolName}${
          queryString ? `?${queryString}` : ""
        }`;

        return (
          <div style={{ textAlign: "center" }}>
            <Link to={detailUrl} key="detail">
              详情
            </Link>
            <span style={{ margin: "0 8px" }} />
            <Popconfirm
              key="delete"
              title="确定要删除该配额池吗？"
              onConfirm={() => handleDelete(record)}
            >
              <a style={{ color: "red" }}>删除</a>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  async function handleDelete(record: any) {
    try {
      setLoading(true);
      const res = await deleteQuotaPool({
        quotaPoolName: record.quotaPoolName,
      });
      if (res?.ok) {
        message.success("删除配额池成功");
        actionRef.current?.reload();
      } else {
        message.error("删除配额池失败");
      }
    } catch (error) {
      console.error("删除配额池失败:", error);
      message.error("删除配额池失败");
    } finally {
      setLoading(false);
    }
  }

  function handleNewQuotaPoolClick() {
    form.resetFields();
    setIsModalOpen(true);
  }

  async function handleBatchResetClick(selectedRows: any[]) {
    if (!selectedRows || selectedRows.length === 0) {
      message.warning("请先选择要重置的配额池");
      return;
    }

    try {
      setLoading(true);
      const promises = selectedRows.map((row) =>
        postQuotaPoolAdminResetBalance({
          quotaPool: row.quotaPoolName,
        }),
      );

      await Promise.all(promises);
      message.success("批量重置配额池成功");
      actionRef.current?.reload();
    } catch (error) {
      console.error("批量重置配额池失败:", error);
      message.error("批量重置配额池失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchDisableClick(selectedRows: any[]) {
    if (!selectedRows || selectedRows.length === 0) {
      message.warning("请先选择要禁用的配额池");
      return;
    }

    try {
      setLoading(true);
      const quotaPools = selectedRows.map((row) => row.quotaPoolName);
      const res = await postQuotaPoolAdminBatchModify({
        quotaPools,
        field: "disabled",
        value: true,
      });

      if (res?.ok) {
        message.success("批量禁用配额池成功");
        actionRef.current?.reload();
      } else {
        message.error("批量禁用配额池失败");
      }
    } catch (error) {
      console.error("批量禁用配额池失败:", error);
      message.error("批量禁用配额池失败");
    } finally {
      setLoading(false);
    }
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const res = await postQuotaPool({
        quotaPoolName: values.quotaPoolName,
        cronCycle: values.cronCycle,
        regularQuota: values.regularQuota,
        extraQuota: values.extraQuota || 0,
        personal: values.personal,
        disabled: values.disabled,
      });

      if (res?.ok) {
        message.success("新建配额池成功");
        setIsModalOpen(false);
        form.resetFields();
        actionRef.current?.reload();
      } else {
        message.error("新建配额池失败");
      }
    } catch (error: any) {
      if (error?.errorFields) {
        // 表单验证错误，不显示错误消息
        return;
      }
      console.error("新建配额池失败:", error);
      message.error("新建配额池失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const quotaPoolListRequest = async (params: any) => {
    try {
      const res = await getQuotaPool({
        quotaPoolName: params.quotaPoolName,
        page: params.current || 1,
        pageSize: params.pageSize || 20,
      });

      if (!res || !res.items) {
        return {
          data: [],
          success: false,
          total: 0,
        };
      }

      // 根据搜索条件过滤数据
      let data = res.items;

      // 按配额池类型过滤
      if (params.personal !== undefined) {
        data = data.filter(
          (item) =>
            item.personal ===
            (params.personal === "true" || params.personal === true),
        );
      }

      // 按启用状态过滤
      if (params.disabled !== undefined) {
        data = data.filter(
          (item) =>
            item.disabled ===
            (params.disabled === "true" || params.disabled === true),
        );
      }

      return {
        data,
        success: true,
        total: res.total || data.length,
      };
    } catch (error) {
      console.error("获取配额池列表失败:", error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>配额池列表</Title>
        <Text type="secondary">
          管理系统中的所有配额池及其配置，查看使用情况、获取账单等
        </Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="quotaPoolName"
          search={{ labelWidth: "auto" }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          }}
          tableAlertRender={({
            selectedRowKeys,
            selectedRows,
            onCleanSelected,
          }) => {
            console.log(selectedRowKeys, selectedRows);
            return (
              <Space size={24}>
                <span>
                  已选 {selectedRowKeys.length} 项
                  <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                    取消选择
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={({ selectedRows }) => {
            return (
              <Space size={16}>
                <a onClick={() => handleBatchResetClick(selectedRows)}>
                  批量重置
                </a>
                <a onClick={() => handleBatchDisableClick(selectedRows)}>
                  批量禁用
                </a>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewQuotaPoolClick}>
              添加新的配额池
            </Button>,
          ]}
          request={quotaPoolListRequest}
        />
      </ProCard>

      <Modal
        title="新建配额池"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            disabled: false,
            personal: false,
            regularQuota: 1000,
            extraQuota: 0,
          }}
        >
          <Form.Item
            label="配额池名称"
            name="quotaPoolName"
            rules={[{ required: true, message: "请输入配额池名称" }]}
          >
            <Input placeholder="请输入配额池名称，例如：itso-deep-research-vip" />
          </Form.Item>

          <Form.Item
            label="刷新周期（Cron表达式）"
            name="cronCycle"
            rules={[{ required: true, message: "请输入刷新周期" }]}
          >
            <Input placeholder="请输入标准 Cron 表达式，例如：0 0 3 * *" />
          </Form.Item>

          <Form.Item
            label="定期配额"
            name="regularQuota"
            rules={[{ required: true, message: "请输入定期配额" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="请输入定期配额，例如：1000"
            />
          </Form.Item>

          <Form.Item label="初始加油包" name="extraQuota">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="请输入初始加油包，默认为0"
            />
          </Form.Item>

          <Form.Item label="配额池类型" name="personal" valuePropName="checked">
            <Switch
              checkedChildren="个人配额池"
              unCheckedChildren="共享配额池"
            />
          </Form.Item>

          <Form.Item label="启用状态" name="disabled" valuePropName="checked">
            <Switch checkedChildren="禁用" unCheckedChildren="启用" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default QuotaPoolListPage;
