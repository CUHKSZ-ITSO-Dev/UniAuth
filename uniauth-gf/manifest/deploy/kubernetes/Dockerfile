# 一阶段
FROM golang:1.25.0 AS builder

WORKDIR /app

RUN go install github.com/gogf/gf/cmd/gf/v2@latest

COPY . .

RUN gf build

# 二阶段
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/bin/linux_amd64/uniauth .

CMD ["./uniauth"]