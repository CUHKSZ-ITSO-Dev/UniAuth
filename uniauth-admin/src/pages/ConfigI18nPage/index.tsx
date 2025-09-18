import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import {
  Typography,
  Space,
  message,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import React, { useState, useRef } from "react";
import { useIntl } from "@umijs/max";
import {
  postConfigI18NFilter,
  putConfigI18N,
  postConfigI18N,
  deleteConfigI18N,
  getConfigI18N,
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<I18nDataType | null>(null);
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
        style: { width: 400 },
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
      width: 120,
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
    setEditingRecord(record);
    form.setFieldsValue({
      lang: record.langCode,
      key: record.keyValue,
      value: record.value,
      description: record.description,
    });
    setEditModalVisible(true);
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
        { key: record.keyValue }
      ),
      onOk: async () => {
        try {
          await deleteConfigI18N({ key: record.keyValue });
          message.success(
            intl.formatMessage({
              id: "pages.configI18n.delete.success",
              defaultMessage: "删除成功",
            })
          );
          actionRef.current?.reload();
        } catch (error) {
          console.error("删除失败:", error);
          message.error(
            intl.formatMessage({
              id: "pages.configI18n.delete.error",
              defaultMessage: "删除失败",
            })
          );
        }
      },
    });
  };

  // 新增翻译配置
  const handleAdd = () => {
    form.resetFields();
    setEditingRecord(null);
    setAddModalVisible(true);
  };

  // 批量删除翻译配置
  const handleBatchDeleteClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning(
        intl.formatMessage({
          id: "pages.configI18n.batchDelete.noSelection",
          defaultMessage: "请至少选择一项进行删除",
        })
      );
      return;
    }

    // 获取所有选中的唯一键值
    const uniqueKeys = Array.from(
      new Set(selectedRows.map((row) => row.keyValue))
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
        { count: uniqueKeys.length }
      ),
      onOk: async () => {
        try {
          // 批量删除所有选中的键值
          const deletePromises = uniqueKeys.map((key) =>
            deleteConfigI18N({ key })
          );

          await Promise.all(deletePromises);

          message.success(
            intl.formatMessage({
              id: "pages.configI18n.batchDelete.success",
              defaultMessage: "批量删除成功",
            })
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
            })
          );
        }
      },
    });
  };

  // 处理模态框的确认操作（新增或编辑）
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        // 编辑模式
        // 注意：当前API类型定义暂不支持description字段
        // 等API更新后可添加: description: values.description,
        await putConfigI18N({
          lang: values.lang,
          key: values.key,
          value: values.value,
        });
        message.success(
          intl.formatMessage({
            id: "pages.configI18n.edit.success",
            defaultMessage: "编辑成功",
          })
        );
        setEditModalVisible(false);
      } else {
        // 新增模式
        // 注意：当前API类型定义暂不支持description字段
        // 等API更新后可添加: description: values.description,
        await postConfigI18N({
          lang: values.lang,
          key: values.key,
          value: values.value,
        });
        message.success(
          intl.formatMessage({
            id: "pages.configI18n.add.success",
            defaultMessage: "添加成功",
          })
        );
        setAddModalVisible(false);
      }

      actionRef.current?.reload();
    } catch (error) {
      console.error("操作失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.configI18n.operation.error",
          defaultMessage: "操作失败",
        })
      );
    }
  };

  // 表格数据请求
  const columnRequest = async (params: any) => {
    const { current, pageSize, keyword, ...searchParams } = params;

    // 构建搜索条件
    const filter: API.I18nFilterGroup = {
      logic: "or",
      conditions: [],
    };

    if (keyword) {
      // 搜索字段：键值、语言、翻译内容、描述
      const searchFields = ["key", "langCode", "value", "description"];
      searchFields.forEach((field) => {
        filter.conditions!.push({
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
      const tableData: I18nDataType[] = response.i18nItems.map(
        (item, index) => ({
          key: `${item.langCode}-${item.key}`,
          langCode: item.langCode || "",
          keyValue: item.key || "",
          value: item.value || "",
          description: item.description || "",
          createdAt: item.createdAt || "",
          updatedAt: item.updatedAt || "",
        })
      );

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
          loading={false}
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
            selectedRows: alertSelectedRows,
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

      {/* 编辑模态框 */}
      <Modal
        title={
          editingRecord
            ? intl.formatMessage({
                id: "pages.configI18n.modal.edit.title",
                defaultMessage: "编辑配置",
              })
            : intl.formatMessage({
                id: "pages.configI18n.modal.add.title",
                defaultMessage: "新增配置",
              })
        }
        open={editModalVisible || addModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setEditModalVisible(false);
          setAddModalVisible(false);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="lang"
            label={intl.formatMessage({
              id: "pages.configI18n.form.lang",
              defaultMessage: "语言",
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.configI18n.form.lang.required",
                  defaultMessage: "请选择语言",
                }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({
                id: "pages.configI18n.form.lang.placeholder",
                defaultMessage: "请选择语言",
              })}
              showSearch
              allowClear
              disabled={!!editingRecord} // 编辑时不允许修改语言
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
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: "pages.configI18n.form.key.required",
                  defaultMessage: "请输入键值",
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: "pages.configI18n.form.key.placeholder",
                defaultMessage: "例如：navBar.title",
              })}
              disabled={!!editingRecord} // 编辑时不允许修改键值
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
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigI18nPage;
