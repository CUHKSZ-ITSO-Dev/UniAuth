import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, Modal, Form, Input, message } from "antd";
import { useRef, useState } from "react";
import { postAuthAdminPoliciesFilter } from "@/services/uniauth-umi/query";
import { postAuthAdminPoliciesAdd, postAuthAdminPoliciesEdit, postAuthAdminPoliciesOpenApiDelete } from "@/services/uniauth-umi/crud";

const { Title, Text } = Typography;

interface Policy {
  sub: string;
  obj: string;
  act: string;
}

const PolicyListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [form] = Form.useForm();

  const handleAddPolicy = () => {
    setEditingPolicy(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditPolicy = (record: Policy) => {
    setEditingPolicy(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeletePolicy = async (record: Policy) => {
    try {
      await postAuthAdminPoliciesOpenApiDelete({
        polices: [[record.sub, "", record.obj, record.act]],
      });
      message.success("删除成功");
      actionRef.current?.reload();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingPolicy) {
        await postAuthAdminPoliciesEdit({
          oldPolicy: [
            editingPolicy.sub,
            editingPolicy.obj,
            editingPolicy.act,
          ],
          newPolicy: [values.sub, values.obj, values.act],
        });
        message.success("编辑成功");
      } else {
        await postAuthAdminPoliciesAdd({
          polices: [[values.sub, values.obj, values.act]],
        });
        message.success("添加成功");
      }
      setIsModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      message.error("操作失败");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const columns: ProColumns<Policy>[] = [
    {
      title: "Subject",
      dataIndex: "sub",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "Object",
      dataIndex: "obj",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "Action",
      dataIndex: "act",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "操作",
      valueType: "option",
      width: 200,
      align: "center",
      ellipsis: true,
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <a key="edit" onClick={() => handleEditPolicy(record)}>
            编辑
          </a >
          <span style={{ margin: "0 8px" }} />
          <Popconfirm
            key="delete"
            title="确定要删除该策略吗？"
            onConfirm={() => handleDeletePolicy(record)}
          >
            <a style={{ color: "red" }}>删除</a >
          </Popconfirm>
        </div>
      ),
    },
  ];

  const policyListRequest = async (params: any) => {
    const { current, pageSize, sub, obj, act } = params;

    const filter: API.FilterPoliciesReq = {};
    if (sub) filter.subs = [sub];
    if (obj) filter.objs = [obj];
    if (act) filter.acts = [act];

    const res = await postAuthAdminPoliciesFilter(filter);

    const policies = res.policies || [];
    const total = policies.length;
    const start = (current - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = policies.slice(start, end);

    const data = paginatedData.map((p: string[]) => ({
      sub: p[0],
      obj: p[1],
      act: p[2],
    }));

    return {
      data,
      success: true,
      total,
    };
  };

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>规则列表</Title>
        <Text type="secondary">
          管理系统中的所有规则
        </Text>
        <ProTable
          columns={columns}
          actionRef={actionRef}
          rowKey={(record) => `${record.sub}-${record.obj}-${record.act}`}
          search={{ labelWidth: "auto" }}
          toolBarRender={() => [
            <Button type="primary" key="new" onClick={handleAddPolicy}>
              添加新的规则
            </Button>,
          ]}
          request={policyListRequest}
        />
      </ProCard>
      <Modal
        title={editingPolicy ? "编辑规则" : "添加规则"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="主体" label="Subject" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="对象" label="Object" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="动作" label="Action" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PolicyListPage;