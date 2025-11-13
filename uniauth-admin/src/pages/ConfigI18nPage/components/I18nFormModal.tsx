import { useIntl } from "@umijs/max";
import { Form, Input, Modal, Tag } from "antd";
import React, { useEffect } from "react";

interface I18nFormModalProps {
  visible: boolean;
  mode: "add" | "edit";
  initialValues?: {
    app_id?: string;
    key?: string;
    zh_cn?: string;
    en_us?: string;
    description?: string;
  };
  onOk: (values: {
    app_id: string;
    key: string;
    zh_cn: string;
    en_us: string;
    description: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const I18nFormModal: React.FC<I18nFormModalProps> = ({
  visible,
  mode,
  initialValues,
  onOk,
  onCancel,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();

  // 当 visible 或 initialValues 变化时，更新表单值
  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values);
      form.resetFields();
    } catch (error) {
      // 表单验证失败，不关闭模态框
      console.error("表单验证失败:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        mode === "edit"
          ? intl.formatMessage({
              id: "pages.configI18n.modal.edit.title",
            })
          : intl.formatMessage({
              id: "pages.configI18n.modal.add.title",
            })
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
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
            disabled={mode === "edit"}
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
            disabled={mode === "edit"}
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
  );
};

export default I18nFormModal;
