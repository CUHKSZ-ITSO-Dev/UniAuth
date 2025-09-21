import React from 'react';
import { Button, ButtonProps, Tooltip } from 'antd';
import { useAccess, Access } from 'umi';

/**
 * 权限按钮组件属性接口
 */
interface AccessButtonProps extends ButtonProps {
  /** 权限标识 */
  permission: string;
  /** 无权限时提示信息 */
  noPermissionText?: string;
  /** 无权限时是否隐藏按钮 */
  hideWhenDisabled?: boolean;
  /** 无权限时是否禁用按钮而非隐藏 */
  disableWhenNoPermission?: boolean;
}

/**
 * 权限按钮组件
 * 用于根据用户权限控制按钮的显示/隐藏/禁用状态
 */
const AccessButton: React.FC<AccessButtonProps> = ({
  permission,
  noPermissionText = '无操作权限',
  hideWhenDisabled = true,
  disableWhenNoPermission = false,
  children,
  ...buttonProps
}) => {
  const { hasPermission } = useAccess();
  
  // 检查用户是否有指定权限
  const hasAuth = hasPermission(permission);
  
  // 无权限时处理逻辑
  if (!hasAuth) {
    // 无权限且配置为隐藏，则返回null
    if (hideWhenDisabled) {
      return null;
    }
    
    // 创建禁用状态的按钮
    const disabledButton = (
      <Button 
        {...buttonProps} 
        disabled={disableWhenNoPermission} 
        style={{
          ...buttonProps.style,
          opacity: disableWhenNoPermission ? 0.6 : 1
        }}
      >
        {children}
      </Button>
    );
    
    // 根据配置返回禁用按钮或带提示的按钮
    return disableWhenNoPermission ? (
      disabledButton
    ) : (
      <Tooltip title={noPermissionText}>
        {disabledButton}
      </Tooltip>
    );
  }
  
  // 有权限时正常渲染按钮
  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  );
};

export default AccessButton;