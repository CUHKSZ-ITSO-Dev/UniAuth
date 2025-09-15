# UniAuth Gateway Makefile

.PHONY: build run test clean docker-build docker-run k8s-deploy k8s-undeploy lint fmt vet

# 变量定义
BINARY_NAME=uniauth-gateway
DOCKER_IMAGE=uniauth-gateway:latest
GO_FILES=$(shell find . -name "*.go" -type f)

# 默认目标
all: build

# 构建二进制文件
build:
	@echo "Building $(BINARY_NAME)..."
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
		-ldflags='-w -s -extldflags "-static"' \
		-o $(BINARY_NAME) \
		./cmd/main.go

# 本地运行
run:
	@echo "Running $(BINARY_NAME)..."
	@go run ./cmd/main.go

# 运行测试
test:
	@echo "Running tests..."
	@go test -v -race -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html

# 格式化代码
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# 代码检查
vet:
	@echo "Running go vet..."
	@go vet ./...

# Lint检查
lint:
	@echo "Running golangci-lint..."
	@golangci-lint run

# 清理构建文件
clean:
	@echo "Cleaning up..."
	@rm -f $(BINARY_NAME)
	@rm -f coverage.out coverage.html
	@docker rmi $(DOCKER_IMAGE) 2>/dev/null || true

# 安装依赖
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

# 构建Docker镜像
docker-build:
	@echo "Building Docker image..."
	@docker build -t $(DOCKER_IMAGE) .

# 运行Docker容器
docker-run: docker-build
	@echo "Running Docker container..."
	@docker run -d \
		--name uniauth-gateway \
		-p 8080:8080 \
		-e UNIAUTH_GIN_SERVER_MODE=debug \
		-e UNIAUTH_GIN_REDIS_ADDR=host.docker.internal:6379 \
		$(DOCKER_IMAGE)

# 停止Docker容器
docker-stop:
	@echo "Stopping Docker container..."
	@docker stop uniauth-gateway || true
	@docker rm uniauth-gateway || true

# 部署到Kubernetes
k8s-deploy:
	@echo "Deploying to Kubernetes..."
	@kubectl apply -f k8s/deployment.yaml

# 从Kubernetes卸载
k8s-undeploy:
	@echo "Undeploying from Kubernetes..."
	@kubectl delete -f k8s/deployment.yaml

# 查看Kubernetes状态
k8s-status:
	@echo "Checking Kubernetes deployment status..."
	@kubectl get pods -l app=uniauth-gateway
	@kubectl get services -l app=uniauth-gateway

# 查看Kubernetes日志
k8s-logs:
	@echo "Fetching Kubernetes logs..."
	@kubectl logs -l app=uniauth-gateway --tail=100

# 开发环境设置
dev-setup:
	@echo "Setting up development environment..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/air-verse/air@latest

# 热重载开发
dev:
	@echo "Starting development server with hot reload..."
	@air

# 生成文档
docs:
	@echo "Generating documentation..."
	@godoc -http=:6060

# 创建发布版本
release: clean fmt vet lint test build
	@echo "Creating release..."
	@mkdir -p release
	@tar -czf release/$(BINARY_NAME)-linux-amd64.tar.gz $(BINARY_NAME) config.yaml templates/ static/
	@echo "Release created in release/ directory"

# 健康检查
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8080/health || (echo "Service is not healthy" && exit 1)

# 压力测试
stress-test:
	@echo "Running stress test..."
	@ab -n 1000 -c 10 http://localhost:8080/health

# 帮助信息
help:
	@echo "Available commands:"
	@echo "  build        - Build the binary"
	@echo "  run          - Run the application locally"
	@echo "  test         - Run tests"
	@echo "  fmt          - Format code"
	@echo "  vet          - Run go vet"
	@echo "  lint         - Run golangci-lint"
	@echo "  clean        - Clean build artifacts"
	@echo "  deps         - Install dependencies"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"
	@echo "  docker-stop  - Stop Docker container"
	@echo "  k8s-deploy   - Deploy to Kubernetes"
	@echo "  k8s-undeploy - Undeploy from Kubernetes"
	@echo "  k8s-status   - Check Kubernetes status"
	@echo "  k8s-logs     - View Kubernetes logs"
	@echo "  dev-setup    - Setup development environment"
	@echo "  dev          - Start development server with hot reload"
	@echo "  docs         - Generate documentation"
	@echo "  release      - Create release package"
	@echo "  health       - Check service health"
	@echo "  stress-test  - Run stress test"
	@echo "  help         - Show this help message"
