# UniAuth Admin 管理后台

UniAuth 统一认证系统的管理后台，基于 [Ant Design Pro](https://pro.ant.design) 构建的企业级中后台前端解决方案。

## 📋 项目简介

UniAuth Admin 是一个功能完整的权限管理系统前端，提供用户管理、权限控制、配额池管理、计费管理等核心功能。

### 🚀 主要功能

- **用户管理**: 用户信息查询、筛选和管理
- **权限控制**: 基于 Casbin 的权限策略管理
- **配额池管理**: AI 模型配额分配和管理
- **计费系统**: 使用记录和账单管理
- **多语言支持**: 中英文国际化
- **自动配置**: 配额池自动分配配置

### 🛠 技术栈

- **框架**: React 19 + UmiJS 4
- **UI 组件**: Ant Design 5.x + Ant Design Pro Components
- **状态管理**: UmiJS Model
- **构建工具**: UmiJS Max + Mako
- **代码规范**: Biome + TypeScript
- **测试**: Jest + Testing Library
- **包管理**: pnpm (必须使用)

## 📦 环境要求

- **Node.js**: >= 20.0.0
- **包管理器**: 请一定仅使用 pnpm 作为包管理器 

## 🚀 快速开始

### 安装依赖

> ⚠️ **重要**: 本项目必须使用 pnpm 作为包管理器，不要混用 npm 或 yarn

```bash
# 安装 pnpm (如果尚未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 开发环境启动

```bash
# 启动开发服务器 (默认端口 8000)
pnpm start

# 或者使用开发环境配置启动
pnpm run dev
```

### 不同环境启动

```bash
# 开发环境 (带 Mock 数据)
pnpm start

# 开发环境 (不使用 Mock)
pnpm run start:no-mock

# 测试环境
pnpm run start:test

# 预发布环境
pnpm run start:pre
```

## 📜 可用脚本

### 开发相关

```bash
# 启动开发服务器
pnpm start

# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview

```

### 代码质量

```bash
# 代码检查 (Biome + TypeScript)
pnpm run lint

# 仅 Biome 检查
pnpm run biome:lint

# TypeScript 类型检查
pnpm run tsc
```

### 测试相关

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm run test:coverage

# 更新测试快照
pnpm run test:update
```

### API 相关

```bash
# 生成 API 接口代码
pnpm run openapi

# 国际化文本清理
pnpm run i18n-remove
```

## 📁 项目结构

```
uniauth-admin/
├── config/                 # 配置文件
│   ├── api.json            # OpenAPI 规范文件
│   ├── config.ts           # UmiJS 主配置
│   ├── defaultSettings.ts  # 默认设置
│   ├── proxy.ts            # 代理配置
│   └── routes.ts           # 路由配置
├── mock/                   # Mock 数据
├── public/                 # 静态资源
├── src/
│   ├── components/         # 公共组件
│   ├── locales/           # 国际化文件
│   ├── pages/             # 页面组件
│   ├── services/          # API 服务
│   ├── app.tsx            # 应用入口配置
│   └── global.tsx         # 全局配置
├── tests/                 # 测试文件
├── package.json
└── README.md
```

## 🔧 配置说明

### 环境变量

项目支持多环境配置，通过 `REACT_APP_ENV` 环境变量控制：

- `dev`: 开发环境 (默认)
- `test`: 测试环境
- `pre`: 预发布环境

### 代理配置

开发环境下的 API 代理配置在 `config/proxy.ts` 中，支持不同环境的后端服务地址配置。

### OpenAPI 集成

项目集成了 OpenAPI 自动生成功能，API 接口定义在 `config/api.json` 中，运行 `pnpm run openapi` 可自动生成类型定义和请求方法。

## 🌐 国际化

项目支持中英文双语：

- 中文: `src/locales/zh-CN/`
- 英文: `src/locales/en-US/`

默认语言为中文，会根据浏览器语言自动切换。

## 🚀 部署

### 构建生产版本

```bash
pnpm run build
```

构建产物在 `dist/` 目录下。

## 🤝 开发指南

1. 确保使用 pnpm 作为包管理器
2. 遵循项目的代码规范和提交规范
3. 新增 API 接口时更新 `config/api.json` 并运行 `pnpm run openapi`
5. 国际化文本统一管理在 `locales/` 目录下

## 新增页面指南

在 UniAuth Admin 中新增页面需要遵循以下步骤：

### 1. 创建页面组件

在 `src/pages/` 目录下创建新的页面目录和组件文件：

```bash
# 创建页面目录
mkdir src/pages/YourPageName

# 创建页面组件文件
touch src/pages/YourPageName/index.tsx
```

### 2. 配置路由

在 `config/routes.ts` 中添加新的路由配置：

```typescript
{
  path: '/your-page-path',
  name: 'your-page-name',
  icon: 'YourIcon', // 参考 Ant Design Icons
  component: '@/pages/YourPageName',
}
```

路由配置参数说明：
- `path`: 页面访问路径
- `name`: 路由名称，用于国际化配置
- `icon`: 菜单图标，去除 `Outlined` 后缀和大小写
- `component`: 页面组件路径，使用 `@/` 指向 `src/` 目录

### 3. 添加国际化配置

在国际化文件中添加菜单项翻译：

**中文** (`src/locales/zh-CN/menu.ts`)：
```typescript
export default {
  // ... 其他配置
  'menu.your-page-name': '你的页面名称',
};
```

**英文** (`src/locales/en-US/menu.ts`)：
```typescript
export default {
  // ... 其他配置
  'menu.your-page-name': 'Your Page Name',
};
```

### 4. 注意事项

- 页面组件名称使用 PascalCase 命名
- 路由路径使用 kebab-case 命名
- 确保添加相应的国际化配置
- 遵循项目的代码规范和 TypeScript 类型定义
- 使用 ProComponents 提供的组件以保持界面一致性


## 🔗 相关链接

- [Ant Design Pro 官方文档](https://pro.ant.design)
- [UmiJS 官方文档](https://umijs.org)
- [Ant Design 官方文档](https://ant.design)
- [pro components 官方文档](https://procomponents.ant.design/)

