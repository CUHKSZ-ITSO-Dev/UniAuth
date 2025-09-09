import React, { useState } from 'react';
import { Typography, Button, message } from 'antd';
import { PageContainer, ProCard, EditableProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';

const { Title, Text } = Typography;

// 定义模型配置的类型
interface ModelConfig {
	id: string;
	modelName: string;
}

const ModelListPage: React.FC = () => {
	// 50个预设测试模型数据
	const dataSource: ModelConfig[] = [
		{ id: '1', modelName: '模型1' },
		{ id: '2', modelName: '模型2' },
		{ id: '3', modelName: '模型3' },
		{ id: '4', modelName: '模型4' },
		{ id: '5', modelName: '模型5' },
		{ id: '6', modelName: '模型6' },
		{ id: '7', modelName: '模型7' },
		{ id: '8', modelName: '模型8' },
		{ id: '9', modelName: '模型9' },
		{ id: '10', modelName: '模型10' },
		{ id: '11', modelName: '模型11' },
		{ id: '12', modelName: '模型12' },
		{ id: '13', modelName: '模型13' },
		{ id: '14', modelName: '模型14' },
		{ id: '15', modelName: '模型15' },
		{ id: '16', modelName: '模型16' },
		{ id: '17', modelName: '模型17' },
		{ id: '18', modelName: '模型18' },
		{ id: '19', modelName: '模型19' },
		{ id: '20', modelName: '模型20' }
	];

	

	// 表格列配置
	const columns: ProColumns<ModelConfig>[] = [
		{
			title: '模型编号',
			dataIndex: 'id',
			key: 'id',
			filters: false,
			onFilter: true,
		},
		{
			title: '模型名称',
			dataIndex: 'modelName',
			key: 'modelName',
		},
		// 操作列
		{
			title: '操作',
			dataIndex: 'action',
			valueType: 'option',
			render: (_, row) => [
				
			],
		},
	];

	// 模拟数据源函数，不分页
	const request = () => {
		return Promise.resolve({
			data: dataSource,
			success: true,
			total: dataSource.length,
		});
	};

	return (
		<PageContainer>
			<ProCard>
				<Title level={4}>模型配置列表</Title>
				<Text type="secondary">管理系统中的所有模型配置</Text>
				<EditableProTable
					columns={columns}
					request={request}
					rowKey="id"
					pagination={false}
					editable={{}} // 启用编辑功能的基础配置
				/>
			</ProCard>
		</PageContainer>
	);
};

export default ModelListPage;
