import {
  PageContainer,
  ProCard,
  EditableProTable,
} from "@ant-design/pro-components";
import type {
  ProColumns,
  ActionType,
  EditableFormInstance,
} from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Input, Space, Table } from "antd";
import { useRef, useState } from "react";

const { Title, Text } = Typography;

// i18n配置项数据类型定义
interface I18nConfigItem {
  id: number;
  key: string;
  translations: {
    "zh-CN": string;
    "en-US": string;
  };
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 多语言编辑组件
const TranslationEditor: React.FC<{
  value?: { "zh-CN": string; "en-US": string };
  onChange?: (value: { "zh-CN": string; "en-US": string }) => void;
}> = ({ value = { "zh-CN": "", "en-US": "" }, onChange }) => {
  const handleChange = (lang: "zh-CN" | "en-US", newValue: string) => {
    const updatedValue = { ...value, [lang]: newValue };
    onChange?.(updatedValue);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: "200px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "60px", fontSize: "12px", color: "#666" }}>
          中文：
        </span>
        <Input
          size="small"
          value={value["zh-CN"]}
          onChange={(e) => handleChange("zh-CN", e.target.value)}
          placeholder="请输入中文翻译"
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "60px", fontSize: "12px", color: "#666" }}>
          英文：
        </span>
        <Input
          size="small"
          value={value["en-US"]}
          onChange={(e) => handleChange("en-US", e.target.value)}
          placeholder="请输入英文翻译"
        />
      </div>
    </div>
  );
};

// 示例数据
const i18nConfigExampleData: I18nConfigItem[] = [
  {
    id: 1,
    key: "common.ok",
    translations: {
      "zh-CN": "确定",
      "en-US": "OK",
    },
    description: "通用确认按钮文本",
    createdAt: "2024-09-01 10:23:45",
    updatedAt: "2024-09-15 14:30:12",
  },
  {
    id: 2,
    key: "common.cancel",
    translations: {
      "zh-CN": "取消",
      "en-US": "Cancel",
    },
    description: "通用取消按钮文本",
    createdAt: "2024-09-01 10:24:12",
    updatedAt: "2024-09-10 09:15:30",
  },
  {
    id: 3,
    key: "menu.dashboard",
    translations: {
      "zh-CN": "仪表板",
      "en-US": "Dashboard",
    },
    description: "导航菜单-仪表板",
    createdAt: "2024-09-02 14:05:20",
    updatedAt: "2024-09-12 16:42:18",
  },
  {
    id: 4,
    key: "menu.userManagement",
    translations: {
      "zh-CN": "用户管理",
      "en-US": "User Management",
    },
    description: "导航菜单-用户管理",
    createdAt: "2024-09-02 14:06:45",
    updatedAt: "2024-09-13 11:20:33",
  },
  {
    id: 5,
    key: "form.validation.required",
    translations: {
      "zh-CN": "此字段为必填项",
      "en-US": "This field is required",
    },
    description: "表单验证-必填项错误提示",
    createdAt: "2024-09-03 09:30:15",
    updatedAt: "2024-09-14 13:25:45",
  },
  {
    id: 6,
    key: "table.operations.edit",
    translations: {
      "zh-CN": "编辑",
      "en-US": "Edit",
    },
    description: "表格操作-编辑按钮",
    createdAt: "2024-09-03 15:18:30",
    updatedAt: "2024-09-16 10:55:22",
  },
];

