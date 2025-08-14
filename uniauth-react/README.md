# UniAuth Admin - 现代化权限管理界面

基于 React 18 + TypeScript + Tailwind CSS 的现代化权限管理前端界面。

## 技术栈

- **React 18** - 用户界面库
- **TypeScript** - 类型安全
- **Tailwind CSS 3** - 原子化 CSS 框架
- **Vite** - 构建工具
- **React Query** - 服务端状态管理
- **React Router** - 路由管理
- **Framer Motion** - 动画库
- **Headless UI** - 无样式 UI 组件
- **Recharts** - 图表库
- **date-fns** - 日期处理

## 功能特性

### 🎯 核心功能

1. **权限可视化管理**
   - 树形结构展示用户权限
   - 权限来源追踪（直接/组/角色）
   - 一键启用/禁用权限

2. **用户批量操作**
   - 批量分配/移除用户组
   - 批量权限修改
   - 高级搜索和过滤

3. **实时同步监控**
   - LDAP/AD 用户自动同步
   - 同步状态实时展示
   - 一键触发手动同步

4. **数据可视化**
   - 用户分布统计
   - 权限使用趋势
   - 风险用户识别

### 🎨 设计特点

- 响应式设计，支持移动端
- 深色/浅色主题（可扩展）
- 流畅的动画效果
- 直观的交互体验

## 快速开始

### 安装依赖

```bash
cd uniauth-admin
npm install
```

### 开发环境

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist` 目录。

### 环境变量

创建 `.env` 文件：

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## 项目结构

```
uniauth-admin/
├── src/
│   ├── api/          # API 客户端
│   ├── components/   # 可复用组件
│   ├── pages/        # 页面组件
│   ├── types/        # TypeScript 类型
│   ├── App.tsx       # 主应用
│   └── main.tsx      # 入口文件
├── public/           # 静态资源
└── package.json
```

## 主要页面

### 1. 控制台 (Dashboard)
- 系统概览
- 关键指标
- 实时监控

### 2. 用户管理
- 用户列表
- 批量操作
- 权限详情

### 3. 权限详情
- 权限树视图
- 快速编辑
- 模板应用

### 4. 审计日志
- 操作记录
- 变更追踪

## 部署建议

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name admin.uniauth.com;
    root /var/www/uniauth-admin/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker 部署

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## 性能优化

1. **代码分割** - React.lazy() 按需加载
2. **缓存策略** - React Query 智能缓存
3. **图片优化** - 使用 WebP 格式
4. **Bundle 优化** - Tree shaking

## 安全建议

1. 启用 HTTPS
2. 实施 CSP 策略
3. API 请求认证
4. XSS 防护

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## License

MIT
