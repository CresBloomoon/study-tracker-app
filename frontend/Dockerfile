# frontend/Dockerfile
# 本番ビルドモード（docker-compose.prod.yml）専用のマルチステージビルド。
# イメージビルド時に `next build` を1回実行し、成果物をイメージに焼き込む。
# 開発モードは docker-compose.override.yml のとおり node:20-alpine + ボリュームマウント + `next dev` のまま（このDockerfileは使わない）。

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY package.json next.config.js ./

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