// 列配置
const columns: ProColumns<I18nConfigItem>[] = [
  {
    title: "序号",
    dataIndex: "index",
    valueType: "index",
    width: 80,
    search: false,
    editable: false,
  },
  {
    title: "Key值",
    dataIndex: "key",
    valueType: "text",
    search: true,
    width: 200,
    ellipsis: true,
    copyable: true,
    editable: false,
    formItemProps: {
      rules: [
        {
          required: true,
          message: "Key值不能为空",
        },
      ],
    },
  },
  {
    title: "翻译键值",
    dataIndex: "translations",
    search: false,
    width: 300,
    render: (_, record) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>
          <span
            style={{ display: "inline-block", width: "50px", color: "#1890ff" }}
          >
            中文:
          </span>
          <span style={{ color: "#262626" }}>
            {record.translations["zh-CN"]}
          </span>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>
          <span
            style={{ display: "inline-block", width: "50px", color: "#52c41a" }}
          >
            英文:
          </span>
          <span style={{ color: "#262626" }}>
            {record.translations["en-US"]}
          </span>
        </div>
      </div>
    ),
    renderFormItem: () => <TranslationEditor />,
  },
  {
    title: "描述内容",
    dataIndex: "description",
    valueType: "text",
    search: true,
    ellipsis: true,
    width: 250,
  },
  {
    title: "操作",
    valueType: "option",
    width: 120,
    render: (_, record, __, action) => (
      <Space>
        <a
          key="edit"
          onClick={() => {
            action?.startEditable(record.id);
          }}
        >
          编辑
        </a>
        <Popconfirm
          key="delete"
          title="确定要删除该配置项吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <a style={{ color: "red" }}>删除</a>
        </Popconfirm>
      </Space>
    ),
  },
];

// 事件处理函数
function handleDelete(record: I18nConfigItem) {
  // TODO: 删除逻辑
  console.log("删除配置项", record);
}

function handleNewConfigClick() {
  // TODO: 新建配置项逻辑
  console.log("新建i18n配置项");
}

function handleBatchDeleteClick() {
  // TODO: 批量删除逻辑
  console.log("批量删除");
}

// 数据请求函数
const i18nConfigListRequest = async (params: any) => {
  // TODO: 替换为实际请求
  let data = [...i18nConfigExampleData];

  // 搜索过滤
  if (params.key) {
    data = data.filter((item) =>
      item.key.toLowerCase().includes(params.key.toLowerCase())
    );
  }
  if (params.description) {
    data = data.filter((item) => item.description.includes(params.description));
  }

  return {
    data,
    success: true,
    total: data.length,
  };
};

const ConfigI18nPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const editableFormRef = useRef<EditableFormInstance<I18nConfigItem>>(null);
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<readonly I18nConfigItem[]>([]);

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>国际化配置管理</Title>
        <Text type="secondary">
          管理系统中的所有国际化文本配置，支持多语言翻译的添加、编辑和删除
        </Text>
        <EditableProTable<I18nConfigItem>
          columns={columns}
          actionRef={actionRef}
          editableFormRef={editableFormRef}
          rowKey="id"
          search={{
            labelWidth: "auto",
            collapsed: false,
          }}
          value={dataSource}
          onChange={setDataSource}
          controlled
          recordCreatorProps={false}
          editable={{
            type: "single",
            editableKeys,
            onSave: async (rowKey, data, originRow) => {
              // TODO: 保存逻辑
              console.log("保存数据", rowKey, data);

              // 更新数据源
              const newDataSource = dataSource.map((item) =>
                item.id === data.id ? { ...data } : item
              );
              setDataSource(newDataSource);
              return true;
            },
            onCancel: async (rowKey) => {
              console.log("取消编辑", rowKey);
              return true;
            },
            onChange: setEditableRowKeys,
            actionRender: (row, config, dom) => [dom.save, dom.cancel],
          }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          }}
          tableAlertRender={({ selectedRowKeys, onCleanSelected }) => {
            return (
              <Space size={24}>
                <span>
                  已选 {selectedRowKeys.length} 项
                  <a style={{ marginInlineStart: 8 }} onClick={onCleanSelected}>
                    取消选择
                  </a>
                </span>
              </Space>
            );
          }}
          tableAlertOptionRender={({ selectedRowKeys }) => {
            return (
              <Space size={16}>
                <a
                  onClick={handleBatchDeleteClick}
                  style={{ color: selectedRowKeys.length > 0 ? "red" : "#ccc" }}
                >
                  批量删除
                </a>
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleNewConfigClick}>
              添加新配置
            </Button>,
          ]}
          request={i18nConfigListRequest}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </ProCard>
    </PageContainer>
  );
};

export default ConfigI18nPage;
