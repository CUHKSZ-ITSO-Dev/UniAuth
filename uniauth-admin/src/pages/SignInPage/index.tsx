// React is implicitly used for JSX
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Form, Input, Button, message, Card } from 'antd';
import type { FormProps } from 'antd';
import { history, useModel } from '@umijs/max';
import { flushSync } from 'react-dom';
import { postAuthUniauthLogin } from '@/services/uniauthService/auth';

/**
 * 登录页面组件
 * 提供用户登录功能
 */
export default () => {
  const [form] = Form.useForm();
  // 使用message实例代替静态方法，避免主题上下文警告
  const [messageApi, contextHolder] = message.useMessage();
  // 获取initialState和setInitialState
  const { setInitialState } = useModel('@@initialState');

  // 登录处理函数
  const handleSubmit: FormProps['onFinish'] = async (values) => {
    try {
      console.log('Login attempt with:', values);
      // 调用实际的登录API
      const response = await postAuthUniauthLogin({
        account: values.account,
        password: values.password
      });

      console.log('Login API response:', response);
      
      // 检查登录是否成功
      if (response.ok) {
        // 登录成功，创建用户信息对象
        const userInfo = {
          name: values.account === 'admin' ? '系统管理员' : values.account,
          avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
          userid: values.account,
          email: `${values.account}@example.com`,
          signature: '海纳百川，有容乃大',
          title: values.account === 'admin' ? '系统管理员' : '普通用户',
          group: values.account === 'admin' ? '管理组' : '用户组',
          access: values.account === 'admin' ? 'admin' : 'user',
        };

        console.log('Login successful, userInfo:', userInfo);
        // 保存用户信息到localStorage
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        console.log('User info saved to localStorage:', localStorage.getItem('userInfo'));
        
        // 使用flushSync确保状态更新立即生效
        flushSync(() => {
          setInitialState({ currentUser: userInfo });
        });

        messageApi.success('登录成功，即将跳转页面');
        // 登录成功后跳转到欢迎页面
        setTimeout(() => {
          console.log('Navigating to /welcome');
          history.push('/welcome');
        }, 500);
      } else {
        console.log('Login failed: invalid account or password');
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
                name="account"
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