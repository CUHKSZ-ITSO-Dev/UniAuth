# UniAuth Gateway

UniAuth Gateway 是一个基于 Gin 框架开发的网关中间件，专为与 Kubernetes Ingress 配合使用而设计，提供统一的身份认证和授权服务。

## ✨ 主要功能

- 🔐 **统一身份认证**: 支持SSO单点登录，与Microsoft Azure AD等身份提供商集成
- 🍪 **会话管理**: 基于Redis的分布式会话管理，支持多实例部署
- 🎯 **Kubernetes集成**: 完美配合K8s Ingress注解，实现透明的认证中间件
- 🔒 **安全头注入**: 自动将用户信息注入到后端服务的HTTP请求头中
- 📱 **响应式登录页面**: 现代化的登录界面，支持多种设备
- ⚡ **高性能**: 基于Gin框架，支持高并发请求处理

## 🏗️ 架构设计

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   用户浏览器     │───▶│  K8s Ingress     │───▶│  后端服务        │
└─────────────────┘    │  + Annotations   │    └─────────────────┘
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  UniAuth Gateway │───▶│  UniAuth-GF     │
                       │  (认证中间件)     │    │  (用户信息服务)  │
                       └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Redis Session   │    │  SSO Provider   │
                       │  (会话存储)       │    │  (Azure AD)     │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- Go 1.21+
- Redis 6.0+
- Kubernetes 1.20+ (如需使用K8s集成)

### 本地开发

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd uniauth-gin
   ```

2. **安装依赖**
   ```bash
   go mod download
   ```

3. **配置文件**
   ```bash
   cp config.yaml.example config.yaml
   # 编辑配置文件，设置您的SSO参数和Redis连接信息
   ```

4. **启动服务**
   ```bash
   go run cmd/main.go
   ```

5. **访问服务**
   - 健康检查: http://localhost:8080/health
   - 登录页面: http://localhost:8080/auth/login

### Docker部署

1. **构建镜像**
   ```bash
   docker build -t uniauth-gateway:latest .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name uniauth-gateway \
     -p 8080:8080 \
     -e UNIAUTH_GIN_REDIS_ADDR=redis:6379 \
     -e UNIAUTH_GIN_SSO_CLIENT_ID=your-client-id \
     -e UNIAUTH_GIN_SSO_CLIENT_SECRET=your-client-secret \
     uniauth-gateway:latest
   ```

## 🎛️ 配置说明

### 环境变量配置

| 环境变量 | 描述 | 默认值 |
|---------|------|--------|
| `UNIAUTH_GIN_SERVER_PORT` | 服务端口 | `8080` |
| `UNIAUTH_GIN_SERVER_MODE` | 运行模式 | `debug` |
| `UNIAUTH_GIN_SESSION_SECRET_KEY` | Session密钥 | `your-secret-key` |
| `UNIAUTH_GIN_REDIS_ADDR` | Redis地址 | `localhost:6379` |
| `UNIAUTH_GIN_SSO_CLIENT_ID` | SSO客户端ID | - |
| `UNIAUTH_GIN_SSO_CLIENT_SECRET` | SSO客户端密钥 | - |

### 配置文件示例

```yaml
server:
  port: "8080"
  mode: "release"

session:
  secret_key: "your-super-secret-key"
  cookie_name: "uniauth_session"
  cookie_max_age: 7200

sso:
  login_url: "https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize"
  callback_url: "/auth/callback"
  client_id: "your-client-id"
  client_secret: "your-client-secret"

redis:
  addr: "localhost:6379"
  password: ""
  db: 0

uniauth:
  base_url: "http://localhost:8000"
  timeout: 30
```

## 🎯 Kubernetes 集成

### 基本用法

1. **部署UniAuth Gateway**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

2. **配置Ingress注解**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: my-app-ingress
     annotations:
       nginx.ingress.kubernetes.io/auth-url: "http://uniauth-gateway.default.svc.cluster.local:8080/auth/status"
       nginx.ingress.kubernetes.io/auth-signin: "http://uniauth-gateway.default.svc.cluster.local:8080/auth/login?redirect=$escaped_request_uri"
       nginx.ingress.kubernetes.io/auth-response-headers: "X-User-UPN,X-User-Name,X-User-Email"
   spec:
     # ... ingress 规则
   ```

### 注入的用户头信息

认证成功后，以下HTTP头会被自动注入到后端服务的请求中：

- `X-User-UPN`: 用户主体名称
- `X-User-Name`: 用户姓名
- `X-User-Email`: 用户邮箱
- `X-User-Department`: 用户部门
- `X-User-Role`: 用户角色
- `X-User-Login-Time`: 登录时间

## 🔌 API 接口

### 认证接口

| 接口 | 方法 | 描述 |
|-----|-----|------|
| `/auth/login` | GET | 发起SSO登录 |
| `/auth/callback` | GET | SSO回调处理 |
| `/auth/logout` | POST | 用户登出 |
| `/auth/status` | GET | 检查认证状态 |

### 系统接口

| 接口 | 方法 | 描述 |
|-----|-----|------|
| `/health` | GET | 健康检查 |

## 🛡️ 安全特性

- ✅ **HTTPS强制**: 生产环境强制使用HTTPS
- ✅ **Session安全**: HttpOnly Cookie，防止XSS攻击
- ✅ **CSRF防护**: State参数验证，防止CSRF攻击
- ✅ **会话过期**: 自动会话过期和刷新机制
- ✅ **安全头**: 自动注入安全相关的HTTP头
- ✅ **重定向保护**: 防止开放重定向攻击

## 📊 监控与调试

### 健康检查

```bash
curl http://localhost:8080/health
```

### 认证状态检查

```bash
curl -H "Cookie: uniauth_session=your-session-id" \
     http://localhost:8080/auth/status
```

### 日志格式

```
2024/01/01 12:00:00 用户 user@example.com 登录成功
2024/01/01 12:00:01 用户 user@example.com 的请求已注入用户信息
```

## 🔧 开发指南

### 项目结构

```
uniauth-gin/
├── cmd/                    # 应用入口
│   └── main.go
├── internal/               # 内部包
│   ├── config/            # 配置管理
│   ├── handler/           # HTTP处理器
│   ├── middleware/        # 中间件
│   ├── model/             # 数据模型
│   ├── service/           # 业务服务
│   └── utils/             # 工具函数
├── templates/             # HTML模板
├── static/                # 静态资源
├── k8s/                   # Kubernetes配置
├── config.yaml            # 配置文件
├── Dockerfile             # Docker构建文件
└── README.md              # 项目文档
```

### 扩展开发

1. **添加新的认证提供商**
   - 实现 `handler/auth.go` 中的相关接口
   - 更新配置结构体

2. **自定义中间件**
   - 在 `middleware/` 目录下添加新的中间件
   - 在 `cmd/main.go` 中注册

3. **添加新的存储后端**
   - 实现 `service/session.go` 接口
   - 更新配置和依赖

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 🎉 致谢

- [Gin](https://github.com/gin-gonic/gin) - HTTP Web框架
- [Redis](https://redis.io/) - 内存数据库
- [Kubernetes](https://kubernetes.io/) - 容器编排平台

---

如有问题或建议，请创建 [Issue](../../issues) 或联系项目维护者。
