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

---

## 目录重构总结

### 📋 完成的工作

✅ **分析现有代码结构** - 识别了所有文件的功能归属
✅ **文件分类映射** - 将现有文件正确映射到对应模块
✅ **移动认证相关文件到 RBAC 模块** - 包括认证、管理、审计等功能
✅ **移动用户管理文件到 User 模块** - 用户信息相关功能
✅ **移动计费文件到 Billing 模块** - 聊天计费相关功能
✅ **删除旧文件** - 清理原始位置的文件
✅ **验证目录结构** - 确认重构正确完成

### 🏗️ 新的模块结构

**💰 Billing 模块（计费）**
- `handler/chat.go` - 聊天计费处理器
- `model/chat.go` - 计费相关模型（ChatUserAccount, ChatUserCategory, 等）
- `service/chat_service.go` - 聊天计费服务

**🔐 RBAC 模块（鉴权）**
- `handler/` - 认证、管理员、审计、规则管理、抽象组处理器
- `model/abstract_group.go` - 抽象组模型
- `service/` - 认证服务、抽象组服务、文档服务

**👤 User 模块（用户信息管理）**
- `model/userinfo.go` - 用户信息模型
- `service/userinfo_service.go` - 用户信息服务

**⚙️ Config 模块（配置中心）** - 预留结构，待后续开发

**🌐 Gateway 模块（网关）** - 预留结构，待后续开发
