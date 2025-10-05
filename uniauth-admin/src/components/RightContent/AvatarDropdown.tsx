import {
  // LogoutOutlined, // 暂时注释退出登录图标，后续可能重新启用
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { history, useModel } from "@umijs/max";
import type { MenuProps } from "antd";
import { Spin } from "antd";
import { createStyles } from "antd-style";
import React from "react";
// import { flushSync } from "react-dom"; // 暂时注释，退出登录功能暂时禁用
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
   * 暂时注释退出登录功能，后续可能重新启用
   */
  // const loginOut = async () => {
  //   // 移除API调用，直接清除用户状态
  //   // await outLogin();

  //   // 简化退出登录逻辑，直接跳转到欢迎页面
  //   history.replace("/");
  // };
  const { styles } = useStyles();

  const { initialState } = useModel("@@initialState");
  // const { initialState, setInitialState } = useModel("@@initialState"); // setInitialState 暂时不需要，退出登录功能已注释

  const onMenuClick: MenuProps["onClick"] = (event) => {
    const { key } = event;
    // 暂时注释退出登录逻辑，后续可能重新启用
    // if (key === "logout") {
    //   flushSync(() => {
    //     setInitialState((s) => ({ ...s, currentUser: null as any }));
    //   });
    //   loginOut();
    //   return;
    // }
    // 简化个人中心和个人设置的跳转
    if (key === "center" || key === "settings") {
      // 暂时跳转到欢迎页面，因为相关页面可能不存在
      history.push("/");
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
          // 暂时注释退出登录功能，后续可能重新启用
          // {
          //   type: "divider" as const,
          // },
        ]
      : []),
    // 暂时注释退出登录菜单项，后续可能重新启用
    // {
    //   key: "logout",
    //   icon: <LogoutOutlined />,
    //   label: "退出登录",
    // },
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
