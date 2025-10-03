import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
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
import { useRef, useState } from "react";
import {
  deleteConfigAutoConfig,
  getConfigAutoConfig,
  postConfigAutoConfig,
  putConfigAutoConfig,
  postConfigAutoConfigSyncUpnsCache,
} from "@/services/uniauthService/autoQuotaPoolConfig";

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
  const actionRef = useRef<ActionType | null>(null);
  // 控制模态框显示状态
  const [modalVisible, setModalVisible] = useState(false);
  // 当前编辑的记录
  const [editingRecord, setEditingRecord] =
    useState<API.AutoQuotaPoolItem | null>(null);
  // 表单实例
  const [form] = Form.useForm();

  /**
   * 编辑记录处理函数
   * @param record 要编辑的记录
   */
  const handleEdit = (record: API.AutoQuotaPoolItem) => {
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
    setModalVisible(true);
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
  const handleNewConfig = () => {
    setEditingRecord(null);
    form.resetFields();
    // 设置默认值，新规则默认启用
    form.setFieldsValue({
      enabled: true,
    });
    setModalVisible(true);
  };

  /** 同步指定规则的 UPN 缓存 */
  const handleSyncOne = async (ruleName?: string) => {
    if (!ruleName) return;
    try {
      const res = await postConfigAutoConfigSyncUpnsCache({ ruleName });
      const count = res?.matchedUserCount?.[ruleName] ?? 0;
      message.success(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.syncOneSuccess" }, {
          count,
        }),
      );
      actionRef.current?.reload?.();
    } catch (_e) {
      message.error(intl.formatMessage({ id: "pages.autoQuotaPoolConfig.syncFailed" }));
    }
  };

  /** 同步全部规则的 UPN 缓存 */
  const handleSyncAll = async () => {
    try {
      const res = await postConfigAutoConfigSyncUpnsCache({});
      const updated = res?.updatedRules?.length || 0;
      message.success(
        intl.formatMessage({ id: "pages.autoQuotaPoolConfig.syncAllSuccess" }, {
          count: updated,
        }),
      );
      actionRef.current?.reload?.();
    } catch (_e) {
      message.error(intl.formatMessage({ id: "pages.autoQuotaPoolConfig.syncFailed" }));
    }
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
  const handleModalOk = async () => {
    try {
      // 表单验证
      const values = await form.validateFields();

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
          return;
        }
      } else {
        // 如果没有提供filterGroup，不设置这个字段，让它保持undefined
      }

      // 处理upnsCache字段 - 现在作为字符串处理
      if (values.upnsCache) {
        // 直接使用字符串值，不再解析为JSON
        processedValues.upnsCache = values.upnsCache;
      } else {
        // 如果没有提供upnsCache，确保传递空字符串而不是null
        processedValues.upnsCache = [];
      }

      // 根据是否为编辑状态调用不同的API
      if (editingRecord) {
        // 编辑现有配置
        // 确保processedValues满足EditAutoQuotaPoolConfigReq类型要求
        await putConfigAutoConfig(
          processedValues as API.EditAutoQuotaPoolConfigReq,
        );
        message.success(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.updateSuccess" }),
        );
      } else {
        // 添加新配置
        // 确保processedValues满足AddAutoQuotaPoolConfigReq类型要求
        await postConfigAutoConfig(
          processedValues as API.AddAutoQuotaPoolConfigReq,
        );
        message.success(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.createSuccess" }),
        );
      }

      setModalVisible(false);
      actionRef.current?.reload();
    } catch (_error: any) {
      // 提供更详细的错误信息
      let errorMessage = intl.formatMessage({
        id: "pages.autoQuotaPoolConfig.saveFailed",
      });

      // 检查是否是字段验证错误
      if (_error.errorFields) {
        errorMessage = intl.formatMessage({
          id: "pages.autoQuotaPoolConfig.formInvalid",
        });
      } else if (_error.message?.includes("ruleName")) {
        errorMessage = intl.formatMessage({
          id: "pages.autoQuotaPoolConfig.saveFailedRuleNameRequired",
        });
      } else if (_error.message?.includes("cronCycle")) {
        errorMessage = intl.formatMessage({
          id: "pages.autoQuotaPoolConfig.saveFailedCronCycleRequired",
        });
      } else if (_error.message?.includes("regularQuota")) {
        errorMessage = intl.formatMessage({
          id: "pages.autoQuotaPoolConfig.saveFailedRegularQuotaInvalid",
        });
      }
      // 检查是否是网络或服务器错误
      else if (
        _error.message?.includes(
          intl.formatMessage({ id: "pages.autoQuotaPoolConfig.requestFailed" }),
        ) ||
        _error.message?.includes("network")
      ) {
        errorMessage = intl.formatMessage({
          id: "pages.autoQuotaPoolConfig.saveFailedNetworkError",
        });
      }
      // 其他错误
      else {
        errorMessage = _error.message
          ? _error.message
          : intl.formatMessage({
              id: "pages.autoQuotaPoolConfig.saveFailedCheckInput",
            });
      }

      message.error(errorMessage);
    }
  };

  /**
   * 模态框取消处理函数
   */
  const handleModalCancel = () => {
    setModalVisible(false);
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
          <a key="edit" onClick={() => handleEdit(record)}>
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.edit" })}
          </a>
          <span style={{ margin: "0 8px" }} />
          <a key="sync" onClick={() => handleSyncOne(record.ruleName)}>
            {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.syncOne" })}
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
            <Button type="primary" key="new" onClick={handleNewConfig}>
              {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.addNew" })}
            </Button>,
            <Popconfirm
              key="syncAllConfirm"
              title={intl.formatMessage({ id: "pages.autoQuotaPoolConfig.syncAllConfirm" })}
              onConfirm={handleSyncAll}
            >
              <Button key="syncAll">
                {intl.formatMessage({ id: "pages.autoQuotaPoolConfig.syncAll" })}
              </Button>
            </Popconfirm>,
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
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
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
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.autoQuotaPoolConfig.cronCyclePlaceholder",
              })}
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
