import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Table, Space, Modal, Form, Input } from "antd";
import { useRef, useState } from "react";
import { postAuthAdminPoliciesAdd, postAuthAdminPoliciesOpenApiDelete, postAuthAdminPoliciesEdit } from  "@/services/uniauth-umi/crud"; 
import { postAuthAdminPoliciesFilter } from "@/services/uniauth-umi/query"; 
import { title } from "process";
import { set } from "lodash";

const { Title, Text } = Typography;

// 定义 Policy 类
interface onePolicy {
  sub : string;
  obj : string;
  act : string;
  eft : string;
}

const PolicyListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  
  // 获取 Policy 列表
  const policyListRequest = async () => {
    const res = await postAuthAdminPoliciesFilter({
      subs: [],
      objs: [],
      acts: [],
    });
    return {
      data: res.policies?.map((policy: string[]) => ({
      sub: policy[0],
      obj: policy[1],
      act: policy[2],
      eft: policy[3],
      })),
      success: true,
    };
  };

  //事件处理函数：编辑
  function handleEdit(record: onePolicy) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const showModal = () => {
      setIsModalVisible(true);
      form.setFieldsValue({
        sub: record.sub,
        obj: record.obj,
        act: record.act,
      });
    };

    const handleOk = async () => {
      const values = await form.validateFields();
      await postAuthAdminPoliciesEdit({
        oldPolicy: [record.sub, record.obj, record.act],
        newPolicy: [values.sub, values.obj, values.act],
      });
      setIsModalVisible(false);
    };
    const handleCancel = () => {
      setIsModalVisible(false);
    };
    return (
      <>
        <a onClick={showModal}>编辑</a>
        <Modal title="编辑 Policy 规则" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
          <Form form={form} layout="vertical">
            <Form.Item name="sub" label="主体" rules={[{ required: true, message: "请输入主体" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="obj" label="对象" rules={[{ required: true, message: "请输入对象" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="act" label="操作" rules={[{ required: true, message: "请输入操作" }]}>
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }

  // 事件处理函数：删除
  const handleDelete = async (record: onePolicy) => {
    await postAuthAdminPoliciesOpenApiDelete({
      polices: [
        [record.sub, record.obj, record.act],
      ],
    });
    if (actionRef.current) {
      actionRef.current.reload();
    }
  };

  // 事件处理函数：添加
  const handleAdd = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const showModal = () => {
      setIsModalVisible(true);
      form.resetFields();
    };
    const handleOk = async () => {
      const values = await form.validateFields();
      await postAuthAdminPoliciesAdd({
        polices: [
          [values.sub, values.obj, values.act, values.eft]
        ]
      });
      setIsModalVisible(false);
      if (actionRef.current) {
        actionRef.current.reload();
      }
    };
    const handleCancel = () => {
      setIsModalVisible(false);
    };
    return (
      <>
        <Button type="primary" onClick={showModal}>
          添加新的规则
        </Button>
        <Modal title="添加新的 Policy 规则" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
          <Form form={form} layout="vertical">
            <Form.Item name="sub" label="主体" rules={[{ required: true, message: "请输入主体" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="obj" label="对象" rules={[{ required: true, message: "请输入对象" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="act" label="操作" rules={[{ required: true, message: "请输入操作" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="eft" label="效果" rules={[{ required: true, message: "请输入效果" }]}>
              <Input defaultValue="allow" />
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

  const columns: ProColumns<onePolicy>[] = [
    {
      title: "主体",
      dataIndex: "sub",
      valueType: "text",
      align: "center",
      width: "25%",
      ellipsis: true,
      search: true,
    },
    {
      title: "对象",
      dataIndex: "obj",
      valueType: "text",
      align: "center",
      width: "25%",
      ellipsis: true,
      search: true,
    },
    {
      title: "操作",
      dataIndex: "act",
      valueType: "option",
      align: "center",
      width: "25%",
      ellipsis: true,
      search: true,
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <a style={{ marginRight: 16 }} key="edit" onClick={() => handleEdit(record)}>
            编辑
          </a>
          <Popconfirm
            key="delete"
            title="确定删除该规则吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          />
            <a style={{ marginRight: 16 }} color="red" onClick={() => handleDelete(record)}>
              删除
            </a>
        </div>
      ),
    }
  ];
  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>Policy 规则列表</Title>
        <Text type="secondary">
          管理系统中的所有 Policy 规则，可用于封禁/解封用户，支持搜索、添加和删除
        </Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey="id"
          search={{ labelWidth: "auto" }}
          rowSelection={{
            selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          }}
          tableAlertRender={({
            selectedRowKeys,
            selectedRows,
            onCleanSelected,
          }) => {
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
          tableAlertOptionRender={() => {
            return (
              <Space size={16}>
                {/* 可扩展批量操作 */}
              </Space>
            );
          }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleAdd}>
              添加新的规则
            </Button>,
          ]}
          request={policyListRequest}
        />
      </ProCard>
    </PageContainer>
  );
};

export default PolicyListPage;