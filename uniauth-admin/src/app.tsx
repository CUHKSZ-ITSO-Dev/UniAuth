import { LinkOutlined } from "@ant-design/icons";
import type { Settings as LayoutSettings } from "@ant-design/pro-components";
import { SettingDrawer } from "@ant-design/pro-components";
import type { RequestConfig, RunTimeLayoutConfig } from "@umijs/max";
import { Link } from "@umijs/max";
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from "@/components";
import defaultSettings from "../config/defaultSettings";
import { errorConfig } from "./requestErrorConfig";
import "@ant-design/v5-patch-for-react-19";

const isDev = process.env.NODE_ENV === "development";
// 移除不再使用的登录路径定义
// const loginPath = '/user/login';

// 定义模拟的用户类型
interface MockUser {
  name: string;
  avatar?: string;
  userid?: string;
  email?: string;
  signature?: string;
  title?: string;
  group?: string;
  tags?: { key?: string; label?: string }[];
  notifyCount?: number;
  unreadCount?: number;
  country?: string;
  access?: string;
  geographic?: {
    province?: { label?: string; key?: string };
    city?: { label?: string; key?: string };
  };
  address?: string;
  phone?: string;
}

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: MockUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<MockUser | undefined>;
}> {
  // 创建模拟的admin用户
  const mockAdminUser: MockUser = {
    name: "Admin User",
    avatar:
      "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png",
    userid: "00000001",
    email: "admin@example.com",
    signature: "海纳百川，有容乃大",
    title: "系统管理员",
    group: "前端组",
    tags: [
      {
        key: "0",
        label: "很有想法的",
      },
      {
        key: "1",
        label: "专注设计",
      },
      {
        key: "2",
        label: "辣~",
      },
      {
        key: "3",
        label: "大长腿",
      },
      {
        key: "4",
        label: "川妹子",
      },
      {
        key: "5",
        label: "海纳百川",
      },
    ],
    notifyCount: 12,
    unreadCount: 11,
    country: "China",
    access: "admin",
    geographic: {
      province: {
        label: "浙江省",
        key: "330000",
      },
      city: {
        label: "杭州市",
        key: "330100",
      },
    },
    address: "西湖区工专路 77 号",
    phone: "0752-268888888",
  };

  const fetchUserInfo = async () => {
    // 直接返回模拟用户，不需要API调用
    return mockAdminUser;
  };

  // 总是返回模拟的admin用户
  return {
    fetchUserInfo,
    currentUser: mockAdminUser,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
// @ts-expect-error
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    // waterMarkProps: {
    //   content: initialState?.currentUser?.name,
    // },
    footerRender: () => <Footer />,
    onPageChange: () => {
      // 移除登录检查
      // const { location } = history;
      // if (!initialState?.currentUser && location.pathname !== loginPath) {
      //   history.push(loginPath);
      // }
    },
    bgLayoutImgList: [
      {
        src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr",
        left: 85,
        bottom: 100,
        height: "303px",
      },
      {
        src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr",
        bottom: -68,
        right: -45,
        height: "303px",
      },
      {
        src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr",
        bottom: 0,
        left: 0,
        width: "331px",
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings || {}}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL:
    process.env.REACT_APP_ENV === "dev" ? "/api" : "http://uniauth-gf-svc:8000",
  ...errorConfig,
};
