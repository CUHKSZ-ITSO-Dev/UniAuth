FROM golang:1.25-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的包
RUN apk add --no-cache git ca-certificates

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 编译应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o jwt-rotator .

# 使用minimal镜像运行
FROM alpine:latest

# 安装ca证书和时区数据
RUN apk --no-cache add ca-certificates tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户
RUN adduser -D -g '' rotator

# 设置工作目录
WORKDIR /app

# 从builder阶段复制编译好的程序
COPY --from=builder /app/jwt-rotator .

# 改变文件所有者
RUN chown -R rotator:rotator /app

# 切换到非root用户
USER rotator

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ./jwt-rotator info || exit 1

# 设置入口点
ENTRYPOINT ["./jwt-rotator"]

# 默认参数
CMD ["rotate"]
