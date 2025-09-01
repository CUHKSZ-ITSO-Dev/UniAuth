import React from 'react';
import { useRequest } from '@umijs/max';
import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { 
  Col, 
  Row, 
  Card, 
  Typography, 
  Spin, 
  Divider 
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  SafetyCertificateOutlined, 
  AppstoreOutlined 
} from '@ant-design/icons';
import { Bar, Line, Column } from '@ant-design/charts';
import dayjs from 'dayjs';
import { getStats } from '@/services/uniauth-umi/permissionManagement';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const { data: stats, loading } = useRequest<Record<string, any>>(
    () => getStats(),
    {
      refreshDeps: [],
      formatResult: (res) => res,
    },
  );
  
  // 创建一个类型安全的数据对象
  const statsData = stats as Record<string, any> | undefined;

  // 用户组分布数据
  const groupData = statsData ? Object.entries(statsData.groupDistribution || {}).map(
    ([name, value]) => ({
      name,
      value,
    })
  ) : [];

  console.log(groupData);

  // 活动趋势数据
  const activityData = statsData ? (statsData.recentActivity || []).map((item: { timestamp: string; count: number }) => ({
    date: dayjs(item.timestamp).format('MM月DD日'),
    value: item.count,
  })) : [];

  if (loading) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={4}>系统概览</Title>
          <Divider style={{ margin: '12px 0 24px' }} />
        </Col>
        
        {/* 统计卡片 */}
        <Col xs={24} sm={12} md={6}>
          <ProCard hoverable>
            <StatisticCard
              statistic={{
                title: '总用户数',
                value: statsData?.totalUsers ?? 0,
                icon: <UserOutlined style={{ color: '#1677ff' }} />,
              }}
            />
          </ProCard>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <ProCard hoverable>
            <StatisticCard
              statistic={{
                title: '活跃用户数',
                value: statsData?.activeUsers ?? 0,
                icon: <TeamOutlined style={{ color: '#52c41a' }} />,
              }}
            />
          </ProCard>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <ProCard hoverable>
            <StatisticCard
              statistic={{
                title: '总权限数',
                value: statsData?.totalPermissions ?? 0,
                icon: <SafetyCertificateOutlined style={{ color: '#faad14' }} />,
              }}
            />
          </ProCard>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <ProCard hoverable>
            <StatisticCard
              statistic={{
                title: '抽象组数',
                value: statsData?.abstractGroups ?? 0,
                icon: <AppstoreOutlined style={{ color: '#722ed1' }} />,
              }}
            />
          </ProCard>
        </Col>
        
        {/* 图表 */}
        <Col xs={24} md={12}>
          <Card title="用户组分布" variant='borderless'>
            <Column
              data={groupData}
              xField="name"
              yField="value"
              height={300}
            />
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="权限变更趋势 (近7天)" variant='borderless'>
            <Line
              data={activityData}
              xField="date"
              yField="value"
              point={{
                size: 5,
                shape: 'diamond',
              }}
              smooth
              height={300}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default DashboardPage;