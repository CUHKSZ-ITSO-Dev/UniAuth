import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const UserListPage: React.FC = () => {
    return (
        <PageContainer>
            <ProCard>
                <Title level={4}>用户列表</Title>
                <Text type='secondary'>管理系统中的所有用户及其权限</Text>
                <ProTable />
            </ProCard>
        </PageContainer>
    )
}

export default UserListPage;