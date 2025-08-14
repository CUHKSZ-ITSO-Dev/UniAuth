# UniAuth 统一认证授权系统

## 项目概述

UniAuth是一个现代化的统一认证授权系统，基于RBAC（基于角色的访问控制）模型，提供灵活的权限管理和用户认证功能。

## 项目结构

### 目录结构

```
uniauth/
├── main.go                      # 主程序入口
├── internal/                    # 内部包
│   ├── config/                 # 配置管理
│   ├── core/                   # 核心业务逻辑
│   ├── handlers/               # HTTP处理器
│   ├── middleware/             # 中间件
│   ├── services/               # 业务服务层
│   └── utils/                  # 工具函数
├── routes/                     # 路由定义
├── configs/                    # 配置文件
├── uniauth-admin/              # 前端项目（React + TypeScript + Tailwind）
├── go.mod                      # Go模块文件
├── go.sum                      # Go依赖锁定文件
├── casbin.db                   # SQLite数据库文件（开发模式使用）
├── Dockerfile                  # Docker构建文件
└── README.md                   # 项目说明
```

### 技术栈

- **后端**: Go 1.24 + Gin + Casbin + GORM
- **数据库**: PostgreSQL (生产) / SQLite (开发)
- **前端**: React 18 + TypeScript + Tailwind CSS + Vite
- **状态管理**: React Query + React Router
- **UI组件**: Headless UI + Framer Motion
- **部署**: Docker + Kubernetes

## 快速开始

### 后端开发

```bash
# 开发模式（使用SQLite）
go run main.go  --dev server

# 生产模式（使用PostgreSQL）
export UNIAUTH_DB_HOST=localhost
export UNIAUTH_DB_NAME=uniauth
export UNIAUTH_DB_USER=postgres
export UNIAUTH_DB_PASSWORD=password
go run main.go server
```

### 前端开发

```bash
# 进入前端目录
cd uniauth-admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 初始化权限策略

```bash
# 从CSV文件导入权限策略
go run main.go init configs/policy_kb_and_deny.csv
```

## API 接口

- **认证接口**: `/api/v1/auth/*`
- **管理接口**: `/api/v1/admin/*`
- **审计接口**: `/api/v1/admin/audit/*`

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| UNIAUTH_PORT | 8080 | 服务器端口 |
| UNIAUTH_DEV | false | 开发模式 |
| UNIAUTH_DB_HOST | localhost | 数据库主机 |
| UNIAUTH_DB_NAME | uniauth | 数据库名称 |
| UNIAUTH_DB_USER | postgres | 数据库用户 |
| UNIAUTH_DB_PASSWORD | - | 数据库密码 |

## 文档

- [项目结构说明](./docs/STRUCTURE.md)
- [前端开发指南](./uniauth-admin/README.md)
