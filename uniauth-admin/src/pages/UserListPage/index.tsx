import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Typography, Space } from 'antd';
import React from 'react';
import { useIntl } from '@umijs/max';

const { Title, Text } = Typography;

interface DataType {
  key: React.Key;
  name: string;
  email: string;
}

const data: DataType[] = [
  {
    key: '1',
    name: 'lall',
    email: '12xxx@link',

  },
  {
    key: '2',
    name: 'lall',
    email: '12xxx@link',

  },
  {
    key: '3',
    name: 'lall',
    email: '12xxx@link',
    
  },
];

const UserListPage: React.FC = () => {
  const intl = useIntl();

  const columns: ProColumns<DataType>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.userList.name',
        defaultMessage: '姓名',
      }),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: intl.formatMessage({
        id: 'pages.userList.email',
        defaultMessage: '邮箱',
      }),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: intl.formatMessage({
        id: 'pages.userList.actions',
        defaultMessage: '操作',
      }),
      key: 'action',
      render: (_: any, record: DataType) => (
        <Space size="middle">
          <a href={`/user-list/userDetail/${record.key}`}>
            {intl.formatMessage({
              id: 'pages.userList.detail',
              defaultMessage: '详情',
            })}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <Title level={4}>
          {intl.formatMessage({
            id: 'pages.userList.title',
            defaultMessage: '用户列表',
          })}
        </Title>
        <Text type="secondary">
          {intl.formatMessage({
            id: 'pages.userList.description',
            defaultMessage: '管理系统中的所有用户及其权限',
          })}
        </Text>
        <ProTable<DataType>
          dataSource={data}
          columns={columns}
          rowKey="key"
          search={false}
        />
      </ProCard>
    </PageContainer>
  );
};

export default UserListPage;