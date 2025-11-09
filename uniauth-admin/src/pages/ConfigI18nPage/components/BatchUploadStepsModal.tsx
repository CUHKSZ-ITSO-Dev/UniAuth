import { InboxOutlined, RedoOutlined } from "@ant-design/icons";
import { ProCard, StepsForm } from "@ant-design/pro-components";
import { useIntl } from "@umijs/max";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  message,
  Select,
  Space,
  Table,
  Typography,
  Upload,
} from "antd";
import { useEffect, useState } from "react";
import { postConfigI18NBatchUpload } from "@/services/uniauthService/i18N";

const { Text } = Typography;

interface BatchUploadStepsModalProps {
  visible: boolean;
  initialAppId?: string;
  onOk: (
    file: File,
    language: "zh-CN" | "en-US",
    appId: string,
  ) => Promise<void>;
  onCancel: () => void;
}

interface PreviewData {
  key: string;
  oldValue: string;
  newValue: string;
}

const BatchUploadStepsModal: React.FC<BatchUploadStepsModalProps> = ({
  visible,
  initialAppId,
  onOk,
  onCancel,
}) => {
  const intl = useIntl();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);

  // 当 visible 或 initialAppId 变化时，重置状态
  useEffect(() => {
    if (visible) {
      setUploadFile(null);
      setPreviewData([]);
    }
  }, [visible, initialAppId]);

  // 发送预览请求
  const handlePreview = async (values: any) => {
    if (!uploadFile) {
      message.warning(
        intl.formatMessage({
          id: "pages.configI18n.upload.fileRequired",
          defaultMessage: "请选择要上传的文件",
        }),
      );
      return false;
    }

    try {
      setLoading(true);
      // 调用预览模式的批量上传接口
      const response = await postConfigI18NBatchUpload({
        file: uploadFile,
        lang: values.language,
        app_id: values.app_id,
        preview: true,
      });

      if (response) {
        // 将预览数据转换为表格所需格式
        const preview = Object.entries(response.preview_data || {}).map(
          ([key, data]: [string, any]) => ({
            key,
            ...data,
          }),
        );
        // 将有oldValue的项排在前面
        const sortedPreview = [
          ...preview.filter((item) => item.oldValue),
          ...preview.filter((item) => !item.oldValue),
        ];
        setPreviewData(sortedPreview);
        return true;
      } else {
        message.error(
          intl.formatMessage({
            id: "pages.configI18n.upload.previewFailed",
            defaultMessage: "预览失败，请重试",
          }),
        );
        return false;
      }
    } catch (error) {
      console.error("预览失败:", error);
      message.error(
        intl.formatMessage({
          id: "pages.configI18n.upload.previewFailed",
          defaultMessage: "预览失败，请重试",
        }),
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 处理最终提交
  const handleFinish = async (values: any) => {
    if (!uploadFile) {
      message.warning(
        intl.formatMessage({
          id: "pages.configI18n.upload.fileRequired",
          defaultMessage: "请选择要上传的文件",
        }),
      );
      return false;
    }

    try {
      await onOk(uploadFile, values.language, values.app_id);
      return true;
    } catch (error) {
      console.error("上传失败:", error);
      return false;
    }
  };

  const columns = [
    {
      title: intl.formatMessage({
        id: "pages.configI18n.upload.preview.key",
        defaultMessage: "键值",
      }),
      dataIndex: "key",
      key: "key",
      width: "30%",
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.upload.preview.oldValue",
        defaultMessage: "原始值",
      }),
      dataIndex: "old_value",
      key: "old_value",
      width: "35%",
      type: "text",
    },
    {
      title: intl.formatMessage({
        id: "pages.configI18n.upload.preview.newValue",
        defaultMessage: "新值",
      }),
      dataIndex: "new_value",
      key: "new_value",
      width: "35%",
      type: "text",
    },
  ];

  return (
    <Modal
      title={intl.formatMessage({
        id: "pages.configI18n.uploadModal.title",
        defaultMessage: "批量上传翻译",
      })}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
    >
      <StepsForm
        onFinish={handleFinish}
        formProps={{
          validateMessages: {
            required: "此项为必填项",
          },
        }}
        submitter={{
          render: (props: {
            step: number;
            onSubmit?: () => void;
            onPre?: () => void;
          }) => {
            if (props.step === 0) {
              return (
                <Button type="primary" onClick={() => props.onSubmit?.()}>
                  {intl.formatMessage({
                    id: "pages.configI18n.upload.preview",
                    defaultMessage: "预览上传内容",
                  })}
                </Button>
              );
            }

            return [
              <Button key="back" onClick={() => props.onPre?.()}>
                {intl.formatMessage({
                  id: "pages.configI18n.upload.back",
                  defaultMessage: "上一步",
                })}
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={loading}
                onClick={() => props.onSubmit?.()}
              >
                {intl.formatMessage({
                  id: "pages.configI18n.upload.confirm",
                  defaultMessage: "确认上传",
                })}
              </Button>,
            ];
          },
        }}
      >
        <StepsForm.StepForm
          name="base"
          title={intl.formatMessage({
            id: "pages.configI18n.upload.step1",
            defaultMessage: "选择配置",
          })}
          onFinish={handlePreview}
        >
          <Form.Item
            name="app_id"
            label={intl.formatMessage({
              id: "pages.configI18n.uploadModal.appId",
              defaultMessage: "应用ID",
            })}
            initialValue={initialAppId}
            rules={[{ required: true }]}
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
            rules={[{ required: true }]}
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
              defaultMessage: "请上传JSON格式的翻译文件",
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
                        id: "pages.configI18n.upload.invalidFormat",
                        defaultMessage: "只支持上传 JSON 格式的文件！",
                      }),
                    );
                    return Upload.LIST_IGNORE;
                  }
                  setUploadFile(file);
                  return false;
                }}
                onRemove={() => setUploadFile(null)}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  {intl.formatMessage({
                    id: "pages.configI18n.upload.dragText",
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
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <Text strong>{uploadFile.name}</Text>
                    <Button
                      type="link"
                      icon={<RedoOutlined />}
                      onClick={() => setUploadFile(null)}
                    >
                      {intl.formatMessage({
                        id: "pages.configI18n.upload.change",
                        defaultMessage: "更换文件",
                      })}
                    </Button>
                  </Space>
                </Space>
              </Card>
            )}
          </Form.Item>
        </StepsForm.StepForm>

        <StepsForm.StepForm
          name="confirm"
          title={intl.formatMessage({
            id: "pages.configI18n.upload.step2",
            defaultMessage: "确认更改",
          })}
        >
          <ProCard
            title={intl.formatMessage({
              id: "pages.configI18n.upload.preview.title",
              defaultMessage: "预览内容",
            })}
            extra={
              <Text type="secondary">
                {intl.formatMessage(
                  {
                    id: "pages.configI18n.upload.preview.total",
                    defaultMessage: "共 {total} 条记录",
                  },
                  { total: previewData.length },
                )}
              </Text>
            }
          >
            <Table
              columns={columns}
              dataSource={previewData}
              size="small"
              scroll={{ y: 300 }}
              pagination={false}
            />
          </ProCard>
        </StepsForm.StepForm>
      </StepsForm>
    </Modal>
  );
};

export default BatchUploadStepsModal;
