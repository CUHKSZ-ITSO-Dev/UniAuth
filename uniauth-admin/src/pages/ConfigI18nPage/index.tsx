import {
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  InboxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import {
  deleteConfigI18N,
  getConfigI18NApps,
  postConfigI18N,
  postConfigI18NBatchUpload,
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
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [form] = Form.useForm();
  const actionRef = useRef<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<I18nDataType[]>([]);
  const [appList, setAppList] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [currentAppId, setCurrentAppId] = useState<string>("");

  // 加载应用列表
  useEffect(() => {
    const loadAppList = async () => {
      try {
        const response = await getConfigI18NApps();
        if (response && response.apps) {
          const options = response.apps.map((appId: string) => ({
            label: appId,
            value: appId,
          }));
          setAppList(options);
          // 如果有应用，默认选择第一个
          if (options.length > 0) {
            setCurrentAppId(options[0].value);
          }
        }
      } catch (error) {
        console.error("加载应用列表失败:", error);
        message.error("加载应用列表失败");
      }
    };

    loadAppList();
  }, []);

  const columns: ProColumns<I18nDataType>[] = [
    {
      title: intl.formatMessage({
        id: "pages.configI18n.appId",
        defaultMessage: "应用ID",
      }),
      dataIndex: "app_id",
      key: "app_id",
      hideInTable: true,
      valueType: "select",
      fieldProps: {
        placeholder: intl.formatMessage({
          id: "pages.configI18n.appId.placeholder",
          defaultMessage: "请选择应用",
        }),
        options: appList,
        value: currentAppId,
        onChange: (value: string) => {
          setCurrentAppId(value);
          // 当app_id改变时，刷新表格
          actionRef.current?.reload();
        },
        allowClear: true,
      },
      search: {
        transform: (value) => ({ app_id: value }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.search",
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
        }),
      },
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.key",
      }),
      dataIndex: "keyValue",
      key: "keyValue",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.translations",
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
      }),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.updatedAt",
      }),
      dataIndex: "updatedAt",
      key: "updatedAt",
      ellipsis: true,
      search: false,
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.actions",
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
            })}
          </Button>
          <Popconfirm
            title={intl.formatMessage({
              id: "pages.configI18n.delete.confirm.title",
            })}
            description={intl.formatMessage({
              id: "pages.configI18n.delete.confirm.description",
            })}
            onConfirm={() => handleDelete(record)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {}}
            >
              {intl.formatMessage({
                id: "pages.configI18n.delete",
              })}
            </Button>
          </Popconfirm>
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
      app_id: currentAppId || "", // 如果有当前appId则填入，否则为空让用户输入
    });

    setModalMode("edit");
    setModalVisible(true);
  };

  // 删除翻译配置
  const handleDelete = async (record: I18nDataType) => {
    if (!currentAppId) {
      message.warning("请先选择应用");
      return;
    }
    await deleteConfigI18N({ key: record.keyValue, app_id: currentAppId });
    message.success(
      intl.formatMessage({
        id: "pages.configI18n.delete.success",
      }),
    );

    // 删除成功后重新加载应用列表
    const updatedAppList = await reloadAppList();

    // 如果当前选中的 app_id 已经不在列表中（说明该应用下所有条目都被删除了）
    if (!updatedAppList.some((app) => app.value === currentAppId)) {
      // 如果还有其他应用，选择第一个；否则清空选择
      if (updatedAppList.length > 0) {
        setCurrentAppId(updatedAppList[0].value);
      } else {
        setCurrentAppId("");
      }
    }

    actionRef.current?.reload();
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
      app_id: currentAppId || "", // 如果有当前appId则填入，否则为空让用户输入
    });

    setModalMode("add");
    setModalVisible(true);
  };

  // 批量添加翻译配置
  const handleBatchAdd = () => {
    uploadForm.resetFields();
    setUploadFile(null);
    // 如果有当前appId则预填，否则让用户输入
    uploadForm.setFieldsValue({
      app_id: currentAppId || "",
    });
    setUploadModalVisible(true);
  };

  // 批量删除翻译配置
  const handleBatchDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(
        intl.formatMessage({
          id: "pages.configI18n.batchDelete.noSelection",
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
          if (!currentAppId) {
            message.warning("请先选择应用");
            return;
          }
          // 批量删除所有选中的键值
          const deletePromises = uniqueKeys.map((key) =>
            deleteConfigI18N({ key, app_id: currentAppId }),
          );

          await Promise.all(deletePromises);

          message.success(
            intl.formatMessage({
              id: "pages.configI18n.batchDelete.success",
            }),
          );

          // 批量删除成功后重新加载应用列表
          const updatedAppList = await reloadAppList();

          // 如果当前选中的 app_id 已经不在列表中（说明该应用下所有条目都被删除了）
          if (!updatedAppList.some((app) => app.value === currentAppId)) {
            // 如果还有其他应用，选择第一个；否则清空选择
            if (updatedAppList.length > 0) {
              setCurrentAppId(updatedAppList[0].value);
            } else {
              setCurrentAppId("");
            }
          }

          // 清空选择并刷新表格
          setSelectedRowKeys([]);
          setSelectedRows([]);
          actionRef.current?.reload();
        } catch (error) {
          console.error("批量删除失败:", error);
          message.error(
            intl.formatMessage({
              id: "pages.configI18n.batchDelete.error",
            }),
          );
        }
      },
    });
  };

  // 重新加载应用列表的函数
  const reloadAppList = async () => {
    try {
      const response = await getConfigI18NApps();
      if (response && response.apps) {
        const options = response.apps.map((appId: string) => ({
          label: appId,
          value: appId,
        }));
        setAppList(options);
        return options;
      }
    } catch (error) {
      console.error("重新加载应用列表失败:", error);
    }
    return [];
  };

  // 处理模态框的确认操作（新增或编辑）
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (!values.app_id) {
        message.warning("请输入应用ID");
        return;
      }

      if (modalMode === "edit") {
        // 编辑模式：更新翻译内容
        await putConfigI18N({
          key: values.key,
          zh_cn: values.zh_cn,
          en_us: values.en_us,
          description: values.description,
          app_id: values.app_id,
        });
        message.success(
          intl.formatMessage({
            id: "pages.configI18n.edit.success",
          }),
        );
      } else {
        // 新增模式：添加新的翻译配置
        const { key, zh_cn, en_us, description, app_id } = values;

        await postConfigI18N({
          key,
          zh_cn: zh_cn || "",
          en_us: en_us || "",
          description: description || "",
          app_id: app_id,
        });

        message.success(
          intl.formatMessage({
            id: "pages.configI18n.add.success",
          }),
        );

        // 新增成功后重新加载应用列表
        const updatedAppList = await reloadAppList();

        // 如果新增的 app_id 不在当前列表中，则设置为当前选中的 app_id
        if (
          updatedAppList.some((app) => app.value === app_id) &&
          currentAppId !== app_id
        ) {
          setCurrentAppId(app_id);
        }
      }

      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      console.error("操作失败:", error);

      message.error(
        intl.formatMessage({
          id: "pages.configI18n.operation.error",
        }),
      );
    }
  };

  // 处理文件上传模态框的确认操作
  const handleUploadModalOk = async () => {
    try {
      const values = await uploadForm.validateFields();

      if (!uploadFile) {
        message.warning(
          intl.formatMessage({
            id: "pages.configI18n.upload.fileRequired",
            defaultMessage: "请选择要上传的文件",
          }),
        );
        return;
      }

      if (!values.app_id) {
        message.warning("请输入应用ID");
        return;
      }

      // 获取语言显示名称
      const languageDisplayName =
        values.language === "zh-CN"
          ? intl.formatMessage({
              id: "pages.configI18n.uploadModal.language.zhCN",
              defaultMessage: "简体中文",
            })
          : intl.formatMessage({
              id: "pages.configI18n.uploadModal.language.enUS",
              defaultMessage: "英文",
            });

      // 二次确认对话框
      Modal.confirm({
        title: intl.formatMessage({
          id: "pages.configI18n.uploadModal.confirm.title",
          defaultMessage: "确认上传信息",
        }),
        content: (
          <div style={{ marginTop: 16 }}>
            <p>
              <strong>
                {intl.formatMessage({
                  id: "pages.configI18n.uploadModal.confirm.appId",
                  defaultMessage: "应用ID：",
                })}
              </strong>
              {values.app_id}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: "pages.configI18n.uploadModal.confirm.language",
                  defaultMessage: "上传语言：",
                })}
              </strong>
              {languageDisplayName} ({values.language})
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: "pages.configI18n.uploadModal.confirm.fileName",
                  defaultMessage: "文件名：",
                })}
              </strong>
              {uploadFile?.name}
            </p>
            <p style={{ color: "#ff4d4f", marginTop: 12 }}>
              {intl.formatMessage({
                id: "pages.configI18n.uploadModal.confirm.warning",
                defaultMessage:
                  "请确认上述信息无误后再继续上传，上传后将覆盖相同键值的翻译内容。",
              })}
            </p>
          </div>
        ),
        onOk: async () => {
          try {
            setUploadLoading(true);

            // 发送批量上传请求
            const response = await postConfigI18NBatchUpload(
              uploadFile,
              values.language,
              values.app_id,
            );

            setUploadLoading(false);
            setUploadModalVisible(false);

            // 根据返回结果提示成功信息
            if (response && response.count !== undefined) {
              message.success(
                intl.formatMessage(
                  {
                    id: "pages.configI18n.upload.success",
                    defaultMessage: "批量上传成功，共添加 {count} 项翻译",
                  },
                  { count: response.count },
                ),
              );
            } else {
              message.success(
                intl.formatMessage({
                  id: "pages.configI18n.upload.successGeneric",
                  defaultMessage: "批量上传成功",
                }),
              );
            }

            // 批量上传成功后重新加载应用列表
            const updatedAppList = await reloadAppList();

            // 如果上传的 app_id 不在当前列表中，则设置为当前选中的 app_id
            if (
              updatedAppList.some((app) => app.value === values.app_id) &&
              currentAppId !== values.app_id
            ) {
              setCurrentAppId(values.app_id);
            }

            // 刷新表格数据
            actionRef.current?.reload();
          } catch (error) {
            setUploadLoading(false);
            console.error("批量上传失败:", error);

            message.error(
              intl.formatMessage({
                id: "pages.configI18n.upload.error",
                defaultMessage: "批量上传失败，请检查文件格式是否正确",
              }),
            );
          }
        },
        okText: intl.formatMessage({
          id: "pages.configI18n.uploadModal.confirm.ok",
          defaultMessage: "确认上传",
        }),
        cancelText: intl.formatMessage({
          id: "pages.configI18n.uploadModal.confirm.cancel",
          defaultMessage: "取消",
        }),
        okType: "primary",
        width: 520,
      });
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  // 表格数据请求
  const columnRequest = async (params: any) => {
    const { current, pageSize, keyword } = params;

    // 如果没有选择应用，返回空数据
    if (!currentAppId) {
      return {
        data: [],
        success: true,
        total: 0,
      };
    }

    // 发送搜索请求
    const response = await postConfigI18NFilter({
      keyword: keyword || "",
      app_id: currentAppId,
      pagination: {
        page: current || 1,
        pageSize: pageSize || 10,
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
        const existingItem = groupedData.get(key);

        if (!existingItem) return;

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

    return {
      data: tableData,
      success: true,
      total: response.total || tableData.length,
    };
  };

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>
          {intl.formatMessage({
            id: "pages.configI18n.title",
          })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({
            id: "pages.configI18n.description",
          })}
        </Text>
        <ProTable<I18nDataType>
          options={false}
          columns={columns}
          rowKey={(record) => record.keyValue}
          actionRef={actionRef}
          toolBarRender={() => [
            <Button
              key="batchAdd"
              type="default"
              icon={<PlusOutlined />}
              onClick={handleBatchAdd}
            >
              {intl.formatMessage({
                id: "pages.configI18n.batchAdd",
                defaultMessage: "批量添加",
              })}
            </Button>,
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {intl.formatMessage({
                id: "pages.configI18n.add",
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
                  {intl.formatMessage(
                    {
                      id: "pages.configI18n.batchDelete.info",
                    },
                    { count: alertSelectedRowKeys.length },
                  )}
                  <a
                    style={{ marginInlineStart: 8 }}
                    onClick={() => {
                      onCleanSelected();
                      setSelectedRowKeys([]);
                      setSelectedRows([]);
                    }}
                  >
                    {intl.formatMessage({
                      id: "pages.configI18n.batchDelete.clear",
                    })}
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={() => {
            return (
              <Space size={16}>
                <a onClick={handleBatchDeleteClick}>
                  {intl.formatMessage({
                    id: "pages.configI18n.batchDelete.delete",
                  })}
                </a>
              </Space>
            );
          }}
          size="middle"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => {
              return intl.formatMessage(
                {
                  id: "pages.configI18n.pagination.total",
                },
                { total },
              );
            },
            defaultPageSize: 10,
            pageSizeOptions: ["5", "10", "20", "50", "100"],
          }}
        />
      </ProCard>

      {/* 编辑/新增模态框 */}
      <Modal
        title={
          modalMode === "edit"
            ? intl.formatMessage({
                id: "pages.configI18n.modal.edit.title",
              })
            : intl.formatMessage({
                id: "pages.configI18n.modal.add.title",
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
            name="app_id"
            label={intl.formatMessage({
              id: "pages.configI18n.form.appId",
              defaultMessage: "应用ID",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.configI18n.form.appId.required",
                  defaultMessage: "请输入应用ID",
                }),
              },
            ]}
          >
            <Input
              disabled={modalMode === "edit"}
              placeholder={intl.formatMessage({
                id: "pages.configI18n.form.appId.placeholder",
                defaultMessage: "请输入应用ID",
              })}
            />
          </Form.Item>
          <Form.Item
            name="key"
            label={intl.formatMessage({
              id: "pages.configI18n.form.key",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.configI18n.form.key.required",
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
              })}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: "pages.configI18n.form.description",
            })}
          >
            <Input.TextArea
              placeholder={intl.formatMessage({
                id: "pages.configI18n.form.description.placeholder",
              })}
              rows={2}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({
              id: "pages.configI18n.form.translations",
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

      {/* 批量上传模态框 */}
      <Modal
        title={intl.formatMessage({
          id: "pages.configI18n.uploadModal.title",
          defaultMessage: "批量上传翻译",
        })}
        open={uploadModalVisible}
        onOk={handleUploadModalOk}
        onCancel={() => {
          setUploadModalVisible(false);
          setUploadFile(null);
        }}
        confirmLoading={uploadLoading}
        width={600}
      >
        <Spin spinning={uploadLoading}>
          <Form form={uploadForm} layout="vertical">
            <Form.Item
              name="app_id"
              label={intl.formatMessage({
                id: "pages.configI18n.uploadModal.appId",
                defaultMessage: "应用ID",
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "pages.configI18n.uploadModal.appId.required",
                    defaultMessage: "请输入应用ID",
                  }),
                },
              ]}
            >
              <Input
                placeholder={intl.formatMessage({
                  id: "pages.configI18n.uploadModal.appId.placeholder",
                  defaultMessage: "请输入应用ID",
                })}
              />
            </Form.Item>

            <Form.Item
              name="language"
              label={intl.formatMessage({
                id: "pages.configI18n.uploadModal.language",
                defaultMessage: "选择语言",
              })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: "pages.configI18n.uploadModal.language.required",
                    defaultMessage: "请选择上传的语言",
                  }),
                },
              ]}
            >
              <Select
                placeholder={intl.formatMessage({
                  id: "pages.configI18n.uploadModal.language.placeholder",
                  defaultMessage: "请选择要上传的语言",
                })}
                options={[
                  {
                    value: "zh-CN",
                    label: intl.formatMessage({
                      id: "pages.configI18n.uploadModal.language.zhCN",
                      defaultMessage: "简体中文",
                    }),
                  },
                  {
                    value: "en-US",
                    label: intl.formatMessage({
                      id: "pages.configI18n.uploadModal.language.enUS",
                      defaultMessage: "英文",
                    }),
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              label={intl.formatMessage({
                id: "pages.configI18n.uploadModal.file",
                defaultMessage: "上传文件",
              })}
              required
              extra={intl.formatMessage({
                id: "pages.configI18n.uploadModal.file.description",
                defaultMessage: "请上传JSON格式的翻译文件，支持JSON文件",
              })}
            >
              {!uploadFile ? (
                <Upload.Dragger
                  name="file"
                  accept=".json"
                  maxCount={1}
                  beforeUpload={(file) => {
                    const isJSON =
                      file.type === "application/json" ||
                      file.name.endsWith(".json");
                    if (!isJSON) {
                      message.error(
                        intl.formatMessage({
                          id: "pages.configI18n.uploadModal.file.typeError",
                          defaultMessage: "只能上传JSON文件!",
                        }),
                      );
                      return Upload.LIST_IGNORE;
                    }

                    // 保存文件对象以便后续上传
                    setUploadFile(file);
                    return false; // 阻止自动上传
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    {intl.formatMessage({
                      id: "pages.configI18n.uploadModal.file.clickOrDrag",
                      defaultMessage: "点击或拖拽文件到此区域上传",
                    })}
                  </p>
                </Upload.Dragger>
              ) : (
                <Card
                  size="small"
                  style={{
                    border: "1px dashed #d9d9d9",
                    borderRadius: "6px",
                    backgroundColor: "#fafafa",
                  }}
                  bodyStyle={{ padding: "16px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <FileOutlined
                      style={{
                        fontSize: "24px",
                        color: "#1890ff",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: 500,
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {uploadFile.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#8c8c8c" }}>
                        {intl.formatMessage({
                          id: "pages.configI18n.uploadModal.file.size",
                          defaultMessage: "文件大小：",
                        })}
                        {(uploadFile.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      danger
                      onClick={() => {
                        setUploadFile(null);
                      }}
                    >
                      {intl.formatMessage({
                        id: "pages.configI18n.uploadModal.file.remove",
                        defaultMessage: "移除",
                      })}
                    </Button>
                  </div>
                </Card>
              )}
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </PageContainer>
  );
};

export default ConfigI18nPage;
