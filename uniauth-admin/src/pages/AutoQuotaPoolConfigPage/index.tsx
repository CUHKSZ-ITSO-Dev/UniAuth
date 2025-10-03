import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { getLocale, useIntl } from "@umijs/max";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Switch,
  Typography,
} from "antd";
import cronstrue from "cronstrue/i18n";
import { useRef, useState } from "react";
import {
  deleteConfigAutoConfig,
  getConfigAutoConfig,
  postConfigAutoConfig,
  putConfigAutoConfig,
} from "@/services/uniauthService/autoQuotaPoolConfig";
import { validateSixFieldCron } from "@/utils/cron";

// UI组件解构
const { Title, Text } = Typography;

/**
 * 自动配额池配置页面组件
 * 提供自动配额池规则的增删改查功能
 */
const AutoQuotaPoolConfigPage: React.FC = () => {
  // 国际化工具
  const intl = useIntl();
  // 表格操作引用
  const actionRef = useRef<ActionType>(null);
  // 控制模态框显示状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 当前编辑的记录
  const [editingRecord, setEditingRecord] =
    useState<API.AutoQuotaPoolItem | null>(null);
  // 表单实例
  const [form] = Form.useForm();
  const [cronDescription, setCronDescription] = useState<string>("");
  const [cronError, setCronError] = useState<string>("");

  // 处理 cron 表达式校验和解析
  const handleCronChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value || value.trim() === "") {
      setCronDescription("");
      setCronError("");
      return;
    }

    // 首先验证是否为6位格式
    if (!validateSixFieldCron(value)) {
      setCronError(
        intl.formatMessage({
          id: "pages.quotaPoolList.create.cronCycle.sixFieldRequired",
          defaultMessage: "Cron 表达式必须为6位格式（秒 分 时 日 月 周）",
        }),
      );
      setCronDescription("");
      return;
    }

    try {
      // 解析 cron 表达式
      const description = cronstrue.toString(value, {
        throwExceptionOnParseError: true,
        locale: getLocale() === "zh-CN" ? "zh_CN" : "en_US",
        use24HourTimeFormat: true,
        verbose: true,
      });
      setCronDescription(description);
      setCronError("");
    } catch (_error) {
      setCronError(
        intl.formatMessage({
          id: "pages.quotaPoolList.create.cronCycle.invalid",
          defaultMessage: "Cron 表达式格式不正确",
        }),
      );
      setCronDescription("");
    }
  };

  const resetCronState = () => {
    setCronDescription("");
    setCronError("");
  };

  /**
   * 编辑记录处理函数
   * @param record 要编辑的记录
   */
  const handleEditRecord = (record: API.AutoQuotaPoolItem) => {
    resetCronState();
    setEditingRecord(record);

    // 安全地处理字段的序列化
    const formatJsonField = (field: any): string => {
      if (!field) return "";
      // 对于 upnsCache，直接返回字符串值
      if (typeof field === "string") {
        return field;
      }
      // 对于 filterGroup，保持原有的 JSON 处理逻辑
      try {
        return JSON.stringify(field, null, 2);
      } catch (_e) {
        return typeof field === "object"
          ? JSON.stringify(field)
          : String(field);
      }
    };

    form.setFieldsValue({
      ...record,
      filterGroup: formatJsonField(record.filterGroup),
      upnsCache: formatJsonField(record.upnsCache),
    });

    // 如果记录中有 cronCycle，尝试解析并设置描述
    if (record.cronCycle) {
      try {
        const description = cronstrue.toString(record.cronCycle, {
          throwExceptionOnParseError: true,
          locale: getLocale() === "zh-CN" ? "zh_CN" : "en_US",
          use24HourTimeFormat: true,
          verbose: true,
        });
        setCronDescription(description);
      } catch (error) {
        message.error(
          `Failed to parse cron expression: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    setIsModalVisible(true);
  };

  /**
   * 删除记录处理函数
   * @param record 要删除的记录
   */
  const handleDelete = async (record: API.AutoQuotaPoolItem) => {
    try {
      // 调用删除API，通过ruleName参数指定要删除的记录
      await deleteConfigAutoConfig({ ruleName: record.ruleName || "" });
      message.success(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.deleteSuccess" }),
      );
      // 刷新表格数据
      actionRef.current?.reload();
    } catch (_error: any) {
      message.error(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.deleteFailed" }),
      );
    }
  };

  /**
   * 新建配置处理函数
   */
  const handleNewRecordClick = () => {
    resetCronState();
    setEditingRecord(null);
    form.resetFields();
    // 设置默认值，新规则默认启用
    form.setFieldsValue({
      enabled: true,
    });
    setIsModalVisible(true);
  };

  // 本地定义RequestData类型
  interface RequestData<T> {
    data?: T[];
    items?: T[];
    total?: number;
    success?: boolean;
  }

  /**
   * 模态框确认处理函数
   */
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        // 编辑模式
        await putConfigAutoConfig({
          ...values,
          id: editingRecord.id,
        });
        message.success(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.updateSuccess" }),
        );
      } else {
        // 新建模式
        await postConfigAutoConfig(values);
        message.success(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.createSuccess" }),
        );
      }
      setIsModalVisible(false);
      resetCronState(); // 重置 cron 状态
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.saveFailed" }),
      );
    }
  };

  /**
   * 模态框取消处理函数
   */
  const handleCancel = () => {
    setIsModalVisible(false);
    resetCronState(); // 重置 cron 状态
    form.resetFields();
  };

  /**
   * 获取配置列表请求函数
   * @param params 查询参数
   */
  const configListRequest = async (
    params: any,
  ): Promise<Partial<RequestData<API.AutoQuotaPoolItem>>> => {
    try {
      // 调用API获取自动配额池规则列表
      const response = await getConfigAutoConfig(params);

      if (response.items) {
        // 根据查询参数过滤数据
        let data = response.items || [];

        // 规则名称和规则说明的混合搜索
        if (params.ruleName) {
          data = data.filter(
            (item: API.AutoQuotaPoolItem) =>
              item.ruleName?.includes(params.ruleName) ||
              item.description?.includes(params.ruleName),
          );
        }

        // 是否启用过滤 - 处理字符串和布尔值类型匹配问题
        if (params.enabled !== undefined) {
          const searchEnabled =
            params.enabled === "true" || params.enabled === true;
          data = data.filter(
            (item: API.AutoQuotaPoolItem) => item.enabled === searchEnabled,
          );
        }

        return {
          data,
          success: true,
          total: data.length,
        };
      } else {
        return {
          data: [],
          success: false,
          total: 0,
        };
      }
    } catch (_error: any) {
      message.error(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.fetchFailed" }),
      );
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<API.AutoQuotaPoolItem>[] = [
    {
      title: intl.formatMessage({ id: "pages.autoQuotaPoolConfig.ruleName" }),
      dataIndex: "ruleName",
      valueType: "text",
      search: true,
    },
    {
      title: intl.formatMessage({
        id: "pages.autoQuotaPoolConfig.descriptionLabel",
      }),
      dataIndex: "description",
      valueType: "text",
      search: false,
      render: (_, record: API.AutoQuotaPoolItem) =>
        record.description || (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.notSet" })}
          </Text>
        ),
    },
    {
      title: intl.formatMessage({ id: "pages.autoQuotaPoolConfig.cronCycle" }),
      dataIndex: "cronCycle",
      valueType: "text",
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.autoQuotaPoolConfig.regularQuota",
      }),
      dataIndex: "regularQuota",
      valueType: "digit",
      search: false,
      render: (_, record: API.AutoQuotaPoolItem) =>
        record.regularQuota !== undefined ? (
          record.regularQuota.toString()
        ) : (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.notSet" })}
          </Text>
        ),
    },
    {
      title: intl.formatMessage({ id: "pages.autoQuotaPoolConfig.enabled" }),
      dataIndex: "enabled",
      valueType: "select",
      search: true,
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: "pages.autoQuotaPoolConfig.enabledStatus",
          }),
          status: "Success",
        },
        false: {
          text: intl.formatMessage({
            id: "pages.autoQuotaPoolConfig.disabledStatus",
          }),
          status: "Default",
        },
      },
      render: (_, record: API.AutoQuotaPoolItem) =>
        record.enabled
          ? intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.enabledStatus",
            })
          : intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.disabledStatus",
            }),
    },
    {
      title: intl.formatMessage({ id: "pages.autoQuotaPoolConfig.priority" }),
      dataIndex: "priority",
      valueType: "digit",
      search: false,
      render: (_, record: API.AutoQuotaPoolItem) =>
        record.priority || (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.notSet" })}
          </Text>
        ),
    },
    {
      title: intl.formatMessage({ id: "pages.autoQuotaPoolConfig.createdAt" }),
      dataIndex: "createdAt",
      valueType: "dateTime",
      search: false,
      hideInTable: true,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
      render: (_, record: API.AutoQuotaPoolItem) => {
        if (record.createdAt) {
          const date = new Date(record.createdAt);
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString("zh-CN");
          }
        }
        return (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.notSet" })}
          </Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "pages.autoQuotaPoolConfig.updatedAt" }),
      dataIndex: "updatedAt",
      valueType: "dateTime",
      search: false,
      hideInTable: true,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
      render: (_, record: API.AutoQuotaPoolItem) => {
        if (record.updatedAt) {
          const date = new Date(record.updatedAt);
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString("zh-CN");
          }
        }
        return (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.notSet" })}
          </Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "pages.autoQuotaPoolConfig.actions" }),
      valueType: "option",
      ellipsis: true,
      render: (_, record: API.AutoQuotaPoolItem) => (
        <div style={{ textAlign: "left" }}>
          <a key="edit" onClick={() => handleEditRecord(record)}>
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.edit" })}
          </a>
          <span style={{ margin: "0 8px" }} />
          <Popconfirm
            key="delete"
            title={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.deleteConfirm",
            })}
            onConfirm={() => handleDelete(record)}
          >
            <a style={{ color: "red" }}>
              {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.delete" })}
            </a>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>
          {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.title" })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.description" })}
        </Text>
        {/* 表格组件 */}
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="ruleName"
          search={{ labelWidth: "auto" }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewRecordClick}>
              {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.addNew" })}
            </Button>,
          ]}
          request={configListRequest}
        />
      </ProCard>

      {/* 编辑/新建模态框 */}
      <Modal
        title={
          editingRecord
            ? intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.editModalTitle",
              })
            : intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.addModalTitle",
              })
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        destroyOnHidden
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="ruleName"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.ruleName",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.autoQuotaPoolConfig.ruleNameRequired",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.ruleNamePlaceholder",
              })}
              disabled={!!editingRecord}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.description",
            })}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.descriptionPlaceholder",
              })}
            />
          </Form.Item>

          <Form.Item
            name="cronCycle"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.cronCycle",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.autoQuotaPoolConfig.cronCycleRequired",
                }),
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
                  {intl.formatMessage(
                    { id: "pages.quotaPoolList.create.cronCycle.help" },
                    { description: cronDescription },
                  )}
                </span>
              ) : (
                ""
              )
            }
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.cronCyclePlaceholder",
              })}
              onChange={handleCronChange}
            />
          </Form.Item>

          <Form.Item
            name="regularQuota"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.regularQuota",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.autoQuotaPoolConfig.regularQuotaRequired",
                }),
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.regularQuotaPlaceholder",
              })}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="enabled"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.enabled",
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="priority"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.priority",
            })}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.priorityPlaceholder",
              })}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="filterGroup"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.filterGroup",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.autoQuotaPoolConfig.filterGroupRequired",
                }),
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (_e) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: "pages.autoQuotaPoolConfig.jsonInvalid",
                        }),
                      ),
                    );
                  }
                },
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.filterGroupPlaceholder",
              })}
            />
          </Form.Item>

          <Form.Item
            name="upnsCache"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.upnsCache",
            })}
          >
            <Input.TextArea
              rows={4}
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.upnsCachePlaceholder",
              })}
              readOnly
              style={{ backgroundColor: "#f5f5f5", color: "#000" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AutoQuotaPoolConfigPage;
