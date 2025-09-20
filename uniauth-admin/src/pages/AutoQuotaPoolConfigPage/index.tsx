import { PageContainer, ProCard, ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Typography, Button, Popconfirm, message, Modal, Form, Input, InputNumber, Switch } from "antd";
import { useRef, useState } from "react";
import { useIntl } from "@umijs/max";
import {
	getConfigAutoConfig,
	postConfigAutoConfig,
	putConfigAutoConfig,
	deleteConfigAutoConfig,
} from "@/services/uniauthService/autoQuotaPoolConfig";

const { Title, Text } = Typography;

const AutoQuotaPoolConfigPage: React.FC = () => {
	const intl = useIntl();
	const actionRef = useRef<ActionType | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingRecord, setEditingRecord] = useState<API.AutoQuotaPoolItem | null>(null);
	const [form] = Form.useForm();

	const handleEdit = (record: API.AutoQuotaPoolItem) => {
		setEditingRecord(record);
		form.setFieldsValue({
			...record,
			filterGroup: record.filterGroup ? JSON.stringify(record.filterGroup, null, 2) : '',
			upnsCache: record.upnsCache ? JSON.stringify(record.upnsCache, null, 2) : '',
		});
		setModalVisible(true);
	};

	const handleDelete = async (record: API.AutoQuotaPoolItem) => {
		try {
			await deleteConfigAutoConfig({ ruleName: record.ruleName });
			message.success(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.deleteSuccess' }));
			actionRef.current?.reload();
		} catch (error) {
			message.error(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.deleteFailed' }, { error: (error as Error).message }));
		}
	};

	const handleNewConfig = () => {
		setEditingRecord(null);
		form.resetFields();
		setModalVisible(true);
	};

	const handleModalOk = async () => {
		try {
			const values = await form.validateFields();

			// 处理JSON字段
			let processedValues: any = {
				...values,
				regularQuota: values.regularQuota ? parseFloat(values.regularQuota) : null,
				priority: values.priority ? parseInt(values.priority) : null,
				enabled: values.enabled !== undefined ? values.enabled : true,
			};

			// 处理filterGroup JSON字段
			if (values.filterGroup) {
				try {
					processedValues.filterGroup = JSON.parse(values.filterGroup);
				} catch (e) {
					message.error(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailedInvalidFilterGroup' }));
					return;
				}
			}

			// 处理upnsCache JSON字段
			if (values.upnsCache) {
				try {
					processedValues.upnsCache = JSON.parse(values.upnsCache);
				} catch (e) {
					message.error(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailedInvalidUpnsCache' }));
					return;
				}
			}

			if (editingRecord) {
				// 编辑现有配置
				await putConfigAutoConfig(processedValues);
				message.success(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.updateSuccess' }));
			} else {
				// 添加新配置
				await postConfigAutoConfig(processedValues);
				message.success(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.createSuccess' }));
			}

			setModalVisible(false);
			actionRef.current?.reload();
		} catch (error: any) {
			console.error("保存自动配额池配置失败:", error);

			// 提供更详细的错误信息
			let errorMessage = intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailed' });

			// 检查是否是字段验证错误
			if (error.message && error.message.includes("ruleName")) {
				errorMessage = intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailedRuleNameRequired' });
			} else if (error.message && error.message.includes("cronCycle")) {
				errorMessage = intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailedCronCycleRequired' });
			} else if (error.message && error.message.includes("regularQuota")) {
				errorMessage = intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailedRegularQuotaInvalid' });
			}
			// 检查是否是网络或服务器错误
			else if (error.message && (error.message.includes(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.requestFailed' })) || error.message.includes("network"))) {
				errorMessage = intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailedNetworkError' });
			}
			// 其他错误
			else {
				errorMessage = error.message ? error.message : intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.saveFailedCheckInput' });
			}

			message.error(errorMessage);
		}
	};

	const handleModalCancel = () => {
		setModalVisible(false);
		form.resetFields();
	};

	const configListRequest = async (params: any) => {
		try {
			const response = await getConfigAutoConfig(params);

			if (response.items) {
				// 根据查询参数过滤数据
				let data = response.items || [];

				// 规则名称和规则说明的混合搜索
				if (params.ruleName) {
					data = data.filter((item: API.AutoQuotaPoolItem) =>
						(item.ruleName?.includes(params.ruleName) || item.description?.includes(params.ruleName))
					);
				}

				// 是否启用过滤 - 处理字符串和布尔值类型匹配问题
				if (params.enabled !== undefined) {
					const searchEnabled = params.enabled === 'true' || params.enabled === true;
					data = data.filter((item: API.AutoQuotaPoolItem) =>
						item.enabled === searchEnabled
					);
				}

				return {
					data,
					success: true,
					total: data.length,
				};
			} else {
				return {
					data: [],
					success: false,
					total: 0,
				};
			}
		} catch (error) {
			console.error("获取自动配额池配置列表失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	const columns: ProColumns<API.AutoQuotaPoolItem>[] = [
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.ruleName' }),
			dataIndex: "ruleName",
			valueType: "text",
			search: true,
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.descriptionLabel' }),
			dataIndex: "description",
			valueType: "text",
			search: false,
			render: (_, record) => record.description || <Text type="secondary">{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.notSet' })}</Text>,
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.cronCycle' }),
			dataIndex: "cronCycle",
			valueType: "text",
			search: false,
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.regularQuota' }),
			dataIndex: "regularQuota",
			valueType: "digit",
			search: false,
			render: (_, record) => record.regularQuota || <Text type="secondary">{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.notSet' })}</Text>,
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.enabled' }),
			dataIndex: "enabled",
			valueType: "select",
			search: true,
			valueEnum: {
				true: { text: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.enabledStatus' }), status: 'Success' },
				false: { text: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.disabledStatus' }), status: 'Default' },
			},
			render: (_, record) => record.enabled ? intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.enabledStatus' }) : intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.disabledStatus' }),
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.priority' }),
			dataIndex: "priority",
			valueType: "digit",
			search: false,
			render: (_, record) => record.priority || <Text type="secondary">{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.notSet' })}</Text>,
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.createdAt' }),
			dataIndex: "createdAt",
			valueType: "dateTime",
			search: false,
			width: 180,
			fieldProps: {
				format: "YYYY-MM-DD HH:mm:ss",
				showTime: true,
				style: { width: "100%" },
			},
			render: (_, record) => {
				if (record.createdAt) {
					const date = new Date(record.createdAt);
					if (!isNaN(date.getTime())) {
						return date.toLocaleString('zh-CN');
					}
				}
				return <Text type="secondary">{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.notSet' })}</Text>;
			},
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.updatedAt' }),
			dataIndex: "updatedAt",
			valueType: "dateTime",
			search: false,
			width: 180,
			fieldProps: {
				format: "YYYY-MM-DD HH:mm:ss",
				showTime: true,
				style: { width: "100%" },
			},
			render: (_, record) => {
				if (record.updatedAt) {
					const date = new Date(record.updatedAt);
					if (!isNaN(date.getTime())) {
						return date.toLocaleString('zh-CN');
					}
				}
				return <Text type="secondary">{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.notSet' })}</Text>;
			},
		},
		{
			title: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.actions' }),
			valueType: "option",
			width: 200,
			ellipsis: true,
			render: (_, record) => (
				<div style={{ textAlign: "left" }}>
					<a key="edit" onClick={() => handleEdit(record)}>
						{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.edit' })}
					</a>
					<span style={{ margin: "0 8px" }} />
					<Popconfirm
						key="delete"
						title={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.deleteConfirm' })}
						onConfirm={() => handleDelete(record)}
					>
						<a style={{ color: "red" }}>{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.delete' })}</a>
					</Popconfirm>
				</div>
			),
		},
	];

	return (
		<PageContainer>
			<ProCard>
				<Title level={4}>{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.title' })}</Title>
				<Text type="secondary">
					{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.description' })}
				</Text>
				<ProTable
					columns={columns}
					actionRef={actionRef}
					rowKey="ruleName"
					search={{ labelWidth: "auto" }}



					toolBarRender={() => [
						<Button type="primary" key="new" onClick={handleNewConfig}>
							{intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.addNew' })}
						</Button>,
					]}
					request={configListRequest}
				/>
			</ProCard>

			<Modal
				title={editingRecord ? intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.editModalTitle' }) : intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.addModalTitle' })}
				open={modalVisible}
				onOk={handleModalOk}
				onCancel={handleModalCancel}
				width={800}
				destroyOnClose
			>
				<Form
					form={form}
					layout="vertical"
					requiredMark={false}
				>
					<Form.Item
						name="ruleName"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.ruleName' })}
						rules={[{ required: true, message: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.ruleNameRequired' }) }]}
					>
						<Input placeholder={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.ruleNamePlaceholder' })} disabled={!!editingRecord} />
					</Form.Item>

					<Form.Item
						name="description"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.description' })}
					>
						<Input placeholder={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.descriptionPlaceholder' })} />
					</Form.Item>

					<Form.Item
						name="cronCycle"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.cronCycle' })}
						rules={[{ required: true, message: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.cronCycleRequired' }) }]}
					>
						<Input placeholder={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.cronCyclePlaceholder' })} />
					</Form.Item>

					<Form.Item
						name="regularQuota"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.regularQuota' })}
						rules={[{ required: true, message: intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.regularQuotaRequired' }) }]}
					>
						<InputNumber
							style={{ width: '100%' }}
							placeholder={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.regularQuotaPlaceholder' })}
							min={0}
						/>
					</Form.Item>

					<Form.Item
						name="enabled"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.enabled' })}
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>

					<Form.Item
						name="priority"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.priority' })}
					>
						<InputNumber
							style={{ width: '100%' }}
							placeholder={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.priorityPlaceholder' })}
							min={0}
						/>
					</Form.Item>

					<Form.Item
						name="filterGroup"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.filterGroup' })}
						rules={[
							{
								validator: (_, value) => {
									if (!value) return Promise.resolve();
									try {
										JSON.parse(value);
										return Promise.resolve();
									} catch (e) {
										return Promise.reject(new Error(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.jsonInvalid' })));
									}
								},
							},
						]}
					>
						<Input.TextArea
							rows={4}
							placeholder={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.filterGroupPlaceholder' })}
						/>
					</Form.Item>

					<Form.Item
						name="upnsCache"
						label={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.upnsCache' })}
						rules={[
							{
								validator: (_, value) => {
									if (!value) return Promise.resolve();
									try {
										JSON.parse(value);
										return Promise.resolve();
									} catch (e) {
										return Promise.reject(new Error(intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.jsonInvalid' })));
									}
								},
							},
						]}
					>
						<Input.TextArea
							rows={4}
							placeholder={intl.formatMessage({ id: 'pages.autoQuotaPoolConfig.upnsCachePlaceholder' })}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</PageContainer>
	);
};

export default AutoQuotaPoolConfigPage;