# 前端Dockerfile for uniauth-admin
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖（包括开发依赖，因为构建需要）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 最终镜像，使用nginx服务静态文件
FROM nginx:alpine

# 复制构建的文件到nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置（可选）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
