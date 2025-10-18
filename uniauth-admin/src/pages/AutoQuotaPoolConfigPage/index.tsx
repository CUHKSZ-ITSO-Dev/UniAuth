import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import Editor from "@monaco-editor/react";
import { getLocale, useIntl } from "@umijs/max";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Select,
  Switch,
  Typography,
} from "antd";
import cronstrue from "cronstrue/i18n";
import { useEffect, useRef, useState } from "react";
import {
  deleteConfigAutoConfig,
  getConfigAutoConfig,
  getConfigAutoConfigIsInUpnsCache,
  postConfigAutoConfig,
  putConfigAutoConfig,
} from "@/services/uniauthService/autoQuotaPoolConfig";
import { validateFiveFieldCron } from "@/utils/cron";

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
  // 模态框保存操作的加载状态
  const [modalSaving, setModalSaving] = useState(false);
  // 当前编辑的记录
  const [editingRecord, setEditingRecord] =
    useState<API.AutoQuotaPoolItem | null>(null);
  // 表单实例
  const [form] = Form.useForm();
  const [cronDescription, setCronDescription] = useState<string>("");
  const [cronError, setCronError] = useState<string>("");

  // UPN用户查询相关状态
  const [isUpnQueryModalVisible, setIsUpnQueryModalVisible] = useState(false);
  const [upnQueryLoading, setUpnQueryLoading] = useState(false);
  const [upnQueryResults, setUpnQueryResults] = useState<
    Array<{ upn: string; ruleName: string; result: boolean }>
  >([]);
  const [upnQueryForm] = Form.useForm();
  const [allRuleNames, setAllRuleNames] = useState<string[]>([]);

  // 组件加载时获取所有规则名称
  useEffect(() => {
    const fetchAllRuleNames = async () => {
      try {
        const response = await getConfigAutoConfig();
        if (response.items) {
          const ruleNames = response.items
            .map((item: API.AutoQuotaPoolItem) => item.ruleName)
            .filter((name): name is string => !!name); // 过滤掉undefined和null
          setAllRuleNames(ruleNames);
        }
      } catch (_error) {
        console.error("获取规则名称列表失败:", _error);
        // 静默失败，不影响主要功能
      }
    };

    fetchAllRuleNames();
  }, []);

  // 处理 cron 表达式校验和解析
  const handleCronChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value || value.trim() === "") {
      setCronDescription("");
      setCronError("");
      return;
    }

    // 首先验证是否为6位格式
    if (!validateFiveFieldCron(value)) {
      setCronError(
        intl.formatMessage({
          id: "pages.quotaPoolList.create.cronCycle.fiveFieldRequired",
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
      // 对于 filterGroup 和 defaultCasbinRules，保持原有的 JSON 处理逻辑
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
      defaultCasbinRules: formatJsonField(record.defaultCasbinRules),
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
          `Failed to parse cron expression: ${
            error instanceof Error ? error.message : String(error)
          }`,
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
    // 设置默认值，新规则默认启用，并确保JSON字段为空
    form.setFieldsValue({
      enabled: true,
      filterGroup: "",
      defaultCasbinRules: "",
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
      setModalSaving(true); // 设置保存状态为加载中

      // 处理表单数据，转换为API所需的格式
      const processedValues: Partial<API.AutoQuotaPoolItem> = {
        ruleName: values.ruleName,
        cronCycle: values.cronCycle,
        regularQuota: values.regularQuota ? parseFloat(values.regularQuota) : 0,
        priority: values.priority ? parseInt(values.priority, 10) : 0,
        enabled: values.enabled !== undefined ? values.enabled : true,
        description: values.description || "",
      };

      // 处理filterGroup JSON字段
      if (values.filterGroup) {
        try {
          processedValues.filterGroup = JSON.parse(values.filterGroup);
        } catch (_e) {
          message.error(
            intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.saveFailedInvalidFilterGroup",
            }),
          );
          setModalSaving(false); // 出错时重置保存状态
          return;
        }
      } else {
        // 如果没有提供filterGroup，不设置这个字段，让它保持undefined
      }

      // 处理defaultCasbinRules字段
      if (values.defaultCasbinRules) {
        try {
          processedValues.defaultCasbinRules = JSON.parse(
            values.defaultCasbinRules,
          );
        } catch (_e) {
          message.error(
            intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.saveFailedInvalidDefaultCasbinRules",
            }),
          );
          setModalSaving(false); // 出错时重置保存状态
          return;
        }
      } else {
        // 如果没有提供defaultCasbinRules，不设置这个字段，让它保持undefined
      }

      // 根据是否为编辑状态调用不同的API
      if (editingRecord) {
        // 编辑模式 - 构建编辑请求的数据结构
        const editData = {
          ...processedValues,
          // 确保包含编辑所需的关键字段
          ruleName: processedValues.ruleName || editingRecord.ruleName,
        };
        await putConfigAutoConfig(editData as any);
        message.success(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.updateSuccess" }),
        );
      } else {
        // 新建模式 - 构建新建请求的数据结构
        const createData = {
          ...processedValues,
          // 确保所有必需字段都存在
          ruleName: processedValues.ruleName,
          cronCycle: processedValues.cronCycle,
          regularQuota: processedValues.regularQuota,
        };
        await postConfigAutoConfig(createData as any);
        message.success(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.createSuccess" }),
        );
      }
      setIsModalVisible(false);
      setEditingRecord(null); // 清除编辑记录
      resetCronState(); // 重置 cron 状态
      actionRef.current?.reload();
    } catch (_error) {
      message.error(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.saveFailed" }),
      );
    } finally {
      setModalSaving(false); // 无论成功还是失败都重置保存状态
    }
  };

  /**
   * 模态框取消处理函数
   */
  const handleCancel = () => {
    setIsModalVisible(false);
    resetCronState(); // 重置 cron 状态
    setEditingRecord(null); // 清除编辑记录
    form.resetFields();
  };

  /**
   * UPN用户查询处理函数
   */
  const handleUpnQueryClick = (ruleName?: string) => {
    setIsUpnQueryModalVisible(true);
    setUpnQueryResults([]);
    upnQueryForm.resetFields();

    // 如果传入了规则名称，则预选该规则（多选模式）
    if (ruleName) {
      upnQueryForm.setFieldValue("ruleNames", [ruleName]);
    }
  };

  /**
   * 解析多个UPN输入
   * @param upnInput 用户输入的UPN字符串
   * @returns 解析后的UPN数组
   */
  const parseMultipleUpns = (upnInput: string): string[] => {
    if (!upnInput || upnInput.trim() === "") return [];

    // 支持逗号、分号、空格分隔
    const separators = /[,;\s]+/;
    return upnInput
      .split(separators)
      .map((upn) => upn.trim())
      .filter((upn) => upn !== "");
  };

  /**
   * UPN查询确认处理函数
   */
  const handleUpnQueryOk = async () => {
    try {
      const values = await upnQueryForm.validateFields();
      setUpnQueryLoading(true);

      // 清理之前的查询结果
      setUpnQueryResults([]);

      // 解析多个UPN
      const upns = parseMultipleUpns(values.upn);
      if (upns.length === 0) {
        message.error(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.upnRequired" }),
        );
        return;
      }

      // 获取选中的规则名称数组
      const ruleNames = values.ruleNames || [];
      if (ruleNames.length === 0) {
        message.error(
          intl.formatMessage({
            id: "pages.autoQuotaPoolConfig.ruleNameRequired",
          }),
        );
        return;
      }

      // 为每个UPN和每个规则名称的组合分别查询
      const queryPromises = upns.flatMap((upn) =>
        ruleNames.map(async (ruleName: string) => {
          try {
            const response = await getConfigAutoConfigIsInUpnsCache({
              upn: upn,
              ruleName: ruleName,
            });
            return { upn, ruleName, result: response.isInUpnsCache || false };
          } catch (error) {
            // 单个查询失败不影响其他查询
            console.error(`UPN查询失败: ${upn}, 规则: ${ruleName}`, error);
            return { upn, ruleName, result: false };
          }
        }),
      );

      const results = await Promise.all(queryPromises);
      setUpnQueryResults(results);

      message.success(
        intl.formatMessage({
          id: "pages.autoQuotaPoolConfig.upnQuerySuccess",
        }),
      );
    } catch (_error: any) {
      message.error(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.upnQueryFailed" }),
      );
      setUpnQueryResults([]);
    } finally {
      setUpnQueryLoading(false);
    }
  };

  /**
   * UPN查询取消处理函数
   */
  const handleUpnQueryCancel = () => {
    setIsUpnQueryModalVisible(false);
    setUpnQueryResults([]);
    upnQueryForm.resetFields();
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
      align: "right",
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
      align: "center",
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
      align: "right",
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
      fixed: "right",
      render: (_, record: API.AutoQuotaPoolItem) => (
        <div style={{ textAlign: "left" }}>
          <a key="edit" onClick={() => handleEditRecord(record)}>
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.edit" })}
          </a>
          <span style={{ margin: "0 8px" }} />
          <a key="query" onClick={() => handleUpnQueryClick(record.ruleName)}>
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.query" })}
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
          tableLayout="fixed"
          scroll={{ x: "max-content" }}
          search={{ labelWidth: "auto" }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewRecordClick}>
              {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.addNew" })}
            </Button>,
            <Button key="upnQuery" onClick={() => handleUpnQueryClick()}>
              {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.upnQuery" })}
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
        confirmLoading={modalSaving}
        okButtonProps={{ loading: modalSaving }}
        cancelButtonProps={{ disabled: modalSaving }}
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
            ]}
          >
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <Editor
                height="200px"
                defaultLanguage="json"
                theme="light"
                value={form.getFieldValue("filterGroup") || ""}
                onChange={(value) => {
                  form.setFieldValue("filterGroup", value || "");
                }}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  lineNumbers: "off",
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  overviewRulerLanes: 0,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                    useShadows: false,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                  },
                  tabSize: 2,
                  insertSpaces: true,
                }}
              />
            </div>
          </Form.Item>
          <Form.Item
            name="defaultCasbinRules"
            label={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.defaultCasbinRules",
            })}
          >
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <Editor
                height="201px"
                defaultLanguage="json"
                theme="light"
                value={form.getFieldValue("defaultCasbinRules") || ""}
                onChange={(value) => {
                  form.setFieldValue("defaultCasbinRules", value || "");
                }}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  lineNumbers: "off",
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  overviewRulerLanes: 0,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                    useShadows: false,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                  },
                  tabSize: 2,
                  insertSpaces: true,
                }}
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* UPN用户查询弹窗 */}
      <Modal
        title={intl.formatMessage({
          id: "pages.autoQuotaPoolConfig.upnQueryModalTitle",
        })}
        open={isUpnQueryModalVisible}
        onOk={handleUpnQueryOk}
        onCancel={handleUpnQueryCancel}
        width={600}
        destroyOnHidden
        forceRender
        maskClosable={false}
        confirmLoading={upnQueryLoading}
        okButtonProps={{ loading: upnQueryLoading }}
        cancelButtonProps={{ disabled: upnQueryLoading }}
      >
        <Form form={upnQueryForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="upn"
            label={intl.formatMessage({ id: "pages.autoQuotaPoolConfig.upn" })}
            extra={intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.upnMultipleHint",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.autoQuotaPoolConfig.upnRequired",
                }),
              },
            ]}
          >
            <Input.TextArea
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.upnMultiplePlaceholder",
              })}
              rows={3}
              style={{ resize: "vertical" }}
            />
          </Form.Item>

          <Form.Item
            name="ruleNames"
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
            <Select
              mode="multiple"
              showSearch
              allowClear
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.ruleNamePlaceholder",
              })}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={allRuleNames.map((ruleName) => ({
                value: ruleName,
                label: ruleName,
              }))}
            />
          </Form.Item>

          {upnQueryResults.length > 0 && (
            <Form.Item
              label={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.queryResult",
              })}
            >
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {upnQueryResults.map((item) => (
                  <div
                    key={item.upn}
                    style={{
                      padding: "8px 12px",
                      marginBottom: "8px",
                      backgroundColor: item.result ? "#f6ffed" : "#fff2e8",
                      border: "1px solid",
                      borderColor: item.result ? "#b7eb8f" : "#ffbb96",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{ color: item.result ? "#52c41a" : "#fa8c16" }}
                      >
                        {item.result
                          ? intl.formatMessage(
                              {
                                id: "pages.autoQuotaPoolConfig.upnInRule",
                              },
                              {
                                upn: <strong>{item.upn}</strong>,
                                ruleName: <strong>{item.ruleName}</strong>,
                              },
                            )
                          : intl.formatMessage(
                              {
                                id: "pages.autoQuotaPoolConfig.upnNotInRule",
                              },
                              {
                                upn: <strong>{item.upn}</strong>,
                                ruleName: <strong>{item.ruleName}</strong>,
                              },
                            )}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AutoQuotaPoolConfigPage;
