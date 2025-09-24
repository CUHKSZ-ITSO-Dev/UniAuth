import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Form, Input, Button, message, Card } from 'antd';
import type { FormProps } from 'antd';

/**
 * 登录页面组件
 * 提供用户登录功能
 */
export default () => {
  const [form] = Form.useForm();
  // 使用message实例代替静态方法，避免主题上下文警告
  const [messageApi, contextHolder] = message.useMessage();

  // 登录处理函数
  const handleSubmit: FormProps['onFinish'] = async (values) => {
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
    <>
      {contextHolder}
      <div 
        style={{
          backgroundColor: '#f0f2f5',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}
      >
        <div style={{ width: '100%', maxWidth: '368px' }}>
          <Card style={{ overflow: 'hidden', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>登录</h2>
              <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.45)' }}>Sign In</p>
            </div>
            
            <Form
              form={form}
              name="login"
              layout="vertical"
              onFinish={handleSubmit}
              style={{ width: '100%' }}
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入账户 | Please input account' },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined className="prefixIcon" />}
                  placeholder="账户 | Account"
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    marginBottom: '16px'
                  }}
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码 | Please input password' },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className="prefixIcon" />}
                  placeholder="密码 | Password"
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    marginBottom: '24px'
                  }}
                />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  style={{
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff'
                  }}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
};