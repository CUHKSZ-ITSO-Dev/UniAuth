import { useIntl } from "@umijs/max";
import { Form, Modal, message, Select } from "antd";
import React from "react";
import { getConfigI18NLang } from "@/services/uniauthService/i18N";

interface ExportConfigModalProps {
  visible: boolean;
  appList: Array<{ label: string; value: string }>;
  onOk: () => void;
  onCancel: () => void;
}

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  visible,
  appList,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!values.app_id) {
        message.warning("请先选择应用");
        return;
      }

      // 调用API获取语言配置
      const response = await getConfigI18NLang({
        lang: values.language,
        app_id: values.app_id,
        type: values.type,
      });

      if (response?.langpack) {
        // 创建并下载JSON文件
        const jsonStr = JSON.stringify(response.langpack, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `i18n_${values.app_id}_${values.language}_${values.type}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        message.success(
          intl.formatMessage({
            id: "pages.configI18n.export.success",
            defaultMessage: "导出成功",
          }),
        );
        onOk();
      }
    } catch (error) {
      console.error("导出失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.configI18n.export.failed",
          defaultMessage: "导出失败",
        }),
      );
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: "pages.configI18n.export.title",
        defaultMessage: "导出语言配置",
      })}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden={true}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="app_id"
          label={intl.formatMessage({
            id: "pages.configI18n.export.appId",
            defaultMessage: "选择应用",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.configI18n.export.appId.required",
                defaultMessage: "请选择要导出的应用",
              }),
            },
          ]}
        >
          <Select
            placeholder={intl.formatMessage({
              id: "pages.configI18n.export.appId.placeholder",
              defaultMessage: "请选择应用",
            })}
            options={appList}
          />
        </Form.Item>
        <Form.Item
          name="language"
          label={intl.formatMessage({
            id: "pages.configI18n.export.language",
            defaultMessage: "选择导出语言",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.configI18n.export.language.required",
                defaultMessage: "请选择要导出的语言",
              }),
            },
          ]}
        >
          <Select
            options={[
              { label: "简体中文", value: "zh-CN" },
              { label: "English", value: "en-US" },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="type"
          label={intl.formatMessage({
            id: "pages.configI18n.export.type",
            defaultMessage: "选择导出类型",
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: "pages.configI18n.export.type.required",
                defaultMessage: "请选择要导出的类型",
              }),
            },
          ]}
        >
          <Select
            options={[
              {
                label: intl.formatMessage({
                  id: "pages.configI18n.export.type.tree",
                  defaultMessage: "嵌套结构",
                }),
                value: "tree",
              },
              {
                label: intl.formatMessage({
                  id: "pages.configI18n.export.type.path",
                  defaultMessage: "路径结构",
                }),
                value: "path",
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExportConfigModal;
