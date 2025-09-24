import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { history, useModel } from "@umijs/max";
import type { MenuProps } from "antd";
import { Spin } from "antd";
import { createStyles } from "antd-style";
import React from "react";
import { flushSync } from "react-dom";
// 移除不存在的API引用
// import { outLogin } from '@/services/ant-design-pro/api';
import HeaderDropdown from "../HeaderDropdown";

export type GlobalHeaderRightProps = {
  menu?: boolean;
  children?: React.ReactNode;
};

export const AvatarName = () => {
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState || {};
  return <span className="anticon">{currentUser?.name}</span>;
};

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      display: "flex",
      height: "48px",
      marginLeft: "auto",
      overflow: "hidden",
      alignItems: "center",
      padding: "0 8px",
      cursor: "pointer",
      borderRadius: token.borderRadius,
      "&:hover": {
        backgroundColor: token.colorBgTextHover,
      },
    },
  };
});

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  menu,
  children,
}) => {
  /**
   * 退出登录，并且将当前的 url 保存
   */
  const loginOut = async () => {
    // 移除API调用，直接清除用户状态
    // await outLogin();

    // 简化退出登录逻辑，直接跳转到欢迎页面
    history.replace("/welcome");
  };
  const { styles } = useStyles();

  const { initialState, setInitialState } = useModel("@@initialState");

  const onMenuClick: MenuProps["onClick"] = (event) => {
    const { key } = event;
    if (key === "logout") {
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: null as any }));
      });
      loginOut();
      return;
    }
    // 简化个人中心和个人设置的跳转
    if (key === "center" || key === "settings") {
      // 暂时跳转到欢迎页面，因为相关页面可能不存在
      history.push("/welcome");
      return;
    }
  };

  const loading = (
    <span className={styles.action}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser } = initialState;

  if (!currentUser || !currentUser.name) {
    return loading;
  }

  const menuItems = [
    ...(menu
      ? [
          {
            key: "center",
            icon: <UserOutlined />,
            label: "个人中心",
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "个人设置",
          },
          {
            type: "divider" as const,
          },
        ]
      : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
    },
  ];

  return (
    <HeaderDropdown
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
    >
      {children}
    </HeaderDropdown>
  );
};
