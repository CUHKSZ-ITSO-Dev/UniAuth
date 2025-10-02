import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { getLocale, Link, useIntl, useSearchParams } from "@umijs/max";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  message,
  Popconfirm,
  Radio,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
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
  postQuotaPool,
  postQuotaPoolFilter,
} from "@/services/uniauthService/quotaPool";

const { Title, Text } = Typography;

const QuotaPoolListPage: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tableRef = useRef<ActionType | null>(null);
  const formRef = useRef<any>(null);
  const [cronDescription, setCronDescription] = useState<string>("");
  const [cronError, setCronError] = useState<string>("");

  // 批量修改相关状态
  const [batchModifyForm] = Form.useForm();
  const [isBatchModifyModalOpen, setIsBatchModifyModalOpen] = useState(false);
  const [batchModifyLoading, setBatchModifyLoading] = useState(false);
  const [batchModifyCurrentStep, setBatchModifyCurrentStep] = useState(0);
  const [filterConditions, setFilterConditions] = useState<
    (API.FilterCondition & { id: string })[]
  >([]);
  const [previewResult, setPreviewResult] =
    useState<API.BatchModifyQuotaPoolRes | null>(null);
  const [selectedModifyField, setSelectedModifyField] = useState<string>("");

  // 使用 useMemo 确保初始参数响应 URL 变化
  const initialSearchParams = useMemo(() => {
    const quotaPoolName = searchParams.get("quotaPoolName") || undefined;
    const personal = searchParams.get("personal") || undefined;
    const disabled = searchParams.get("disabled") || undefined;
    const current = parseInt(searchParams.get("current") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    return {
      quotaPoolName,
      personal,
      disabled,
      current,
      pageSize,
    };
  }, [searchParams]);

  // 批量修改相关配置
  const fieldOptions = [
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.quotaPoolName",
        defaultMessage: "配额池名称",
      }),
      value: "quotaPoolName",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.cronCycle",
        defaultMessage: "刷新周期",
      }),
      value: "cronCycle",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.regularQuota",
        defaultMessage: "定期配额",
      }),
      value: "regularQuota",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.remainingQuota",
        defaultMessage: "剩余配额",
      }),
      value: "remainingQuota",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.lastResetAt",
        defaultMessage: "最后重置时间",
      }),
      value: "lastResetAt",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.extraQuota",
        defaultMessage: "额外配额",
      }),
      value: "extraQuota",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.personal",
        defaultMessage: "配额池类型",
      }),
      value: "personal",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.disabled",
        defaultMessage: "启用状态",
      }),
      value: "disabled",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.createdAt",
        defaultMessage: "创建时间",
      }),
      value: "createdAt",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.field.updatedAt",
        defaultMessage: "更新时间",
      }),
      value: "updatedAt",
    },
  ];

  const operatorOptions = [
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.eq",
        defaultMessage: "等于",
      }),
      value: "eq",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.neq",
        defaultMessage: "不等于",
      }),
      value: "neq",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.gt",
        defaultMessage: "大于",
      }),
      value: "gt",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.gte",
        defaultMessage: "大于等于",
      }),
      value: "gte",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.lt",
        defaultMessage: "小于",
      }),
      value: "lt",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.lte",
        defaultMessage: "小于等于",
      }),
      value: "lte",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.like",
        defaultMessage: "模糊匹配",
      }),
      value: "like",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.contains",
        defaultMessage: "包含",
      }),
      value: "contains",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.notcontains",
        defaultMessage: "不包含",
      }),
      value: "notcontains",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.startswith",
        defaultMessage: "以...开头",
      }),
      value: "startswith",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.endswith",
        defaultMessage: "以...结尾",
      }),
      value: "endswith",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.in",
        defaultMessage: "包含在列表中",
      }),
      value: "in",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.notin",
        defaultMessage: "不包含在列表中",
      }),
      value: "notin",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.isnull",
        defaultMessage: "为空",
      }),
      value: "isnull",
    },
    {
      label: intl.formatMessage({
        id: "pages.quotaPoolList.operator.isnotnull",
        defaultMessage: "不为空",
      }),
      value: "isnotnull",
    },
  ];

  // 更新URL参数
  const updateURLParams = (params: {
    quotaPoolName?: string;
    personal?: string;
    disabled?: string;
    current?: number;
    pageSize?: number;
  }) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (params.quotaPoolName !== undefined) {
      if (params.quotaPoolName) {
        newSearchParams.set("quotaPoolName", params.quotaPoolName);
      } else {
        newSearchParams.delete("quotaPoolName");
      }
    }

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
      title: intl.formatMessage({
        id: "pages.quotaPoolList.quotaPoolName",
        defaultMessage: "配额池名称",
      }),
      dataIndex: "quotaPoolName",
      valueType: "text",
      search: true,
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.quotaPoolList.quotaPoolName.placeholder",
          defaultMessage: "请输入配额池名称进行搜索",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolList.quota",
        defaultMessage: "配额",
      }),
      dataIndex: "regularQuota",
      valueType: "digit",
      search: false,
      render: (_, record) => {
        return record.regularQuota ? record.regularQuota.toString() : "-";
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolList.remainingQuota",
        defaultMessage: "余额",
      }),
      dataIndex: "remainingQuota",
      valueType: "digit",
      search: false,
      render: (_, record) => {
        return record.remainingQuota ? record.remainingQuota.toString() : "-";
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolList.quotaPoolType",
        defaultMessage: "配额池类型",
      }),
      dataIndex: "personal",
      valueType: "select",
      search: true,
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: "pages.quotaPoolList.quotaPoolType.personal",
            defaultMessage: "个人配额池",
          }),
        },
        false: {
          text: intl.formatMessage({
            id: "pages.quotaPoolList.quotaPoolType.shared",
            defaultMessage: "共享配额池",
          }),
        },
      },
      render: (_, record) => {
        return record.personal
          ? intl.formatMessage({
              id: "pages.quotaPoolList.quotaPoolType.personal",
              defaultMessage: "个人配额池",
            })
          : intl.formatMessage({
              id: "pages.quotaPoolList.quotaPoolType.shared",
              defaultMessage: "共享配额池",
            });
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolList.status",
        defaultMessage: "启用状态",
      }),
      dataIndex: "disabled",
      valueType: "select",
      search: true,
      valueEnum: {
        false: {
          text: intl.formatMessage({
            id: "pages.quotaPoolList.status.enabled",
            defaultMessage: "启用",
          }),
        },
        true: {
          text: intl.formatMessage({
            id: "pages.quotaPoolList.status.disabled",
            defaultMessage: "禁用",
          }),
        },
      },
      render: (_, record) => {
        return record.disabled
          ? intl.formatMessage({
              id: "pages.quotaPoolList.status.disabled",
              defaultMessage: "禁用",
            })
          : intl.formatMessage({
              id: "pages.quotaPoolList.status.enabled",
              defaultMessage: "启用",
            });
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.quotaPoolList.createdAt",
        defaultMessage: "创建时间",
      }),
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
      title: intl.formatMessage({
        id: "pages.quotaPoolList.actions",
        defaultMessage: "操作",
      }),
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
        const detailUrl = `/resource/quota-pool-list/${record.quotaPoolName}${
          queryString ? `?${queryString}` : ""
        }`;

        return (
          <div style={{ textAlign: "center" }}>
            <Link to={detailUrl} key="detail">
              {intl.formatMessage({
                id: "pages.quotaPoolList.detail",
                defaultMessage: "详情",
              })}
            </Link>
            <span style={{ margin: "0 8px" }} />
            <Popconfirm
              key="delete"
              title={intl.formatMessage({
                id: "pages.quotaPoolList.delete.confirm",
                defaultMessage: "确定要删除该配额池吗？",
              })}
              onConfirm={() => handleDelete(record)}
            >
              <a style={{ color: "red" }}>
                {intl.formatMessage({
                  id: "pages.quotaPoolList.delete",
                  defaultMessage: "删除",
                })}
              </a>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  // 添加6位cron表达式验证函数
  const validateSixFieldCron = (cronExpression: string): boolean => {
    if (!cronExpression || typeof cronExpression !== "string") {
      return false;
    }
    const fields = cronExpression.trim().split(/\s+/);
    return fields.length === 6;
  };

  // 处理 cron 表达式校验和解析
  const handleCronChange = (value: string) => {
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

  // 删除配额池
  async function handleDelete(record: any) {
    try {
      setLoading(true);
      const res = await deleteQuotaPool({
        quotaPoolName: record.quotaPoolName,
      });
      if (res?.ok) {
        message.success(
          intl.formatMessage({
            id: "pages.quotaPoolList.delete.success",
            defaultMessage: "删除配额池成功",
          }),
        );
        tableRef.current?.reload();
      } else {
        message.error(
          intl.formatMessage({
            id: "pages.quotaPoolList.delete.error",
            defaultMessage: "删除配额池失败",
          }),
        );
      }
    } catch (error) {
      console.error("删除配额池失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolList.delete.error",
          defaultMessage: "删除配额池失败",
        }),
      );
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
      message.warning(
        intl.formatMessage({
          id: "pages.quotaPoolList.batchReset.warning",
          defaultMessage: "请先选择要重置的配额池",
        }),
      );
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
      message.success(
        intl.formatMessage({
          id: "pages.quotaPoolList.batchReset.success",
          defaultMessage: "批量重置配额池成功",
        }),
      );
      tableRef.current?.reload();
    } catch (error) {
      console.error("批量重置配额池失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolList.batchReset.error",
          defaultMessage: "批量重置配额池失败",
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  // 批量禁用配额池
  async function handleBatchDisableClick(selectedRows: any[]) {
    if (!selectedRows || selectedRows.length === 0) {
      message.warning(
        intl.formatMessage({
          id: "pages.quotaPoolList.batchDisable.warning",
          defaultMessage: "请先选择要禁用的配额池",
        }),
      );
      return;
    }

    try {
      setLoading(true);
      const quotaPoolNames = selectedRows.map((row) => row.quotaPoolName);

      // 构建过滤条件，使用in操作符匹配配额池名称
      const filter: API.FilterGroup = {
        logic: "and",
        conditions: [
          {
            field: "quotaPoolName",
            op: "in",
            value: quotaPoolNames,
          },
        ],
      };

      const res = await postQuotaPoolAdminBatchModify({
        filter,
        field: "disabled",
        value: true,
      });

      if (res?.ok) {
        message.success(
          intl.formatMessage({
            id: "pages.quotaPoolList.batchDisable.success",
            defaultMessage: "批量禁用配额池成功",
          }),
        );
        tableRef.current?.reload();
      } else {
        message.error(
          intl.formatMessage({
            id: "pages.quotaPoolList.batchDisable.error",
            defaultMessage: "批量禁用配额池失败",
          }),
        );
      }
    } catch (error) {
      console.error("批量禁用配额池失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolList.batchDisable.error",
          defaultMessage: "批量禁用配额池失败",
        }),
      );
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
        message.success(
          intl.formatMessage({
            id: "pages.quotaPoolList.create.success",
            defaultMessage: "新建配额池成功",
          }),
        );
        setIsModalOpen(false);
        form.resetFields();
        setCronDescription("");
        setCronError("");
        tableRef.current?.reload();
      } else {
        message.error(
          intl.formatMessage({
            id: "pages.quotaPoolList.create.error",
            defaultMessage: "新建配额池失败",
          }),
        );
      }
    } catch (error: any) {
      if (error?.errorFields) {
        // 表单验证错误，不显示错误消息
        return;
      }
      console.error("新建配额池失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolList.create.error",
          defaultMessage: "新建配额池失败",
        }),
      );
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

  // 生成唯一ID的函数
  const generateId = () =>
    `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 为过滤条件添加通配符的函数
  const addWildcardsToCondition = (
    condition: API.FilterCondition,
  ): API.FilterCondition => {
    const { op, value } = condition;

    if (!value || typeof value !== "string") {
      return condition;
    }

    let processedValue = value;

    switch (op) {
      case "like":
        // like 操作符需要用户手动添加 %，如果没有添加，我们自动添加
        if (!value.includes("%")) {
          processedValue = `%${value}%`;
        }
        break;
      case "contains":
      case "notcontains":
        // 后端会自动处理 contains 的通配符，前端不需要额外处理
        processedValue = value;
        break;
      case "startswith":
        // 后端会自动处理 startswith 的通配符，前端不需要额外处理
        processedValue = value;
        break;
      case "endswith":
        // 后端会自动处理 endswith 的通配符，前端不需要额外处理
        processedValue = value;
        break;
      default:
        // 其他操作符不需要处理
        break;
    }

    return { ...condition, value: processedValue };
  };

  // 批量修改相关函数
  const handleBatchModifyClick = () => {
    setIsBatchModifyModalOpen(true);
    setBatchModifyCurrentStep(0);
    setFilterConditions([{ field: "", op: "eq", value: "", id: generateId() }]);
    setPreviewResult(null);
    setSelectedModifyField("");
    batchModifyForm.resetFields();
  };

  const handleBatchModifyCancel = () => {
    setIsBatchModifyModalOpen(false);
    setBatchModifyCurrentStep(0);
    setFilterConditions([]);
    setPreviewResult(null);
    setSelectedModifyField("");
    batchModifyForm.resetFields();
  };

  const addFilterCondition = () => {
    setFilterConditions([
      ...filterConditions,
      { field: "", op: "eq", value: "", id: generateId() },
    ]);
  };

  const removeFilterCondition = (index: number) => {
    const newConditions = filterConditions.filter((_, i) => i !== index);
    setFilterConditions(newConditions);
  };

  const updateFilterCondition = (
    index: number,
    field: keyof API.FilterCondition,
    value: any,
  ) => {
    const newConditions = [...filterConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFilterConditions(newConditions);
  };

  const renderValueInput = (
    condition: API.FilterCondition & { id: string },
    index: number,
  ) => {
    const { op } = condition;

    if (op === "isnull" || op === "isnotnull") {
      return null; // 这些操作符不需要值
    }

    if (op === "in" || op === "notin") {
      return (
        <Select
          mode="tags"
          placeholder={intl.formatMessage({
            id: "pages.quotaPoolList.operator.in.placeholder",
            defaultMessage: "请输入值，按回车分隔多个值",
          })}
          value={condition.value ? String(condition.value).split(",") : []}
          onChange={(values) =>
            updateFilterCondition(index, "value", values.join(","))
          }
          style={{ width: "100%" }}
        />
      );
    }

    // 对于布尔字段，提供选择框
    if (condition.field === "personal" || condition.field === "disabled") {
      return (
        <Select
          placeholder={intl.formatMessage({
            id: "pages.quotaPoolList.batchModify.newValue.placeholder",
            defaultMessage: "请选择新值",
          })}
          value={condition.value}
          onChange={(value) => updateFilterCondition(index, "value", value)}
          style={{ width: "100%" }}
        >
          <Select.Option value="true">
            {intl.formatMessage({
              id: "pages.quotaPoolList.status.enabled",
              defaultMessage: "启用",
            })}
          </Select.Option>
          <Select.Option value="false">
            {intl.formatMessage({
              id: "pages.quotaPoolList.status.disabled",
              defaultMessage: "禁用",
            })}
          </Select.Option>
        </Select>
      );
    }

    // 为不同操作符提供不同的占位符提示
    let placeholder = intl.formatMessage({
      id: "pages.quotaPoolList.operator.default.placeholder",
      defaultMessage: "请输入值",
    });
    switch (op) {
      case "like":
        placeholder = intl.formatMessage({
          id: "pages.quotaPoolList.operator.like.placeholder",
          defaultMessage: "输入值，支持通配符",
        });
        break;
      case "contains":
        placeholder = intl.formatMessage({
          id: "pages.quotaPoolList.operator.contains.placeholder",
          defaultMessage: "输入包含的内容",
        });
        break;
      case "notcontains":
        placeholder = intl.formatMessage({
          id: "pages.quotaPoolList.operator.notcontains.placeholder",
          defaultMessage: "输入不包含的内容",
        });
        break;
      case "startswith":
        placeholder = intl.formatMessage({
          id: "pages.quotaPoolList.operator.startswith.placeholder",
          defaultMessage: "输入开头内容",
        });
        break;
      case "endswith":
        placeholder = intl.formatMessage({
          id: "pages.quotaPoolList.operator.endswith.placeholder",
          defaultMessage: "输入结尾内容",
        });
        break;
      default:
        placeholder = intl.formatMessage({
          id: "pages.quotaPoolList.operator.default.placeholder",
          defaultMessage: "请输入值",
        });
    }

    return (
      <Input
        placeholder={placeholder}
        value={condition.value as string}
        onChange={(e) => updateFilterCondition(index, "value", e.target.value)}
      />
    );
  };

  const handlePreview = async () => {
    try {
      setBatchModifyLoading(true);

      const formValues = await batchModifyForm.validateFields();

      // 构建过滤条件
      const validConditions = filterConditions
        .filter(
          (condition) =>
            condition.field &&
            condition.op &&
            (condition.op === "isnull" ||
              condition.op === "isnotnull" ||
              (condition.value !== undefined && condition.value !== "")),
        )
        .map(({ id, ...condition }) => addWildcardsToCondition(condition));

      if (validConditions.length === 0) {
        message.warning(
          intl.formatMessage({
            id: "pages.quotaPoolList.batchModify.noValidConditions",
            defaultMessage: "请至少设置一个有效的过滤条件",
          }),
        );
        return;
      }

      const filter: API.FilterGroup = {
        logic: "and",
        conditions: validConditions,
      };

      const res = await postQuotaPoolAdminBatchModify({
        filter,
        field: formValues.field,
        value: formValues.value,
        preview: true,
      });

      if (res?.ok) {
        setPreviewResult(res);
        setBatchModifyCurrentStep(1);
      } else {
        message.error(
          res?.err ||
            intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.previewError",
              defaultMessage: "预览失败",
            }),
        );
      }
    } catch (error) {
      console.error("预览失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolList.batchModify.previewError",
          defaultMessage: "预览失败",
        }),
      );
    } finally {
      setBatchModifyLoading(false);
    }
  };

  const handleConfirmBatchModify = async () => {
    try {
      setBatchModifyLoading(true);

      const formValues = await batchModifyForm.validateFields();

      const validConditions = filterConditions
        .filter(
          (condition) =>
            condition.field &&
            condition.op &&
            (condition.op === "isnull" ||
              condition.op === "isnotnull" ||
              (condition.value !== undefined && condition.value !== "")),
        )
        .map(({ id, ...condition }) => addWildcardsToCondition(condition));

      const filter: API.FilterGroup = {
        logic: "and",
        conditions: validConditions,
      };

      const res = await postQuotaPoolAdminBatchModify({
        filter,
        field: formValues.field,
        value: formValues.value,
        preview: false,
      });

      if (res?.ok) {
        message.success(
          intl.formatMessage(
            {
              id: "pages.quotaPoolList.batchModify.success",
              defaultMessage: "批量修改成功，共影响 {count} 个配额池",
            },
            { count: res.affectedCount },
          ),
        );
        handleBatchModifyCancel();
        tableRef.current?.reload();
      } else {
        message.error(
          res?.err ||
            intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.error",
              defaultMessage: "批量修改失败",
            }),
        );
      }
    } catch (error) {
      console.error("批量修改失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.quotaPoolList.batchModify.error",
          defaultMessage: "批量修改失败",
        }),
      );
    } finally {
      setBatchModifyLoading(false);
    }
  };

  // 表格数据请求
  const quotaPoolListRequest = async (params: any) => {
    const { current, pageSize, quotaPoolName, personal, disabled } = params;

    // 更新URL参数
    updateURLParams({
      quotaPoolName: quotaPoolName || "",
      personal: personal || "",
      disabled: disabled || "",
      current: current || 1,
      pageSize: pageSize || 10,
    });

    try {
      // 构建过滤条件
      const conditions: API.FilterCondition[] = [];

      // 按配额池名称模糊搜索
      if (
        params.quotaPoolName !== undefined &&
        params.quotaPoolName !== "" &&
        params.quotaPoolName !== null
      ) {
        conditions.push({
          field: "quotaPoolName",
          op: "like",
          value: `%${params.quotaPoolName}%`,
        });
      }

      // 按配额池类型过滤
      if (
        params.personal !== undefined &&
        params.personal !== "" &&
        params.personal !== null
      ) {
        const isPersonal =
          params.personal === "true" || params.personal === true;
        conditions.push({
          field: "personal",
          op: "eq",
          value: isPersonal,
        });
      }

      // 按启用状态过滤
      if (
        params.disabled !== undefined &&
        params.disabled !== "" &&
        params.disabled !== null
      ) {
        const isDisabled =
          params.disabled === "true" || params.disabled === true;
        conditions.push({
          field: "disabled",
          op: "eq",
          value: isDisabled,
        });
      }

      // 构建请求参数
      const requestParams: API.FilterQuotaPoolReq = {
        sort: [
          {
            field: "createdAt",
            order: "desc",
          },
        ],
        pagination: {
          page: current || 1,
          pageSize: pageSize || 10,
        },
      };

      // 只有当有过滤条件时才添加filter
      if (conditions.length > 0) {
        requestParams.filter = {
          logic: "and",
          conditions: conditions,
        };
      }

      // 发送过滤请求
      const response = await postQuotaPoolFilter(requestParams);

      // 增强错误边界检查
      if (!response || typeof response !== "object") {
        console.error("API返回格式错误", response);
        return {
          data: [],
          success: false,
          total: 0,
        };
      }

      if (!response.items || !Array.isArray(response.items)) {
        console.warn("没有找到配额池数据");
        return {
          data: [],
          success: true,
          total: 0,
        };
      }

      return {
        data: response.items,
        success: true,
        total: response.total || response.items.length,
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
        <Title level={4}>
          {intl.formatMessage({
            id: "pages.quotaPoolList.title",
            defaultMessage: "配额池列表",
          })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({
            id: "pages.quotaPoolList.description",
            defaultMessage:
              "管理系统中的所有配额池及其配置，查看使用情况、获取账单等",
          })}
        </Text>
        <ProTable
          onReset={() => {
            // 清空URL参数
            updateURLParams({
              quotaPoolName: "",
              personal: "",
              disabled: "",
              current: 1,
              pageSize: 10,
            });
            // 手动重置表单到空值
            if (formRef.current) {
              formRef.current.setFieldsValue({
                quotaPoolName: undefined,
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
            searchText: intl.formatMessage({
              id: "pages.quotaPoolList.search",
              defaultMessage: "查询",
            }),
            resetText: intl.formatMessage({
              id: "pages.quotaPoolList.reset",
              defaultMessage: "重置",
            }),
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
            showTotal: (total) =>
              intl.formatMessage(
                {
                  id: "pages.quotaPoolList.total",
                  defaultMessage: "共 {total} 条数据",
                },
                { total },
              ),
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
                  {intl.formatMessage(
                    {
                      id: "pages.quotaPoolList.selected",
                      defaultMessage: "已选 {count} 项",
                    },
                    { count: selectedRowKeys.length },
                  )}
                  <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.cancelSelection",
                      defaultMessage: "取消选择",
                    })}
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={({ selectedRows }) => {
            return (
              <Space size={16}>
                <a onClick={() => handleBatchResetClick(selectedRows)}>
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchReset",
                    defaultMessage: "批量重置",
                  })}
                </a>
                <a onClick={() => handleBatchDisableClick(selectedRows)}>
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchDisable",
                    defaultMessage: "批量禁用",
                  })}
                </a>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button
              type="primary"
              key="batch-modify"
              onClick={handleBatchModifyClick}
            >
              {intl.formatMessage({
                id: "pages.quotaPoolList.batchModify",
                defaultMessage: "批量修改",
              })}
            </Button>,
            <Button type="primary" key="new" onClick={handleNewQuotaPoolClick}>
              {intl.formatMessage({
                id: "pages.quotaPoolList.addNew",
                defaultMessage: "添加新的配额池",
              })}
            </Button>,
          ]}
          request={quotaPoolListRequest}
        />
      </ProCard>

      {/* 批量修改模态框 */}
      <Modal
        title={intl.formatMessage({
          id: "pages.quotaPoolList.batchModify.title",
          defaultMessage: "批量修改配额池",
        })}
        open={isBatchModifyModalOpen}
        onCancel={handleBatchModifyCancel}
        footer={null}
        width={800}
      >
        <Steps current={batchModifyCurrentStep} style={{ marginBottom: 24 }}>
          <Steps.Step
            title={intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.step1",
              defaultMessage: "设置过滤条件",
            })}
          />
          <Steps.Step
            title={intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.step2",
              defaultMessage: "预览影响范围",
            })}
          />
          <Steps.Step
            title={intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.step3",
              defaultMessage: "确认修改",
            })}
          />
        </Steps>

        <Form
          form={batchModifyForm}
          layout="vertical"
          style={{ display: batchModifyCurrentStep === 0 ? "block" : "none" }}
        >
          <Divider>
            {intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.filterConditions",
              defaultMessage: "过滤条件设置",
            })}
          </Divider>
          {filterConditions.map((condition, index) => (
            <div
              key={condition.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Select
                placeholder={intl.formatMessage({
                  id: "pages.quotaPoolList.batchModify.selectField",
                  defaultMessage: "选择字段",
                })}
                value={condition.field}
                onChange={(value) =>
                  updateFilterCondition(index, "field", value)
                }
                style={{ width: 150 }}
              >
                {fieldOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>

              <Select
                placeholder={intl.formatMessage({
                  id: "pages.quotaPoolList.batchModify.selectOperator",
                  defaultMessage: "选择操作",
                })}
                value={condition.op}
                onChange={(value) => updateFilterCondition(index, "op", value)}
                style={{ width: 120 }}
              >
                {operatorOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>

              <div style={{ flex: 1 }}>
                {renderValueInput(condition, index)}
              </div>

              {filterConditions.length > 1 && (
                <Button
                  type="link"
                  danger
                  onClick={() => removeFilterCondition(index)}
                >
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchModify.removeCondition",
                    defaultMessage: "删除",
                  })}
                </Button>
              )}
            </div>
          ))}

          <Button
            type="dashed"
            onClick={addFilterCondition}
            style={{ width: "100%", marginBottom: 16 }}
          >
            {intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.addCondition",
              defaultMessage: "+ 添加过滤条件",
            })}
          </Button>

          <Divider>
            {intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.modifySettings",
              defaultMessage: "修改设置",
            })}
          </Divider>
          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.modifyField",
              defaultMessage: "要修改的字段",
            })}
            name="field"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.quotaPoolList.batchModify.modifyField.required",
                  defaultMessage: "请选择要修改的字段",
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolList.batchModify.selectField",
                defaultMessage: "选择字段",
              })}
              onChange={(value) => {
                // 当字段改变时，清空值并更新状态
                batchModifyForm.setFieldValue("value", undefined);
                setSelectedModifyField(value);
              }}
            >
              <Select.Option value="disabled">
                {intl.formatMessage({
                  id: "pages.quotaPoolList.status",
                  defaultMessage: "启用状态",
                })}
              </Select.Option>
              <Select.Option value="personal">
                {intl.formatMessage({
                  id: "pages.quotaPoolList.quotaPoolType",
                  defaultMessage: "配额池类型",
                })}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolList.batchModify.newValue",
              defaultMessage: "新值",
            })}
            name="value"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.quotaPoolList.batchModify.newValue.required",
                  defaultMessage: "请选择新值",
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolList.batchModify.newValue.placeholder",
                defaultMessage: "请选择新值",
              })}
            >
              {selectedModifyField === "disabled" && (
                <>
                  <Select.Option value={true}>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.status.disabled",
                      defaultMessage: "禁用",
                    })}
                  </Select.Option>
                  <Select.Option value={false}>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.status.enabled",
                      defaultMessage: "启用",
                    })}
                  </Select.Option>
                </>
              )}
              {selectedModifyField === "personal" && (
                <>
                  <Select.Option value={true}>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.quotaPoolType.personal",
                      defaultMessage: "个人配额池",
                    })}
                  </Select.Option>
                  <Select.Option value={false}>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.quotaPoolType.shared",
                      defaultMessage: "共享配额池",
                    })}
                  </Select.Option>
                </>
              )}
            </Select>
          </Form.Item>

          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleBatchModifyCancel}>
                {intl.formatMessage({
                  id: "pages.quotaPoolList.batchModify.cancel",
                  defaultMessage: "取消",
                })}
              </Button>
              <Button
                type="primary"
                onClick={handlePreview}
                loading={batchModifyLoading}
              >
                {intl.formatMessage({
                  id: "pages.quotaPoolList.batchModify.preview",
                  defaultMessage: "预览影响范围",
                })}
              </Button>
            </Space>
          </div>
        </Form>

        {batchModifyCurrentStep === 1 && previewResult && (
          <div>
            <Divider>
              {intl.formatMessage({
                id: "pages.quotaPoolList.batchModify.previewResult",
                defaultMessage: "预览结果",
              })}
            </Divider>
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Tag color="blue">
                  {intl.formatMessage(
                    {
                      id: "pages.quotaPoolList.batchModify.affectedCount",
                      defaultMessage: "影响的配额池数量: {count}",
                    },
                    { count: previewResult.affectedCount || 0 },
                  )}
                </Tag>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchModify.modifyOperation",
                    defaultMessage: "修改操作：",
                  })}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Text>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.batchModify.field",
                      defaultMessage: "字段",
                    })}
                    ：
                  </Text>
                  <Tag color="green">
                    {(() => {
                      const fieldValue = batchModifyForm.getFieldValue("field");
                      switch (fieldValue) {
                        case "disabled":
                          return intl.formatMessage({
                            id: "pages.quotaPoolList.status",
                            defaultMessage: "启用状态",
                          });
                        case "personal":
                          return intl.formatMessage({
                            id: "pages.quotaPoolList.quotaPoolType",
                            defaultMessage: "配额池类型",
                          });
                        default:
                          return fieldValue;
                      }
                    })()}
                  </Tag>
                  <Text style={{ margin: "0 8px" }}>→</Text>
                  <Text>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.batchModify.newValueLabel",
                      defaultMessage: "新值",
                    })}
                    ：
                  </Text>
                  <Tag color="orange">
                    {(() => {
                      const fieldValue = batchModifyForm.getFieldValue("field");
                      const newValue = batchModifyForm.getFieldValue("value");

                      if (fieldValue === "disabled") {
                        return newValue === true
                          ? intl.formatMessage({
                              id: "pages.quotaPoolList.status.disabled",
                              defaultMessage: "禁用",
                            })
                          : intl.formatMessage({
                              id: "pages.quotaPoolList.status.enabled",
                              defaultMessage: "启用",
                            });
                      } else if (fieldValue === "personal") {
                        return newValue === true
                          ? intl.formatMessage({
                              id: "pages.quotaPoolList.quotaPoolType.personal",
                              defaultMessage: "个人配额池",
                            })
                          : intl.formatMessage({
                              id: "pages.quotaPoolList.quotaPoolType.shared",
                              defaultMessage: "共享配额池",
                            });
                      } else {
                        return String(newValue);
                      }
                    })()}
                  </Tag>
                </div>
              </div>

              {(previewResult.affectedCount || 0) > 0 && (
                <div>
                  <Text strong>
                    {intl.formatMessage({
                      id: "pages.quotaPoolList.batchModify.affectedPools",
                      defaultMessage: "受影响的配额池名称：",
                    })}
                  </Text>
                  <List
                    size="small"
                    dataSource={previewResult.affectedPoolNames || []}
                    renderItem={(poolName) => (
                      <List.Item>
                        <Text code>{poolName}</Text>
                      </List.Item>
                    )}
                    style={{ marginTop: 8, maxHeight: 200, overflow: "auto" }}
                  />
                </div>
              )}

              {(previewResult.affectedCount || 0) === 0 && (
                <Text type="secondary">
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchModify.noMatch",
                    defaultMessage: "没有找到符合条件的配额池",
                  })}
                </Text>
              )}
            </Card>

            <div style={{ textAlign: "right", marginTop: 16 }}>
              <Space>
                <Button onClick={() => setBatchModifyCurrentStep(0)}>
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchModify.backToConditions",
                    defaultMessage: "返回修改条件",
                  })}
                </Button>
                <Button onClick={handleBatchModifyCancel}>
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchModify.cancel",
                    defaultMessage: "取消",
                  })}
                </Button>
                <Button
                  type="primary"
                  danger
                  onClick={handleConfirmBatchModify}
                  loading={batchModifyLoading}
                  disabled={(previewResult.affectedCount || 0) === 0}
                >
                  {intl.formatMessage({
                    id: "pages.quotaPoolList.batchModify.confirm",
                    defaultMessage: "确认批量修改",
                  })}
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={intl.formatMessage({
          id: "pages.quotaPoolList.create.title",
          defaultMessage: "新建配额池",
        })}
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
            label={intl.formatMessage({
              id: "pages.quotaPoolList.create.quotaPoolName",
              defaultMessage: "配额池名称",
            })}
            name="quotaPoolName"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.quotaPoolList.create.quotaPoolName.required",
                  defaultMessage: "请输入配额池名称",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolList.create.quotaPoolName.placeholder",
                defaultMessage:
                  "请输入配额池名称，例如：itso-deep-research-vip",
              })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolList.create.cronCycle",
              defaultMessage: "刷新周期（Cron表达式）",
            })}
            name="cronCycle"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.quotaPoolList.create.cronCycle.required",
                  defaultMessage: "请输入刷新周期",
                }),
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    cronstrue.toString(value, {
                      throwExceptionOnParseError: true,
                    });
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: "pages.quotaPoolList.create.cronCycle.invalid",
                          defaultMessage: "Cron 表达式格式不正确",
                        }),
                      ),
                    );
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
                  {intl.formatMessage(
                    {
                      id: "pages.quotaPoolList.create.cronCycle.help",
                      defaultMessage: "执行时间：{description}",
                    },
                    { description: cronDescription },
                  )}
                </span>
              ) : null
            }
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolList.create.cronCycle.placeholder",
                defaultMessage: "请输入标准 Cron 表达式，例如：0 0 3 * * *",
              })}
              onChange={(e) => handleCronChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolList.create.regularQuota",
              defaultMessage: "定期配额",
            })}
            name="regularQuota"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.quotaPoolList.create.regularQuota.required",
                  defaultMessage: "请输入定期配额",
                }),
              },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolList.create.regularQuota.placeholder",
                defaultMessage: "请输入定期配额，例如：10",
              })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolList.create.extraQuota",
              defaultMessage: "初始加油包",
            })}
            name="extraQuota"
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder={intl.formatMessage({
                id: "pages.quotaPoolList.create.extraQuota.placeholder",
                defaultMessage: "请输入初始加油包，默认为0",
              })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolList.create.quotaPoolTypeLabel",
              defaultMessage: "配额池类型",
            })}
            name="personal"
          >
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={false}>
                {intl.formatMessage({
                  id: "pages.quotaPoolList.quotaPoolType.shared",
                  defaultMessage: "共享配额池",
                })}
              </Radio.Button>
              <Radio.Button value={true}>
                {intl.formatMessage({
                  id: "pages.quotaPoolList.quotaPoolType.personal",
                  defaultMessage: "个人配额池",
                })}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.quotaPoolList.create.enabledStatus",
              defaultMessage: "启用状态",
            })}
            name="enabled"
            valuePropName="checked"
          >
            <Switch
              checkedChildren={intl.formatMessage({
                id: "pages.quotaPoolList.create.enabled",
                defaultMessage: "启用",
              })}
              unCheckedChildren={intl.formatMessage({
                id: "pages.quotaPoolList.create.disabled",
                defaultMessage: "禁用",
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default QuotaPoolListPage;
