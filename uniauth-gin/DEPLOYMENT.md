# UniAuth Gateway 部署指南

本文档详细介绍了如何在不同环境中部署和配置 UniAuth Gateway。

## 📋 目录

- [环境要求](#环境要求)
- [本地开发部署](#本地开发部署)
- [Docker 部署](#docker-部署)
- [Kubernetes 部署](#kubernetes-部署)
- [生产环境配置](#生产环境配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 🔧 环境要求

### 基础环境

- **Go**: 1.21 或更高版本
- **Redis**: 6.0 或更高版本
- **内存**: 最少 256MB，推荐 512MB+
- **CPU**: 最少 1 core，推荐 2+ cores

### 网络要求

- **端口 8080**: UniAuth Gateway 服务端口
- **端口 6379**: Redis 连接端口
- **HTTPS**: 生产环境强烈建议启用

### SSO 提供商

- Microsoft Azure AD
- Google OAuth 2.0
- 其他 OIDC 兼容提供商

## 🏠 本地开发部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd uniauth-gin
```

### 2. 安装依赖

```bash
go mod download
go mod tidy
```

### 3. 配置文件

```bash
# 复制配置文件模板
cp config.example.yaml config.yaml

# 编辑配置文件
vim config.yaml
```

最小配置示例：

```yaml
server:
  port: "8080"
  mode: "debug"

session:
  secret_key: "dev-secret-key"
  cookie_name: "uniauth_session"

sso:
  client_id: "your-client-id"
  client_secret: "your-client-secret"

redis:
  addr: "localhost:6379"

uniauth:
  base_url: "http://localhost:8000"
```

### 4. 启动 Redis

```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server

# Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 5. 启动服务

```bash
# 直接运行
go run cmd/main.go

# 或编译后运行
./test_startup.sh
./uniauth-gateway
```

### 6. 验证部署

```bash
# 健康检查
curl http://localhost:8080/health

# 登录页面
open http://localhost:8080/auth/login
```

## 🐳 Docker 部署

### 单容器部署

```bash
# 构建镜像
docker build -t uniauth-gateway:latest .

# 运行容器
docker run -d \
  --name uniauth-gateway \
  -p 8080:8080 \
  -e UNIAUTH_GIN_REDIS_ADDR=host.docker.internal:6379 \
  -e UNIAUTH_GIN_SSO_CLIENT_ID=your-client-id \
  -e UNIAUTH_GIN_SSO_CLIENT_SECRET=your-client-secret \
  uniauth-gateway:latest
```

### Docker Compose 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f uniauth-gateway

# 停止服务
docker-compose down
```

### 生产环境 Docker 配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  uniauth-gateway:
    image: uniauth-gateway:v1.0.0
    restart: always
    ports:
      - "8080:8080"
    environment:
      - UNIAUTH_GIN_SERVER_MODE=release
      - UNIAUTH_GIN_SESSION_COOKIE_SECURE=true
    env_file:
      - .env.production
    depends_on:
      - redis
    networks:
      - uniauth_network

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - uniauth_network

volumes:
  redis_data:

networks:
  uniauth_network:
```

## ☸️ Kubernetes 部署

### 1. 创建命名空间

```bash
kubectl create namespace uniauth
```

### 2. 配置密钥

```bash
kubectl create secret generic uniauth-gateway-secrets \
  --from-literal=session-secret-key="your-super-secret-key" \
  --from-literal=sso-client-id="your-sso-client-id" \
  --from-literal=sso-client-secret="your-sso-client-secret" \
  -n uniauth
```

### 3. 部署服务

```bash
kubectl apply -f k8s/deployment.yaml -n uniauth
```

### 4. 配置 Ingress

```bash
kubectl apply -f k8s/ingress-annotations.yaml -n uniauth
```

### 5. 验证部署

```bash
# 检查 Pod 状态
kubectl get pods -n uniauth -l app=uniauth-gateway

# 检查服务状态
kubectl get svc -n uniauth

# 查看日志
kubectl logs -n uniauth -l app=uniauth-gateway --tail=100
```

### 高可用配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uniauth-gateway
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - uniauth-gateway
              topologyKey: kubernetes.io/hostname
```

## 🏭 生产环境配置

### 安全配置

```yaml
server:
  mode: "release"

session:
  secret_key: "strong-random-secret-key-32-chars-long"
  cookie_secure: true
  cookie_domain: ".yourdomain.com"

sso:
  login_url: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize"
  client_id: "production-client-id"
  client_secret: "production-client-secret"

redis:
  addr: "redis-cluster.internal:6379"
  password: "redis-password"
```

### 环境变量

```bash
export UNIAUTH_GIN_SERVER_MODE=release
export UNIAUTH_GIN_SESSION_COOKIE_SECURE=true
export UNIAUTH_GIN_REDIS_PASSWORD="strong-redis-password"
```

### TLS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name gateway.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://uniauth-gateway:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 负载均衡配置

```yaml
# HAProxy 配置示例
backend uniauth_gateway
    balance roundrobin
    option httpchk GET /health
    server gateway1 10.0.1.10:8080 check
    server gateway2 10.0.1.11:8080 check
    server gateway3 10.0.1.12:8080 check
```

## 📊 监控和日志

### Prometheus 监控

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'uniauth-gateway'
    static_configs:
      - targets: ['uniauth-gateway:8080']
    metrics_path: '/metrics'
```

### Grafana 仪表板

导入预定义的 Grafana 仪表板：

- CPU 和内存使用率
- 请求速率和响应时间
- 错误率统计
- 活跃会话数量

### 日志配置

```yaml
# ELK Stack 配置
filebeat.yml:
  filebeat.inputs:
  - type: container
    paths:
      - '/var/lib/docker/containers/*/*.log'
    processors:
    - add_kubernetes_metadata:
        in_cluster: true
```

### 告警规则

```yaml
# Prometheus 告警规则
groups:
  - name: uniauth-gateway
    rules:
      - alert: UniAuthGatewayDown
        expr: up{job="uniauth-gateway"} == 0
        for: 1m
        annotations:
          summary: "UniAuth Gateway is down"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        annotations:
          summary: "High error rate detected"
```

## 🔍 故障排除

### 常见问题

#### 1. Redis 连接失败

```bash
# 检查 Redis 状态
redis-cli ping

# 检查网络连通性
telnet redis-host 6379

# 检查配置
kubectl get configmap uniauth-config -o yaml
```

#### 2. SSO 认证失败

```bash
# 检查客户端配置
curl -v "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?client_id={client-id}&response_type=code"

# 检查回调 URL 配置
# 确保在 Azure AD 中正确配置了回调 URL
```

#### 3. 会话问题

```bash
# 检查会话存储
redis-cli keys "uniauth:session:*"

# 检查 Cookie 配置
# 确保域名和安全设置正确
```

### 日志分析

```bash
# 查看应用日志
kubectl logs -n uniauth deployment/uniauth-gateway --tail=100

# 实时监控错误
kubectl logs -n uniauth deployment/uniauth-gateway -f | grep ERROR

# 分析访问模式
kubectl logs -n uniauth deployment/uniauth-gateway | grep "用户.*登录成功"
```

### 性能调优

```yaml
# 优化配置
server:
  mode: "release"

session:
  cookie_max_age: 3600  # 减少会话时间

redis:
  pool_size: 10  # 增加连接池大小
  max_retries: 3
```

### 备份和恢复

```bash
# 备份 Redis 数据
redis-cli --rdb dump.rdb

# 恢复 Redis 数据
redis-cli --rdb dump.rdb
```

## 📞 获取帮助

如遇到部署问题，请：

1. 查看日志文件获取详细错误信息
2. 检查配置文件是否正确
3. 确认网络连通性
4. 联系技术支持团队

---

更多部署相关问题，请参考 [故障排除文档](TROUBLESHOOTING.md) 或提交 [Issue](../../issues)。
