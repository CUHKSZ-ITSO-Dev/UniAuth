import { FileOutlined, InboxOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { Card, Form, Input, Modal, message, Select, Spin, Upload } from "antd";
import React, { useEffect, useState } from "react";

interface BatchUploadModalProps {
  visible: boolean;
  initialAppId?: string;
  onOk: (
    file: File,
    language: "zh-CN" | "en-US",
    appId: string,
  ) => Promise<void>;
  onCancel: () => void;
}

const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  visible,
  initialAppId,
  onOk,
  onCancel,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // 当 visible 或 initialAppId 变化时，更新表单值
  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        app_id: initialAppId || "",
      });
      setUploadFile(null);
    }
  }, [visible, initialAppId, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

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
            setLoading(true);
            await onOk(
              uploadFile,
              values.language as "zh-CN" | "en-US",
              values.app_id,
            );
            setLoading(false);
            form.resetFields();
            setUploadFile(null);
          } catch (error) {
            setLoading(false);
            throw error;
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

  const handleCancel = () => {
    form.resetFields();
    setUploadFile(null);
    onCancel();
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: "pages.configI18n.uploadModal.title",
        defaultMessage: "批量上传翻译",
      })}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
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
                      {(uploadFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <a
                    onClick={() => {
                      setUploadFile(null);
                    }}
                  >
                    {intl.formatMessage({
                      id: "pages.configI18n.uploadModal.file.remove",
                      defaultMessage: "删除",
                    })}
                  </a>
                </div>
              </Card>
            )}
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default BatchUploadModal;
