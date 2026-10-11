# NOF0 前端镜像（Next.js standalone 输出）
# 构建上下文为 web/ 目录，由 go/docker-compose.yml 中的 web 服务调用

# ---------- deps：安装依赖 ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder：构建 Next.js ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.ts 据此启用 output: "standalone"
ENV DOCKER_BUILD=1
ENV NEXT_TELEMETRY_DISABLED=1

# Docker 部署默认关闭「接口暂停」公告层，展示完整竞技场页面（本地 npm run dev 不受影响）
ARG NEXT_PUBLIC_SHOW_PAUSE_OVERLAY=0
ENV NEXT_PUBLIC_SHOW_PAUSE_OVERLAY=${NEXT_PUBLIC_SHOW_PAUSE_OVERLAY}

# /api/nof1/* 代理路由的上游，指向 compose 内的自建后端
ARG NOF1_API_BASE_URL=http://nof0-api:8888/api
ENV NOF1_API_BASE_URL=${NOF1_API_BASE_URL}

RUN npm run build

# ---------- runner：最小运行镜像 ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["node", "server.js"]
