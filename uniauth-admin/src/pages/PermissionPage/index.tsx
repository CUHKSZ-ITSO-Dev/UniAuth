import { Card, Typography, Divider, Tag, Avatar } from 'antd';
import { useAccess, Access, useModel } from '@umijs/max';
import { AccessButton } from '@/components';

const { Title, Paragraph } = Typography;

/**
 * 权限演示页面
 * 展示如何使用Ant Design Pro的权限控制功能进行页面内权限管理
 */
export default () => {
  const access = useAccess();
  
  // 使用useModel从initialState获取用户信息
  const { initialState } = useModel('@@initialState');
  
  // 获取当前登录用户信息
  const currentUser = initialState?.currentUser || {
    name: '未登录',
    avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
    access: 'guest',
    permissions: []
  };
  
  
  // 根据用户角色获取对应的视图标签颜色
  const getRoleTagColor = () => {
    return 'blue'; // 只保留管理员的蓝色标签
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <Card title="权限控制" extra={<Tag color={getRoleTagColor()}>管理员视图</Tag>}>
        <Title level={4}>用户信息</Title>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <Avatar size={64} src={currentUser.avatar} style={{ marginRight: '16px' }} />
          <div>
            <Paragraph>
              当前用户: {currentUser.name}<br />
              用户角色: 管理员<br />
              
            </Paragraph>
          </div>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          
          {access.canViewData && (
            <Card type="inner" title="数据查看权限区域">
              <Paragraph>
                拥有数据查看权限的用户可以看到这个区域的内容。
              </Paragraph>
              <div style={{ marginTop: '16px' }}>
                <AccessButton type="default" permission="data:view" onClick={() => console.log('查看详细数据')}>
                  查看详细数据
                </AccessButton>
              </div>
            </Card>
          )}
          
          {access.canEditData && (
            <Card type="inner" title="数据编辑权限区域">
              <Paragraph>
                拥有数据编辑权限的用户可以看到这个区域的内容。
              </Paragraph>
              <div style={{ marginTop: '16px' }}>
                <AccessButton type="default" permission="data:edit" onClick={() => console.log('编辑数据')}>
                  编辑数据
                </AccessButton>
              </div>
            </Card>
          )}
        </div>
        
        
        <div style={{ marginBottom: '16px' }}>
          <Access 
            accessible={access.canCreateData}
            fallback={<div style={{ color: '#ccc', padding: '16px 0' }}>无创建数据权限</div>}
          >
            <Card type="inner" title="数据创建权限区域" extra={<Tag color="green">创建权限</Tag>}>
              <Paragraph>
                拥有数据创建权限的用户可以看到这个区域的内容。
              </Paragraph>
              <div style={{ marginTop: '16px' }}>
                <AccessButton type="primary" permission="data:create" onClick={() => console.log('创建新数据')}>
                  创建新数据
                </AccessButton>
              </div>
            </Card>
          </Access>
        </div>
        
        <div>
          <Access 
            accessible={access.canDeleteData}
            fallback={<div style={{ color: '#ccc', padding: '16px 0' }}>无删除数据权限</div>}
          >
            <Card type="inner" title="数据删除权限区域" extra={<Tag color="red">删除权限</Tag>}>
              <Paragraph>
                拥有数据删除权限的用户可以看到这个区域的内容。
              </Paragraph>
              <div style={{ marginTop: '16px' }}>
                <AccessButton type="default" danger permission="data:delete" onClick={() => console.log('删除选中数据')}>
                  删除选中数据
                </AccessButton>
              </div>
            </Card>
          </Access>
        </div>
        
        <Divider>
          <Title level={5}>您的权力</Title>
        </Divider>
        
        <div style={{ marginBottom: '24px' }}>
          {currentUser.access === 'admin' && (
            <Card type="inner" title="管理员控制台" extra={<Tag color="blue">ADMIN</Tag>}>
              <Paragraph>
                管理员用户可以执行所有操作，包括系统配置、用户管理和所有数据操作。
              </Paragraph>
              <ul style={{ marginTop: '16px' }}>
                <li>可以查看、创建、编辑和删除所有数据</li>
                <li>可以管理所有用户账号</li>
                <li>可以配置系统参数</li>
              </ul>
            </Card>
          )}
        </div>
        
      </Card>
    </div>
  );
};