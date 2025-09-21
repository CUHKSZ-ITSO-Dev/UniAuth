import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProConfigProvider, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import { theme } from 'antd';
import { history } from '@umijs/max';

/**
 * 登录页面组件
 * 提供用户登录功能
 */
export default () => {
  const { token } = theme.useToken();
  // 使用message实例代替静态方法，避免主题上下文警告
  const [messageApi, contextHolder] = message.useMessage();

  // 登录处理函数
  const handleSubmit = async (values: {
    username: string;
    password: string;
    autoLogin?: boolean;
  }) => {
    try {
      console.log('Login attempt with:', values);
      // 模拟登录验证
      let userInfo = null;

      if (values.username === 'admin' && values.password === '123456') {
        // 管理员用户 - 拥有所有权限
        userInfo = {
          name: '系统管理员',
          avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
          userid: '00000001',
          email: `${values.username}@example.com`,
          signature: '海纳百川，有容乃大',
          title: '系统管理员',
          group: '管理组',
          access: 'admin',
          permissions: ['data:view', 'data:edit', 'data:create', 'data:delete', 'user:manage', 'system:config']
        };
      }

      // 检查用户信息是否匹配
      if (userInfo) {
        console.log('Login successful, userInfo:', userInfo);
        // 保存用户信息到localStorage
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        console.log('User info saved to localStorage:', localStorage.getItem('userInfo'));

        messageApi.success('登录成功，即将跳转页面');
        // 登录成功后跳转到欢迎页面
        setTimeout(() => {
          console.log('Navigating to /welcome');
          window.location.href = '/welcome';
        }, 500);
      } else {
        console.log('Login failed: invalid username or password');
        messageApi.error('用户名或密码错误');
      }
    } catch (error) {
      messageApi.error('登录失败，请重试');
      console.error('Login error:', error);
    }
  };

  return (
    <ProConfigProvider hashed={false}>
      {contextHolder}
      <div 
        style={{
          backgroundColor: token.colorBgContainer,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}
      >
        <div style={{ width: '100%', maxWidth: '368px', overflow: 'hidden' }}>
          <LoginForm
            title="登录"
            subTitle="Sign In"
            onFinish={handleSubmit}
            style={{
              overflow: 'hidden', // 隐藏滚动条
            }}
          >
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined className={'prefixIcon'} />,
              }}
              placeholder={'账户 | Account'}
              rules={[
                {
                  required: true,
                  message: '请输入账户 | Please input account',
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className={'prefixIcon'} />,
              }}
              placeholder={'密码 | Password'}
              rules={[
                {
                  required: true,
                  message: '请输入密码 | Please input password',
                },
              ]}
            />
          </LoginForm>
        </div>
      </div>
    </ProConfigProvider>
  );
};