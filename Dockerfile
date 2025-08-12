# 多阶段构建的Dockerfile for uniauth
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN go build -a -ldflags='-w -s' -o uniauth .

# 最终镜像
FROM alpine:latest

# 安装必要的运行时依赖
RUN apk --no-cache add ca-certificates tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户
RUN addgroup -g 1001 -S uniauth && \
    adduser -u 1001 -S uniauth -G uniauth

# 设置工作目录
WORKDIR /app

# 从builder镜像复制可执行文件
COPY --from=builder /app/uniauth .

# 复制配置文件
COPY --from=builder /app/configs ./configs

# 创建数据目录
RUN mkdir -p /app/data && chown -R uniauth:uniauth /app

# 切换到非root用户
USER uniauth

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["./uniauth", "server"]
