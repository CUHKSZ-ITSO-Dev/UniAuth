import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import {
  Button,
  Form,
  Input,
  Modal,
  message,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import React, { useRef, useState } from "react";
import {
  deleteConfigI18N,
  postConfigI18N,
  postConfigI18NFilter,
  putConfigI18N,
} from "@/services/uniauthService/i18N";

const { Title, Text } = Typography;

interface I18nDataType {
  key: string;
  keyValue: string;
  description: string;
  translations: Array<{
    lang: string;
    value: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const ConfigI18nPage: React.FC = () => {
  const intl = useIntl();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form] = Form.useForm();
  const actionRef = useRef<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<I18nDataType[]>([]);

  const columns: ProColumns<I18nDataType>[] = [
    {
      title: intl.formatMessage({
        id: "pages.configI18n.search",
        defaultMessage: "搜索配置",
      }),
      dataIndex: "keyword",
      key: "keyword",
      hideInTable: true,
      search: {
        transform: (value) => ({ keyword: value }),
      },
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.configI18n.search.placeholder",
          defaultMessage: "请输入键值、语言、翻译内容或描述",
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.key",
        defaultMessage: "键值",
      }),
      dataIndex: "keyValue",
      key: "keyValue",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.translations",
        defaultMessage: "翻译内容",
      }),
      dataIndex: "translations",
      key: "translations",
      search: false,
      render: (_, record: I18nDataType) => {
        // 为不同语言定义不同颜色
        const getLanguageColor = (lang: string) => {
          const colorMap: Record<string, string> = {
            zh_cn: "#2db7f5",
            en_us: "#87d068",
          };
          return colorMap[lang] || "#2db7f5";
        };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {record.translations.map((translation, index) => (
              <div
                key={`${translation.lang}-${index}`}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Tag
                  color={getLanguageColor(translation.lang)}
                  bordered={false}
                >
                  {translation.lang === "zh_cn"
                    ? "zh-CN"
                    : translation.lang === "en_us"
                      ? "en-US"
                      : translation.lang}
                </Tag>
                <span style={{ flex: 1, fontWeight: 500 }}>
                  {translation.value}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.desc",
        defaultMessage: "描述",
      }),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.actions",
        defaultMessage: "操作",
      }),
      key: "action",
      search: false,
      width: 150,
      render: (_: any, record: I18nDataType) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {intl.formatMessage({
              id: "pages.configI18n.edit",
              defaultMessage: "编辑",
            })}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            {intl.formatMessage({
              id: "pages.configI18n.delete",
              defaultMessage: "删除",
            })}
          </Button>
        </Space>
      ),
    },
  ];

  // 编辑翻译配置
  const handleEdit = (record: I18nDataType) => {
    // 为编辑模式设置表单值
    const zh_cn =
      record.translations.find((t) => t.lang === "zh_cn")?.value || "";
    const en_us =
      record.translations.find((t) => t.lang === "en_us")?.value || "";

    form.setFieldsValue({
      key: record.keyValue,
      zh_cn: zh_cn,
      en_us: en_us,
      description: record.description,
    });

    setModalMode("edit");
    setModalVisible(true);
  };

  // 删除翻译配置
  const handleDelete = (record: I18nDataType) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: "pages.configI18n.delete.confirm.title",
        defaultMessage: "确认删除",
      }),
      content: intl.formatMessage(
        {
          id: "pages.configI18n.delete.confirm.content",
          defaultMessage: '确定要删除键值 "{key}" 的所有语言配置吗？',
        },
        { key: record.keyValue },
      ),
      onOk: async () => {
        try {
          await deleteConfigI18N({ key: record.keyValue });
          message.success(
            intl.formatMessage({
              id: "pages.configI18n.delete.success",
              defaultMessage: "删除成功",
            }),
          );
          actionRef.current?.reload();
        } catch (error) {
          console.error("删除失败:", error);
          message.error(
            intl.formatMessage({
              id: "pages.configI18n.delete.error",
              defaultMessage: "删除失败",
            }),
          );
        }
      },
    });
  };

  // 新增翻译配置
  const handleAdd = () => {
    form.resetFields();

    // 为新增模式初始化表单字段
    form.setFieldsValue({
      key: "",
      zh_cn: "",
      en_us: "",
      description: "",
    });

    setModalMode("add");
    setModalVisible(true);
  };

  // 批量删除翻译配置
  const handleBatchDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(
        intl.formatMessage({
          id: "pages.configI18n.batchDelete.noSelection",
          defaultMessage: "请至少选择一项进行删除",
        }),
      );
      return;
    }

    // 获取所有选中的唯一键值
    const uniqueKeys = Array.from(
      new Set(selectedRows.map((row) => row.keyValue)),
    );

    Modal.confirm({
      title: intl.formatMessage({
        id: "pages.configI18n.batchDelete.confirm.title",
        defaultMessage: "确认批量删除",
      }),
      content: intl.formatMessage(
        {
          id: "pages.configI18n.batchDelete.confirm.content",
          defaultMessage:
            "确定要删除选中的 {count} 个键值的所有语言配置吗？此操作不可恢复。",
        },
        { count: uniqueKeys.length },
      ),
      onOk: async () => {
        try {
          // 批量删除所有选中的键值
          const deletePromises = uniqueKeys.map((key) =>
            deleteConfigI18N({ key }),
          );

          await Promise.all(deletePromises);

          message.success(
            intl.formatMessage({
              id: "pages.configI18n.batchDelete.success",
              defaultMessage: "批量删除成功",
            }),
          );

          // 清空选择并刷新表格
          setSelectedRowKeys([]);
          setSelectedRows([]);
          actionRef.current?.reload();
        } catch (error) {
          console.error("批量删除失败:", error);
          message.error(
            intl.formatMessage({
              id: "pages.configI18n.batchDelete.error",
              defaultMessage: "批量删除失败",
            }),
          );
        }
      },
    });
  };

  // 处理模态框的确认操作（新增或编辑）
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (modalMode === "edit") {
        // 编辑模式：更新翻译内容
        await putConfigI18N({
          key: values.key,
          zh_cn: values.zh_cn,
          en_us: values.en_us,
          description: values.description,
        });
        message.success(
          intl.formatMessage({
            id: "pages.configI18n.edit.success",
            defaultMessage: "编辑成功",
          }),
        );
      } else {
        // 新增模式：添加新的翻译配置
        const { key, zh_cn, en_us, description } = values;

        await postConfigI18N({
          key,
          zh_cn: zh_cn || "",
          en_us: en_us || "",
          description: description || "",
        });

        message.success(
          intl.formatMessage({
            id: "pages.configI18n.add.success",
            defaultMessage: "添加配置成功",
          }),
        );
      }

      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      console.error("操作失败:", error);

      message.error(
        intl.formatMessage({
          id: "pages.configI18n.operation.error",
          defaultMessage: "操作失败",
        }),
      );
    }
  }; // 表格数据请求
  const columnRequest = async (params: any) => {
    const { current, pageSize, keyword } = params;

    // 构建搜索条件
    const filter: API.I18nFilterGroup = {
      logic: "or",
      conditions: [],
    };

    if (keyword) {
      // 搜索字段：键值、翻译内容、描述
      const searchFields = ["key", "zhCn", "enUs", "description"];
      searchFields.forEach((field) => {
        filter.conditions?.push({
          field,
          op: "contains",
          value: `${keyword}`,
        });
      });
    }

    try {
      // 发送搜索请求
      const response = await postConfigI18NFilter({
        filter,
        pagination: {
          page: current || 1,
          pageSize: pageSize || 10,
          all: false,
        },
        sort: [
          {
            field: "key",
            order: "asc",
          },
        ],
        verbose: true,
      });

      // 增强错误边界检查
      if (!response || typeof response !== "object") {
        console.error("API返回格式错误", response);
        message.error("搜索失败，返回数据格式不正确");
        return {
          data: [],
          success: false,
          total: 0,
        };
      }

      if (!response.i18n_items || !Array.isArray(response.i18n_items)) {
        console.warn("没有找到i18n数据");
        return {
          data: [],
          success: true,
          total: 0,
        };
      }

      // 数据转换逻辑：按key分组，将同一key的不同语言合并到一行
      const groupedData = new Map<string, I18nDataType>();

      response.i18n_items.forEach((item: API.I18nItem) => {
        const key = item.key || "";

        if (groupedData.has(key)) {
          // 如果已经存在这个key，添加新的语言翻译
          const existingItem = groupedData.get(key)!;

          // 添加中文翻译
          if (item.zh_cn) {
            existingItem.translations.push({
              lang: "zh_cn",
              value: item.zh_cn,
            });
          }

          // 添加英文翻译
          if (item.en_us) {
            existingItem.translations.push({
              lang: "en_us",
              value: item.en_us,
            });
          }
        } else {
          // 创建新的分组项
          const translations = [];

          // 添加中文翻译
          if (item.zh_cn) {
            translations.push({
              lang: "zh_cn",
              value: item.zh_cn,
            });
          }

          // 添加英文翻译
          if (item.en_us) {
            translations.push({
              lang: "en_us",
              value: item.en_us,
            });
          }

          groupedData.set(key, {
            key: key,
            keyValue: key,
            description: item.description || "",
            translations: translations,
            createdAt: item.created_at || "",
            updatedAt: item.updated_at || "",
          });
        }
      });

      const tableData: I18nDataType[] = Array.from(groupedData.values());

      // 搜索结果提示
      if (keyword && tableData.length === 0) {
        message.info(`未找到包含 "${keyword}" 的配置信息`);
      }

      return {
        data: tableData,
        success: true,
        total: response.total || tableData.length,
      };
    } catch (error) {
      console.error("搜索API错误:", error);
      const errorMessage =
        error instanceof Error ? error.message : "搜索失败，请稍后重试";
      message.error(errorMessage);
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
            id: "pages.configI18n.title",
            defaultMessage: "国际化配置管理",
          })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({
            id: "pages.configI18n.description",
            defaultMessage: "管理系统中的多语言翻译配置",
          })}
        </Text>
        <ProTable<I18nDataType>
          columns={columns}
          rowKey={(record) => record.keyValue}
          actionRef={actionRef}
          toolBarRender={() => [
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {intl.formatMessage({
                id: "pages.configI18n.add",
                defaultMessage: "新增配置",
              })}
            </Button>,
          ]}
          request={columnRequest}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
            selectedRowKeys,
            onChange: (newSelectedRowKeys, newSelectedRows) => {
              setSelectedRowKeys(newSelectedRowKeys);
              setSelectedRows(newSelectedRows);
            },
          }}
          tableAlertRender={({
            selectedRowKeys: alertSelectedRowKeys,
            onCleanSelected,
          }) => {
            return (
              <Space size={24}>
                <span>
                  已选 {alertSelectedRowKeys.length} 项
                  <a
                    style={{ marginInlineStart: 8 }}
                    onClick={() => {
                      onCleanSelected();
                      setSelectedRowKeys([]);
                      setSelectedRows([]);
                    }}
                  >
                    取消选择
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={() => {
            return (
              <Space size={16}>
                <a onClick={handleBatchDeleteClick}>批量删除</a>
              </Space>
            );
          }}
          size="middle"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
        />
      </ProCard>

      {/* 编辑/新增模态框 */}
      <Modal
        title={
          modalMode === "edit"
            ? intl.formatMessage({
                id: "pages.configI18n.modal.edit.title",
                defaultMessage: "编辑配置",
              })
            : intl.formatMessage({
                id: "pages.configI18n.modal.add.title",
                defaultMessage: "新增配置",
              })
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="key"
            label={intl.formatMessage({
              id: "pages.configI18n.form.key",
              defaultMessage: "键值",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.configI18n.form.key.required",
                  defaultMessage: "请输入键值",
                }),
              },
              {
                pattern: /^[a-zA-Z_]+(\.[a-zA-Z_]+)+$/,
                message: intl.formatMessage({
                  id: "pages.configI18n.form.key.pattern",
                  defaultMessage:
                    "键值格式不正确，应该是由点分割的字符串，例如：test.temp、nav.title 等",
                }),
              },
            ]}
          >
            <Input
              disabled={modalMode === "edit"}
              placeholder={intl.formatMessage({
                id: "pages.configI18n.form.key.placeholder",
                defaultMessage: "例如：navBar.title",
              })}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: "pages.configI18n.form.description",
              defaultMessage: "描述",
            })}
          >
            <Input.TextArea
              placeholder={intl.formatMessage({
                id: "pages.configI18n.form.description.placeholder",
                defaultMessage: "请输入该配置项的描述信息（可选）",
              })}
              rows={2}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.configI18n.form.translations",
              defaultMessage: "各语言翻译",
            })}
          >
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                padding: "12px",
              }}
            >
              {[
                { lang: "zh-CN", field: "zh_cn", color: "#2db7f5" },
                { lang: "en-US", field: "en_us", color: "#87d068" },
              ].map((item) => (
                <Form.Item
                  key={item.lang}
                  name={item.field}
                  label={
                    <span>
                      <Tag color={item.color} style={{ marginRight: 8 }}>
                        {item.lang}
                      </Tag>
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage(
                        {
                          id: "pages.configI18n.form.translation.required",
                          defaultMessage: "请输入 {lang} 的翻译内容",
                        },
                        { lang: item.lang },
                      ),
                    },
                  ]}
                  style={{ marginBottom: "16px" }}
                >
                  <Input.TextArea
                    placeholder={intl.formatMessage(
                      {
                        id: "pages.configI18n.form.translation.placeholder",
                        defaultMessage: "请输入 {lang} 的翻译内容",
                      },
                      { lang: item.lang },
                    )}
                    rows={1}
                  />
                </Form.Item>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigI18nPage;
