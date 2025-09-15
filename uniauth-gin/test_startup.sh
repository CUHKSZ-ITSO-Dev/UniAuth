#!/bin/bash

# UniAuth Gateway 启动测试脚本
# 此脚本用于快速测试服务是否正常启动

set -e

echo "🚀 启动 UniAuth Gateway 测试..."

# 检查Go环境
if ! command -v go &> /dev/null; then
    echo "❌ Go 未安装或不在PATH中"
    exit 1
fi

echo "✅ Go 版本: $(go version)"

# 检查是否在正确的目录
if [ ! -f "go.mod" ]; then
    echo "❌ 请在项目根目录下运行此脚本"
    exit 1
fi

# 检查依赖
echo "📦 检查依赖..."
go mod download
go mod tidy

echo "🔍 代码检查..."
go vet ./...

echo "🏗️ 编译项目..."
go build -o uniauth-gateway ./cmd/main.go

echo "✅ 编译成功"

# 检查Redis是否运行（可选）
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis 连接正常"
    else
        echo "⚠️  Redis 未运行，将使用默认配置"
    fi
else
    echo "ℹ️  未安装 redis-cli，跳过Redis检查"
fi

echo ""
echo "🎉 测试完成！"
echo ""
echo "启动服务:"
echo "  ./uniauth-gateway"
echo ""
echo "或使用开发模式："
echo "  go run cmd/main.go"
echo ""
echo "访问地址:"
echo "  健康检查: http://localhost:8080/health"
echo "  登录页面: http://localhost:8080/auth/login"
echo "  状态检查: http://localhost:8080/auth/status"
echo ""
echo "Docker 启动 (如果已安装 Docker):"
echo "  docker-compose up -d"
echo ""
