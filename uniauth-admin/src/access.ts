/**
 * @see https://umijs.org/docs/max/access#access
 * */

// 定义用户类型
interface User {
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
  roles?: string[];
  permissions?: string[];
}

// 权限检查函数
const checkPermission = (currentUser: User | undefined, permission: string): boolean => {
  if (!currentUser) return false;
  // 如果是admin角色，拥有所有权限，或者用户权限列表包含指定权限
  return currentUser.access === 'admin' || (currentUser.permissions?.includes(permission) ?? false);
};

// 导出access函数，符合Umi.js要求
export default function(initialState: { currentUser?: User } | undefined) {
  const { currentUser } = initialState ?? {};
  
  return {
    // 管理员权限
    canAdmin: currentUser && currentUser.access === 'admin',
    
    // 判断用户是否登录
    isLoggedIn: !!currentUser,
    
    // 通用权限检查方法
    hasPermission: (permission: string) => checkPermission(currentUser, permission),
    
    // 数据查看权限
    canViewData: checkPermission(currentUser, 'data:view'),
    
    // 数据编辑权限
    canEditData: checkPermission(currentUser, 'data:edit'),
    
    // 数据创建权限
    canCreateData: checkPermission(currentUser, 'data:create'),
    
    // 数据删除权限
    canDeleteData: checkPermission(currentUser, 'data:delete'),
    
    // 用户管理权限
    canManageUsers: checkPermission(currentUser, 'user:manage'),
    
    // 系统配置权限
    canConfigSystem: checkPermission(currentUser, 'system:config'),
  };
}
