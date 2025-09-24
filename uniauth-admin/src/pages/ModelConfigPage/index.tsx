import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import {
  Button,
  Form,
  Input,
  Modal,
  message,
  Popconfirm,
  Select,
  Typography,
} from "antd";
import { useRef, useState } from "react";
import {
  deleteConfigModel,
  getConfigModelAll,
  postConfigModel,
  putConfigModel,
} from "@/services/uniauthService/model";

// UI组件解构
const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * 模型配置页面组件
 * 提供模型配置的增删改查功能
 */
const ModelConfigPage: React.FC = () => {
  // 表格操作引用
  const actionRef = useRef<ActionType | null>(null);
  // 控制模态框显示状态
  const [modalVisible, setModalVisible] = useState(false);
  // 当前编辑的记录
  const [editingRecord, setEditingRecord] =
    useState<API.ModelConfigItem | null>(null);
  // 表单实例
  const [form] = Form.useForm();
  // 国际化工具
  const intl = useIntl();

  /**
   * 编辑记录处理函数
   * @param record 要编辑的记录
   */
  const handleEdit = (record: API.ModelConfigItem) => {
    setEditingRecord(record);

    // 安全地处理JSON字段的序列化
    const formatJsonField = (field: any): string => {
      if (!field) return "";
      try {
        return typeof field === "string"
          ? field
          : JSON.stringify(field, null, 2);
      } catch (e) {
        console.error("JSON序列化失败:", e);
        return typeof field === "object"
          ? JSON.stringify(field)
          : String(field);
      }
    };

    form.setFieldsValue({
      ...record,
      pricing: formatJsonField(record.pricing),
      clientArgs: formatJsonField(record.clientArgs),
      requestArgs: formatJsonField(record.requestArgs),
      servicewares: Array.isArray(record.servicewares)
        ? record.servicewares.join(", ")
        : record.servicewares || "",
      discount:
        record.discount !== undefined && record.discount !== null
          ? String(record.discount)
          : "",
    });
    setModalVisible(true);
  };

  /**
   * 删除记录处理函数
   * @param record 要删除的记录
   */
  const handleDelete = async (record: API.ModelConfigItem) => {
    try {
      // 调用删除API，通过approachName参数指定要删除的记录
      await deleteConfigModel({ approachName: record.approachName || "" });
      message.success(
        intl.formatMessage({ id: "pages.modelConfig.deleteSuccess" }),
      );
      // 刷新表格数据
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(
        intl.formatMessage({ id: "pages.modelConfig.deleteFailed" }),
      );
      console.error("删除模型配置失败:", error);
      // 输出详细的错误信息到控制台
      if (error.data) {
        console.error("错误详情:", JSON.stringify(error.data, null, 2));
      }
    }
  };

  /**
   * 新建模型配置处理函数
   */
  const handleNewModelConfig = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * 模态框确认处理函数
   */
  const handleModalOk = async () => {
    try {
      // 表单验证
      const values = await form.validateFields();

      // 安全地处理JSON字段的解析
      const parseJsonField = (field: string): any => {
        if (!field) return {};
        try {
          const parsed = JSON.parse(field);
          return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
        } catch (e) {
          console.error("JSON解析失败:", e);
          message.error(
            intl.formatMessage({ id: "pages.modelConfig.jsonInvalid" }),
          );
          throw e;
        }
      };

      // 处理服务项标识
      const processServicewares = (field: string): string[] => {
        if (!field) return [];
        return field
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      };

      // 处理折扣字段
      const processDiscount = (field: string): number => {
        if (!field) return 1; // 默认折扣为1（无折扣）
        const num = parseFloat(field);
        return isNaN(num) ? 1 : num;
      };

      // 处理客户端类型字段，直接传递
      const processClientType = (field: string): string => {
        return field || "AsyncOpenAI"; // 如果没有值则使用默认值
      };

      // 处理JSON字段和参数格式，确保符合API要求
      // 使用正确的类型断言，因为已经明确设置了approachName必填项
      const processedValues = {
        ...values,
        approachName: values.approachName, // 根据API文档，approachName是必填项
        pricing: values.pricing ? parseJsonField(values.pricing) : {}, // 确保pricing字段始终有值
        clientArgs: values.clientArgs
          ? parseJsonField(values.clientArgs)
          : undefined,
        requestArgs: values.requestArgs
          ? parseJsonField(values.requestArgs)
          : undefined,
        servicewares: processServicewares(values.servicewares),
        discount:
          values.discount !== undefined ? processDiscount(values.discount) : 1, // 默认折扣为1
        clientType: values.clientType
          ? processClientType(values.clientType)
          : "AsyncOpenAI", // 确保clientType字段存在且有效
      } as API.AddModelConfigReq | API.EditModelConfigReq;

      // 根据是否为编辑状态调用不同的API
      if (editingRecord) {
        // 编辑现有配置
        await putConfigModel(processedValues as API.EditModelConfigReq);
        message.success(
          intl.formatMessage({ id: "pages.modelConfig.updateSuccess" }),
        );
      } else {
        // 添加新配置
        await postConfigModel(processedValues as API.AddModelConfigReq);
        message.success(
          intl.formatMessage({ id: "pages.modelConfig.createSuccess" }),
        );
      }

      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error: any) {
      console.error("保存模型配置失败:", error);

      // 提供更详细的错误信息
      let errorMessage = intl.formatMessage({
        id: "pages.modelConfig.saveFailed",
      });

      // 检查是否是字段验证错误
      if (error.errorFields) {
        errorMessage = intl.formatMessage({
          id: "pages.modelConfig.formInvalid",
        });
      } else if (error.message && error.message.includes("approachName")) {
        errorMessage = intl.formatMessage({
          id: "pages.modelConfig.saveFailedApproachNameRequired",
        });
      } else if (error.message && error.message.includes("clientType")) {
        errorMessage = intl.formatMessage({
          id: "pages.modelConfig.saveFailedClientTypeInvalid",
        });
      } else if (error.message && error.message.includes("discount")) {
        errorMessage = intl.formatMessage({
          id: "pages.modelConfig.saveFailedDiscountInvalid",
        });
      }
      // 检查是否是网络或服务器错误
      else if (
        error.message &&
        (error.message.includes(
          intl.formatMessage({ id: "pages.modelConfig.requestFailed" }),
        ) ||
          error.message.includes("network"))
      ) {
        errorMessage = intl.formatMessage({
          id: "pages.modelConfig.saveFailedNetworkError",
        });
      }
      // 其他错误
      else {
        errorMessage = error.message
          ? error.message
          : intl.formatMessage({
              id: "pages.modelConfig.saveFailedCheckInput",
            });
      }

      message.error(errorMessage);
      // 输出详细的错误信息到控制台
      if (error.data) {
        console.error("错误详情:", JSON.stringify(error.data, null, 2));
      }
    }
  };

  /**
   * 模态框取消处理函数
   */
  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  // 定义本地RequestData接口，因为API命名空间中没有这个类型
  interface RequestData<T> {
    data?: T[];
    items?: T[];
    total?: number;
    success?: boolean;
  }

  /**
   * 获取模型配置列表请求函数
   * @param params 查询参数
   */
  const modelConfigListRequest = async (
    params: any,
  ): Promise<Partial<RequestData<API.ModelConfigItem>>> => {
    try {
      // 调用API获取所有模型配置列表
      const response = await getConfigModelAll(params);

      if (response.items) {
        // 根据查询参数过滤数据
        let data = response.items || [];

        // 模型名称过滤
        if (params.approachName) {
          data = data.filter(
            (item: API.ModelConfigItem) =>
              item.approachName &&
              item.approachName.includes(params.approachName),
          );
        }

        // 客户端类型过滤
        if (params.clientType) {
          data = data.filter(
            (item: API.ModelConfigItem) =>
              item.clientType && item.clientType === params.clientType,
          );
        }

        return {
          data: data,
          items: data,
          success: true,
          total: data.length,
        };
      } else {
        return {
          data: [],
          success: true, // 即使没有数据也返回成功
          total: 0,
        };
      }
    } catch (error: any) {
      console.error("获取模型配置列表失败:", error);
      message.error(
        intl.formatMessage({ id: "pages.modelConfig.fetchFailed" }),
      );
      // 输出详细的错误信息到控制台
      if (error.data) {
        console.error("错误详情:", JSON.stringify(error.data, null, 2));
      }
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
  const columns: ProColumns<API.ModelConfigItem>[] = [
    {
      title: intl.formatMessage({ id: "pages.modelConfig.approachName" }),
      dataIndex: "approachName",
      valueType: "text",
      search: true,
      fixed: "left",
      render: (_, record: API.ModelConfigItem) =>
        record.approachName || (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.modelConfig.notSet" })}
          </Text>
        ),
    },
    {
      title: intl.formatMessage({ id: "pages.modelConfig.clientType" }),
      dataIndex: "clientType",
      valueType: "select",
      search: true,
      valueEnum: {
        AsyncAzureOpenAI: { text: "AsyncAzureOpenAI" },
        AsyncOpenAI: { text: "AsyncOpenAI" },
      },
      render: (_, record: API.ModelConfigItem) =>
        record.clientType || (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.modelConfig.notSet" })}
          </Text>
        ),
    },
    {
      title: intl.formatMessage({ id: "pages.modelConfig.discount" }),
      dataIndex: "discount",
      valueType: "digit",
      search: false,
      render: (_, record: API.ModelConfigItem) => {
        if (record.discount !== undefined && record.discount !== null) {
          const discountValue = parseFloat(String(record.discount));
          if (!isNaN(discountValue)) {
            return `${(discountValue * 100).toFixed(1)}%`;
          }
        }
        return (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.modelConfig.notSet" })}
          </Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "pages.modelConfig.servicewares" }),
      dataIndex: "servicewares",
      valueType: "text",
      search: false,
      render: (_, record: API.ModelConfigItem) => {
        if (
          Array.isArray(record.servicewares) &&
          record.servicewares.length > 0
        ) {
          return record.servicewares.join(", ");
        }
        return (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.modelConfig.notSet" })}
          </Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "pages.modelConfig.pricing" }),
      dataIndex: "pricing",
      valueType: "text",
      search: false,
      render: (_, record: API.ModelConfigItem) => {
        if (record.pricing) {
          try {
            return typeof record.pricing === "string"
              ? record.pricing
              : JSON.stringify(record.pricing, null, 2);
          } catch (e) {
            return typeof record.pricing === "object"
              ? JSON.stringify(record.pricing)
              : String(record.pricing);
          }
        }
        return (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.modelConfig.notSet" })}
          </Text>
        );
      },
    },

    {
      title: intl.formatMessage({ id: "pages.modelConfig.createdAt" }),
      dataIndex: "createdAt",
      valueType: "dateTime",
      search: false,
      hideInTable: true,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
      render: (_, record: API.ModelConfigItem) => {
        if (record.createdAt) {
          const date = new Date(record.createdAt);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString("zh-CN");
          }
        }
        return (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.modelConfig.notSet" })}
          </Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "pages.modelConfig.updatedAt" }),
      dataIndex: "updatedAt",
      valueType: "dateTime",
      search: false,
      hideInTable: true,
      fieldProps: {
        format: "YYYY-MM-DD HH:mm:ss",
        showTime: true,
        style: { width: "100%" },
      },
      render: (_, record: API.ModelConfigItem) => {
        if (record.updatedAt) {
          const date = new Date(record.updatedAt);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString("zh-CN");
          }
        }
        return (
          <Text type="secondary">
            {intl.formatMessage({ id: "pages.modelConfig.notSet" })}
          </Text>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "pages.modelConfig.actions" }),
      valueType: "option",
      fixed: "right",
      ellipsis: true,
      render: (_, record: API.ModelConfigItem) => (
        <div style={{ textAlign: "left" }}>
          <a key="edit" onClick={() => handleEdit(record)}>
            {intl.formatMessage({ id: "pages.modelConfig.edit" })}
          </a>
          <span style={{ margin: "0 8px" }} />
          <Popconfirm
            key="delete"
            title={intl.formatMessage({
              id: "pages.modelConfig.deleteConfirm",
            })}
            onConfirm={() => handleDelete(record)}
          >
            <a style={{ color: "red" }}>
              {intl.formatMessage({ id: "pages.modelConfig.delete" })}
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
          {intl.formatMessage({ id: "pages.modelConfig.title" })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({ id: "pages.modelConfig.description" })}
        </Text>
        {/* 表格组件 */}
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="approachName"
          search={{ labelWidth: "auto" }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewModelConfig}>
              {intl.formatMessage({ id: "pages.modelConfig.addNew" })}
            </Button>,
          ]}
          request={modelConfigListRequest}
        />
      </ProCard>

      {/* 编辑/新建模态框 */}
      <Modal
        title={
          editingRecord
            ? intl.formatMessage({ id: "pages.modelConfig.editModalTitle" })
            : intl.formatMessage({ id: "pages.modelConfig.addModalTitle" })
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
            name="approachName"
            label={intl.formatMessage({ id: "pages.modelConfig.approachName" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.modelConfig.approachNameRequired",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.modelConfig.approachNamePlaceholder",
              })}
              disabled={!!editingRecord}
            />
          </Form.Item>

          <Form.Item
            name="clientType"
            label={intl.formatMessage({ id: "pages.modelConfig.clientType" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.modelConfig.clientTypeRequired",
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: "pages.modelConfig.clientTypePlaceholder",
              })}
              options={[
                { label: "AsyncAzureOpenAI", value: "AsyncAzureOpenAI" },
                { label: "AsyncOpenAI", value: "AsyncOpenAI" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="discount"
            label={intl.formatMessage({ id: "pages.modelConfig.discount" })}
            rules={[
              {
                validator: (_, value) => {
                  if (value === undefined || value === null || value === "") {
                    return Promise.resolve();
                  }
                  if (isNaN(value)) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: "pages.modelConfig.discountNumber",
                        }),
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              step="0.01"
              placeholder={intl.formatMessage({
                id: "pages.modelConfig.discountPlaceholder",
              })}
            />
          </Form.Item>

          <Form.Item
            name="servicewares"
            label={intl.formatMessage({ id: "pages.modelConfig.servicewares" })}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.modelConfig.servicewaresPlaceholder",
              })}
            />
          </Form.Item>

          <Form.Item
            name="pricing"
            label={intl.formatMessage({ id: "pages.modelConfig.pricing" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.modelConfig.pricingRequired",
                }),
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={intl.formatMessage({
                id: "pages.modelConfig.pricingPlaceholder",
              })}
            />
          </Form.Item>

          <Form.Item
            name="clientArgs"
            label={intl.formatMessage({ id: "pages.modelConfig.clientArgs" })}
          >
            <TextArea
              rows={4}
              placeholder={intl.formatMessage({
                id: "pages.modelConfig.clientArgsPlaceholder",
              })}
            />
          </Form.Item>

          <Form.Item
            name="requestArgs"
            label={intl.formatMessage({ id: "pages.modelConfig.requestArgs" })}
          >
            <TextArea
              rows={4}
              placeholder={intl.formatMessage({
                id: "pages.modelConfig.requestArgsPlaceholder",
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ModelConfigPage;
