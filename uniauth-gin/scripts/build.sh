#!/bin/bash

# UniAuth Gateway 构建脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 版本信息
VERSION=${VERSION:-"dev"}
COMMIT=${COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")}
BUILD_TIME=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

# 构建标志
LDFLAGS="-s -w -X 'main.Version=${VERSION}' -X 'main.Commit=${COMMIT}' -X 'main.BuildTime=${BUILD_TIME}'"

echo -e "${BLUE}🏗️  构建 UniAuth Gateway${NC}"
echo -e "${YELLOW}版本: ${VERSION}${NC}"
echo -e "${YELLOW}提交: ${COMMIT}${NC}"
echo -e "${YELLOW}时间: ${BUILD_TIME}${NC}"
echo ""

# 清理之前的构建
echo -e "${BLUE}🧹 清理之前的构建...${NC}"
rm -f uniauth-gateway
rm -rf dist/

# 创建输出目录
mkdir -p dist/

# 交叉编译
platforms=(
    "linux/amd64"
    "linux/arm64"
    "darwin/amd64"
    "darwin/arm64"
    "windows/amd64"
)

echo -e "${BLUE}📦 开始交叉编译...${NC}"

for platform in "${platforms[@]}"; do
    OS=$(echo $platform | cut -d'/' -f1)
    ARCH=$(echo $platform | cut -d'/' -f2)
    
    output_name="uniauth-gateway-${OS}-${ARCH}"
    if [ $OS = "windows" ]; then
        output_name+='.exe'
    fi
    
    echo -e "${YELLOW}构建 ${OS}/${ARCH}...${NC}"
    
    GOOS=$OS GOARCH=$ARCH CGO_ENABLED=0 go build \
        -ldflags="${LDFLAGS}" \
        -o "dist/${output_name}" \
        ./cmd/main.go
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 构建 ${OS}/${ARCH} 失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 构建 ${OS}/${ARCH} 成功${NC}"
done

# 创建本地可执行文件
echo -e "${BLUE}🔨 创建本地可执行文件...${NC}"
cp "dist/uniauth-gateway-$(go env GOOS)-$(go env GOARCH)" ./uniauth-gateway
if [ "$(go env GOOS)" = "windows" ]; then
    mv ./uniauth-gateway ./uniauth-gateway.exe
fi

# 计算文件大小
echo ""
echo -e "${BLUE}📊 构建结果:${NC}"
for file in dist/*; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        echo -e "${GREEN}  $(basename "$file"): ${size}${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 构建完成！${NC}"
echo -e "${YELLOW}二进制文件位于 dist/ 目录${NC}"
echo -e "${YELLOW}本地可执行文件: ./uniauth-gateway${NC}"
