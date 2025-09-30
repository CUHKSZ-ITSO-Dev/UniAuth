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
  Radio,
  Space,
  Switch,
  Table,
  Typography,
} from "antd";
import cronstrue from "cronstrue/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tableRef = useRef<ActionType | null>(null);
  const formRef = useRef<any>(null);
  const [cronDescription, setCronDescription] = useState<string>("");
  const [cronError, setCronError] = useState<string>("");

  // 使用 useMemo 确保初始参数响应 URL 变化
  const initialSearchParams = useMemo(() => {
    const personal = searchParams.get("personal") || undefined;
    const disabled = searchParams.get("disabled") || undefined;
    const current = parseInt(searchParams.get("current") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    return {
      personal,
      disabled,
      current,
      pageSize,
    };
  }, [searchParams]);

  // 更新URL参数
  const updateURLParams = (params: {
    personal?: string;
    disabled?: string;
    current?: number;
    pageSize?: number;
  }) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (params.personal !== undefined) {
      if (params.personal) {
        newSearchParams.set("personal", params.personal);
      } else {
        newSearchParams.delete("personal");
      }
    }

    if (params.disabled !== undefined) {
      if (params.disabled) {
        newSearchParams.set("disabled", params.disabled);
      } else {
        newSearchParams.delete("disabled");
      }
    }

    if (params.current !== undefined && params.current > 1) {
      newSearchParams.set("current", params.current.toString());
    } else {
      newSearchParams.delete("current");
    }

    if (params.pageSize !== undefined && params.pageSize !== 10) {
      newSearchParams.set("pageSize", params.pageSize.toString());
    } else {
      newSearchParams.delete("pageSize");
    }

    setSearchParams(newSearchParams);
  };

  // 监听URL参数变化，同步更新表单和表格
  useEffect(() => {
    if (formRef.current) {
      // 当URL参数变化时，重置表单到新的初始值
      formRef.current.setFieldsValue(initialSearchParams);
    }

    if (tableRef.current) {
      // 重新加载表格以反映新的搜索条件
      tableRef.current.reload();
    }
  }, [initialSearchParams]);

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
        if (initialSearchParams.personal)
          linkParams.set("from_personal", initialSearchParams.personal);
        if (initialSearchParams.disabled)
          linkParams.set("from_disabled", initialSearchParams.disabled);
        if (initialSearchParams.current > 1)
          linkParams.set(
            "from_current",
            initialSearchParams.current.toString(),
          );
        if (initialSearchParams.pageSize !== 10)
          linkParams.set(
            "from_pageSize",
            initialSearchParams.pageSize.toString(),
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

  // 处理 cron 表达式校验和解析
  const handleCronChange = (value: string) => {
    if (!value || value.trim() === "") {
      setCronDescription("");
      setCronError("");
      return;
    }

    try {
      // 尝试解析 cron 表达式
      const description = cronstrue.toString(value, {
        throwExceptionOnParseError: true,
        locale: "zh_CN", // 使用中文
        use24HourTimeFormat: true,
        verbose: true,
      });
      setCronDescription(description);
      setCronError("");
    } catch (error) {
      setCronError("Cron 表达式格式不正确，请检查语法");
      setCronDescription("");
    }
  };

  // 删除配额池
  async function handleDelete(record: any) {
    try {
      setLoading(true);
      const res = await deleteQuotaPool({
        quotaPoolName: record.quotaPoolName,
      });
      if (res?.ok) {
        message.success("删除配额池成功");
        tableRef.current?.reload();
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

  // 新建配额池
  function handleNewQuotaPoolClick() {
    form.resetFields();
    setCronDescription("");
    setCronError("");
    setIsModalOpen(true);
  }

  // 批量重置配额池
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
      tableRef.current?.reload();
    } catch (error) {
      console.error("批量重置配额池失败:", error);
      message.error("批量重置配额池失败");
    } finally {
      setLoading(false);
    }
  }

  // 批量禁用配额池
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
        tableRef.current?.reload();
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

  // 确认新建配额池
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
        disabled: !values.enabled,
      });

      if (res?.ok) {
        message.success("新建配额池成功");
        setIsModalOpen(false);
        form.resetFields();
        setCronDescription("");
        setCronError("");
        tableRef.current?.reload();
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

  // 取消新建配额池
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setCronDescription("");
    setCronError("");
  };

  // 表格数据请求
  const quotaPoolListRequest = async (params: any) => {
    const { current, pageSize, personal, disabled } = params;

    // 更新URL参数
    updateURLParams({
      personal: personal || "",
      disabled: disabled || "",
      current: current || 1,
      pageSize: pageSize || 10,
    });

    try {
      const res = await getQuotaPool({
        quotaPoolName: params.quotaPoolName,
        page: params.current || 1,
        pageSize: params.pageSize || 10,
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

      // 按配额池类型过滤 - 只有当 personal 有值且不为空字符串时才进行过滤
      if (
        params.personal !== undefined &&
        params.personal !== "" &&
        params.personal !== null
      ) {
        const isPersonal =
          params.personal === "true" || params.personal === true;
        data = data.filter((item) => item.personal === isPersonal);
      }

      // 按启用状态过滤 - 只有当 disabled 有值且不为空字符串时才进行过滤
      if (
        params.disabled !== undefined &&
        params.disabled !== "" &&
        params.disabled !== null
      ) {
        const isDisabled =
          params.disabled === "true" || params.disabled === true;
        data = data.filter((item) => item.disabled === isDisabled);
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
          onReset={() => {
            // 清空URL参数
            updateURLParams({
              personal: "",
              disabled: "",
              current: 1,
              pageSize: 10,
            });
            // 手动重置表单到空值
            if (formRef.current) {
              formRef.current.setFieldsValue({
                personal: undefined,
                disabled: undefined,
              });
            }
            // 调用表格重置
            if (tableRef.current) {
              tableRef.current.reset?.();
            }
          }}
          columns={columns}
          actionRef={tableRef}
          rowKey="quotaPoolName"
          search={{
            labelWidth: "auto",
            defaultCollapsed: false,
            collapseRender: false,
            filterType: "query",
            span: 6,
            searchText: "查询",
            resetText: "重置",
          }}
          // 从URL参数设置初始表单值 - 过滤掉 undefined 值
          form={{
            initialValues: Object.fromEntries(
              Object.entries(initialSearchParams).filter(
                ([_, value]) => value !== undefined,
              ),
            ),
          }}
          formRef={formRef}
          // 设置初始分页参数
          pagination={{
            current: initialSearchParams.current,
            pageSize: initialSearchParams.pageSize,
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
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
            enabled: true, // 改为 enabled，默认启用
            personal: false,
            regularQuota: 10,
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
            rules={[
              { required: true, message: "请输入刷新周期" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    cronstrue.toString(value, {
                      throwExceptionOnParseError: true,
                    });
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error("Cron 表达式格式不正确"));
                  }
                },
              },
            ]}
            validateStatus={
              cronError ? "error" : cronDescription ? "success" : ""
            }
            help={
              cronError ? (
                <span style={{ color: "#ff4d4f" }}>{cronError}</span>
              ) : cronDescription ? (
                <span style={{ color: "#52c41a" }}>
                  执行时间：{cronDescription}
                </span>
              ) : null
            }
          >
            <Input
              placeholder="请输入标准 Cron 表达式，例如：0 0 3 * *"
              onChange={(e) => handleCronChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="定期配额"
            name="regularQuota"
            rules={[{ required: true, message: "请输入定期配额" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="请输入定期配额，例如：10"
            />
          </Form.Item>

          <Form.Item label="初始加油包" name="extraQuota">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="请输入初始加油包，默认为0"
            />
          </Form.Item>

          <Form.Item label="配额池类型" name="personal">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={false}>共享配额池</Radio.Button>
              <Radio.Button value={true}>个人配额池</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default QuotaPoolListPage;
