CREATE TABLE config_internationalization (
    key TEXT PRIMARY KEY,
    zh_cn TEXT NOT NULL,
    en_us TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_internationalization_zh_cn ON config_internationalization (zh_cn);

CREATE INDEX idx_config_internationalization_en_us ON config_internationalization (en_us);

CREATE INDEX idx_config_internationalization_description ON config_internationalization (description);

config_internationalization (
    key,
    zh_cn,
    en_us,
    description
)
VALUES
    -- 通用操作
    (
        'common.save',
        '保存',
        'Save',
        '保存按钮文本'
    ),
    (
        'common.cancel',
        '取消',
        'Cancel',
        '取消按钮文本'
    ),
    (
        'common.delete',
        '删除',
        'Delete',
        '删除按钮文本'
    ),
    (
        'common.edit',
        '编辑',
        'Edit',
        '编辑按钮文本'
    ),
    (
        'common.add',
        '添加',
        'Add',
        '添加按钮文本'
    ),
    (
        'common.confirm',
        '确认',
        'Confirm',
        '确认按钮文本'
    ),
    (
        'common.submit',
        '提交',
        'Submit',
        '提交按钮文本'
    ),
    (
        'common.reset',
        '重置',
        'Reset',
        '重置按钮文本'
    ),
    (
        'common.search',
        '搜索',
        'Search',
        '搜索按钮文本'
    ),
    (
        'common.loading',
        '加载中...',
        'Loading...',
        '加载状态提示'
    ),
    (
        'user.login',
        '登录',
        'Login',
        '登录页面标题'
    ),
    (
        'user.logout',
        '退出登录',
        'Logout',
        '退出登录按钮'
    ),
    (
        'user.register',
        '注册',
        'Register',
        '注册页面标题'
    ),
    (
        'user.profile',
        '个人信息',
        'Profile',
        '个人信息页面'
    ),
    (
        'user.username',
        '用户名',
        'Username',
        '用户名字段'
    ),
    (
        'user.password',
        '密码',
        'Password',
        '密码字段'
    ),
    (
        'user.email',
        '邮箱',
        'Email',
        '邮箱字段'
    ),
    (
        'user.phone',
        '手机号',
        'Phone',
        '手机号字段'
    ),
    (
        'user.avatar',
        '头像',
        'Avatar',
        '用户头像'
    ),
    (
        'user.role',
        '角色',
        'Role',
        '用户角色'
    ),
    (
        'menu.dashboard',
        '仪表盘',
        'Dashboard',
        '仪表盘菜单'
    ),
    (
        'menu.user.management',
        '用户管理',
        'User Management',
        '用户管理菜单'
    ),
    (
        'menu.role.management',
        '角色管理',
        'Role Management',
        '角色管理菜单'
    ),
    (
        'menu.permission.management',
        '权限管理',
        'Permission Management',
        '权限管理菜单'
    ),
    (
        'menu.system.settings',
        '系统设置',
        'System Settings',
        '系统设置菜单'
    ),
    (
        'menu.audit.log',
        '审计日志',
        'Audit Log',
        '审计日志菜单'
    ),
    (
        'menu.organization',
        '组织架构',
        'Organization',
        '组织架构菜单'
    ),
    (
        'menu.application.management',
        '应用管理',
        'Application Management',
        '应用管理菜单'
    ),
    (
        'validation.required',
        '此字段为必填项',
        'This field is required',
        '必填字段验证提示'
    ),
    (
        'validation.email.invalid',
        '请输入有效的邮箱地址',
        'Please enter a valid email address',
        '邮箱格式验证提示'
    ),
    (
        'validation.password.length',
        '密码长度至少8位',
        'Password must be at least 8 characters',
        '密码长度验证提示'
    ),
    (
        'validation.phone.invalid',
        '请输入有效的手机号',
        'Please enter a valid phone number',
        '手机号格式验证提示'
    ),
    (
        'message.save.success',
        '保存成功',
        'Saved successfully',
        '保存成功提示'
    ),
    (
        'message.save.failed',
        '保存失败',
        'Save failed',
        '保存失败提示'
    ),
    (
        'message.delete.success',
        '删除成功',
        'Deleted successfully',
        '删除成功提示'
    ),
    (
        'message.delete.failed',
        '删除失败',
        'Delete failed',
        '删除失败提示'
    ),
    (
        'message.update.success',
        '更新成功',
        'Updated successfully',
        '更新成功提示'
    ),
    (
        'message.update.failed',
        '更新失败',
        'Update failed',
        '更新失败提示'
    ),
    (
        'status.active',
        '启用',
        'Active',
        '启用状态'
    ),
    (
        'status.inactive',
        '禁用',
        'Inactive',
        '禁用状态'
    ),
    (
        'status.pending',
        '待处理',
        'Pending',
        '待处理状态'
    ),
    (
        'status.approved',
        '已批准',
        'Approved',
        '已批准状态'
    ),
    (
        'status.rejected',
        '已拒绝',
        'Rejected',
        '已拒绝状态'
    ),
    (
        'pagination.total',
        '共 {total} 条',
        'Total {total} items',
        '分页总数显示'
    ),
    (
        'pagination.page.size',
        '每页显示',
        'Items per page',
        '每页显示数量'
    ),
    (
        'pagination.prev',
        '上一页',
        'Previous',
        '上一页按钮'
    ),
    (
        'pagination.next',
        '下一页',
        'Next',
        '下一页按钮'
    ),
    (
        'time.created.at',
        '创建时间',
        'Created At',
        '创建时间字段'
    ),
    (
        'time.updated.at',
        '更新时间',
        'Updated At',
        '更新时间字段'
    ),
    (
        'time.last.login',
        '最后登录',
        'Last Login',
        '最后登录时间'
    ),
    (
        'permission.read',
        '查看',
        'Read',
        '查看权限'
    ),
    (
        'permission.write',
        '编辑',
        'Write',
        '编辑权限'
    ),
    (
        'permission.delete',
        '删除',
        'Delete',
        '删除权限'
    ),
    (
        'permission.admin',
        '管理',
        'Admin',
        '管理权限'
    );