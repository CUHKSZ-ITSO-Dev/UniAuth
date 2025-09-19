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
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import React, { useRef, useState } from "react";
import {
  deleteConfigI18N,
  getConfigI18N,
  postConfigI18N,
  postConfigI18NFilter,
  putConfigI18N,
} from "@/services/uniauthService/i18N";

const { Title, Text } = Typography;

interface I18nDataType {
  key: string;
  langCode: string;
  keyValue: string;
  value: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const ConfigI18nPage: React.FC = () => {
  const intl = useIntl();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form] = Form.useForm();
  const actionRef = useRef<any>(null);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<I18nDataType[]>([]);

  // 获取可用语言列表
  React.useEffect(() => {
    const fetchLangs = async () => {
      try {
        const response = await getConfigI18N();
        if (response.langs) {
          setAvailableLangs(response.langs);
        }
      } catch (error) {
        console.error("获取语言列表失败:", error);
      }
    };
    fetchLangs();
  }, []);

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
        id: "pages.configI18n.lang",
        defaultMessage: "语言",
      }),
      dataIndex: "langCode",
      key: "langCode",
      search: false,
      render: (text: any, record: I18nDataType) => {
        // 为不同语言定义不同颜色
        const getLanguageColor = (lang: string) => {
          const colorMap: Record<string, string> = {
            zh: "#2db7f5",
            "en-US": "#87d068",
          };
          return colorMap[lang] || "#2db7f5";
        };

        const langCode = text || record.langCode || "";
        return (
          <Tag color={getLanguageColor(langCode)} bordered={false}>
            {langCode}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.value",
        defaultMessage: "翻译内容",
      }),
      dataIndex: "value",
      key: "value",
      ellipsis: true,
      search: false,
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
    form.setFieldsValue({
      lang: record.langCode,
      key: record.keyValue,
      value: record.value,
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

    // 为新增模式初始化翻译对象
    const initialTranslations = availableLangs.reduce(
      (acc, lang) => {
        acc[lang] = "";
        return acc;
      },
      {} as Record<string, string>,
    );

    form.setFieldsValue({
      key: "",
      description: "",
      translations: initialTranslations,
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
        // 编辑模式：单个语言编辑
        await putConfigI18N({
          lang: values.lang,
          key: values.key,
          value: values.value,
          description: values.description,
        });
        message.success(
          intl.formatMessage({
            id: "pages.configI18n.edit.success",
            defaultMessage: "编辑成功",
          }),
        );
      } else {
        // 新增模式：为每个语言发送单独的新增请求
        const { key, description, translations } = values;

        if (!translations || Object.keys(translations).length === 0) {
          message.error(
            intl.formatMessage({
              id: "pages.configI18n.add.noTranslations",
              defaultMessage: "请至少为一种语言添加翻译",
            }),
          );
          return;
        }

        // 并行发送所有语言的新增请求
        const addPromises = Object.entries(translations)
          .filter(
            ([_, value]) =>
              value && typeof value === "string" && value.trim() !== "",
          ) // 过滤空值
          .map(([lang, value]) =>
            postConfigI18N({
              lang,
              key,
              value: value as string,
              description: description || "",
            }),
          );

        if (addPromises.length === 0) {
          message.error(
            intl.formatMessage({
              id: "pages.configI18n.add.noValidTranslations",
              defaultMessage: "请输入有效的翻译内容",
            }),
          );
          return;
        }

        await Promise.all(addPromises);

        message.success(
          intl.formatMessage(
            {
              id: "pages.configI18n.add.success",
              defaultMessage: "成功为 {count} 种语言添加配置",
            },
            { count: addPromises.length },
          ),
        );
      }

      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      console.error("操作失败:", error);

      // 更详细的错误处理
      if (modalMode === "add" && error && typeof error === "object") {
        // 如果是批量添加失败，给出更具体的提示
        message.error(
          intl.formatMessage({
            id: "pages.configI18n.add.error.detailed",
            defaultMessage: "添加配置失败，请检查网络连接或联系管理员",
          }),
        );
      } else {
        message.error(
          intl.formatMessage({
            id: "pages.configI18n.operation.error",
            defaultMessage: "操作失败",
          }),
        );
      }
    }
  };

  // 表格数据请求
  const columnRequest = async (params: any) => {
    const { current, pageSize, keyword } = params;

    // 构建搜索条件
    const filter: API.I18nFilterGroup = {
      logic: "or",
      conditions: [],
    };

    if (keyword) {
      // 搜索字段：键值、语言、翻译内容、描述
      const searchFields = ["key", "langCode", "value", "description"];
      searchFields.forEach((field) => {
        filter.conditions?.push({
          field,
          op: "like",
          value: `%${keyword}%`,
        });
      });
      console.log("构建的搜索条件:", filter);
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

      console.log("API响应数据:", response);

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

      if (!response.i18nItems || !Array.isArray(response.i18nItems)) {
        console.warn("没有找到i18n数据");
        return {
          data: [],
          success: true,
          total: 0,
        };
      }

      // 数据转换逻辑
      const tableData: I18nDataType[] = response.i18nItems.map((item) => ({
        key: `${item.langCode}-${item.key}`,
        langCode: item.langCode || "",
        keyValue: item.key || "",
        value: item.value || "",
        description: item.description || "",
        createdAt: item.createdAt || "",
        updatedAt: item.updatedAt || "",
      }));

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
          rowKey={(record) => `${record.langCode}-${record.keyValue}`}
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
          {modalMode === "edit" ? (
            // 编辑模式：只显示单个语言的编辑字段
            <>
              <Form.Item
                name="lang"
                label={intl.formatMessage({
                  id: "pages.configI18n.form.lang",
                  defaultMessage: "语言",
                })}
              >
                <Select
                  disabled
                  placeholder={intl.formatMessage({
                    id: "pages.configI18n.form.lang.placeholder",
                    defaultMessage: "请选择语言",
                  })}
                >
                  {availableLangs.map((lang) => (
                    <Select.Option key={lang} value={lang}>
                      {lang}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="key"
                label={intl.formatMessage({
                  id: "pages.configI18n.form.key",
                  defaultMessage: "键值",
                })}
              >
                <Input
                  disabled
                  placeholder={intl.formatMessage({
                    id: "pages.configI18n.form.key.placeholder",
                    defaultMessage: "例如：navBar.title",
                  })}
                />
              </Form.Item>

              <Form.Item
                name="value"
                label={intl.formatMessage({
                  id: "pages.configI18n.form.value",
                  defaultMessage: "翻译内容",
                })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: "pages.configI18n.form.value.required",
                      defaultMessage: "请输入翻译内容",
                    }),
                  },
                ]}
              >
                <Input.TextArea
                  placeholder={intl.formatMessage({
                    id: "pages.configI18n.form.value.placeholder",
                    defaultMessage: "请输入该语言的翻译内容",
                  })}
                  rows={3}
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
            </>
          ) : (
            // 新增模式：支持为所有语言一次性填写配置
            <>
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
                  {availableLangs.map((lang) => (
                    <Form.Item
                      key={lang}
                      name={["translations", lang]}
                      label={
                        <span>
                          <Tag
                            color={
                              lang === "zh"
                                ? "#2db7f5"
                                : lang === "en-US"
                                  ? "#87d068"
                                  : "#2db7f5"
                            }
                            style={{ marginRight: 8 }}
                          >
                            {lang}
                          </Tag>
                          {intl.formatMessage({
                            id: "pages.configI18n.form.translation",
                            defaultMessage: "翻译内容",
                          })}
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
                            { lang },
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
                          { lang },
                        )}
                        rows={2}
                      />
                    </Form.Item>
                  ))}
                </div>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigI18nPage;
