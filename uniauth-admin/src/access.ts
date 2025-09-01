/**
 * @see https://umijs.org/docs/max/access#access
 * */

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

export default function access(
  initialState: { currentUser?: MockUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  return {
    canAdmin: currentUser && currentUser.access === 'admin',
  };
}
