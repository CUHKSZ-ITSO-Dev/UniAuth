import { PageContainer } from '@ant-design/pro-components';
import React from 'react';
import { Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';
import { useIntl } from '@umijs/max';


const items: DescriptionsProps['items'] = [
  {
    label: 'upn',
    children: 'user@example.com',
    span: 3,
  },
  {
    label: 'email',
    children: 'user@example.com',
    span: 3,
  },
  {
    label: 'displayName',
    children: '111',
    span: 3,
  },
  {
    label: 'schoolStatus',
    children: '在校',
    span: 3,
  },
  {
    label: 'identityType',
    children: '学生',
    span: 3,
  },
  {
    label: 'employeeId',
    children: '001',
    span: 3,
  },
  {
    label: 'name',
    children: '张三',
    span: 3,
  },
  {
    label: 'tags',
    children: '2024级',
    span: 3,
  },
  {
    label: 'department',
    children: '计算机科学',
    span: 3,
  },
  {
    label: 'title',
    children: '222',
    span: 3,
  },
  {
    label: 'office',
    children: 'TXC',
    span: 3,
  },
  {
    label: 'officePhone',
    children: '12345678',
    span: 3,
  },
  {
    label: 'employeeType',
    children: '学生',
    span: 3,
  },
  {
    label: 'fundingTypeOrAdmissionYear',
    children: '2025',
    span: 3,
  },
  {
    label: 'studentCategoryPrimary',
    children: '本科生',
    span: 3,
  },
  {
    label: 'studentCategoryDetail',
    children: '计算机科学',
    span: 3,
  },
  {
    label: 'studentNationalityType',
    children: '中国',
    span: 3,
  },
  {
    label: 'residentialCollege',
    children: '学勤书院',
    span: 3,
  },
  {
    label: 'staffRole',
    children: '无',
    span: 3,
  },
  {
    label: 'samAccountName',
    children: '无',
    span: 3,
  },
  {
    label: 'mailNickname',
    children: 'zhangsan',
    span: 3,
  },
  {
    label: 'createdAt',
    children: '2025-09-01 10:00:00',
    span: 3,
  },
  {
    label: 'updatedAt',
    children: '2025-09-01 10:00:00',
    span: 3,
  },
];

const UserDetail: React.FC = () => {
  return (
    <PageContainer>
       <Descriptions
           bordered
           column={1}
           size="middle"
           items={items}
           labelStyle={{ 
             width: '180px', 
             backgroundColor: '#f5f5f5',
             fontWeight: 600 
           }}
           contentStyle={{ 
             padding: '12px 16px',
             backgroundColor: '#fafafa'
           }} />
    </PageContainer>
  );
};

export default UserDetail;