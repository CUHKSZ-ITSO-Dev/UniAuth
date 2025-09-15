# 多阶段构建Dockerfile for UniAuth Gateway

# 第一阶段：构建
FROM golang:1.21-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache git ca-certificates

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o uniauth-gateway \
    ./cmd/main.go

# 第二阶段：运行时
FROM scratch

# 从builder阶段复制CA证书
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# 从builder阶段复制二进制文件
COPY --from=builder /app/uniauth-gateway /uniauth-gateway

# 复制模板文件
COPY --from=builder /app/templates /templates
COPY --from=builder /app/static /static

# 复制默认配置文件
COPY --from=builder /app/config.yaml /config.yaml

# 创建非root用户
USER 65534:65534

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["/uniauth-gateway", "--health-check"]

# 运行应用
ENTRYPOINT ["/uniauth-gateway"]
