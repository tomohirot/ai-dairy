# ベースイメージ
FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# 依存関係をインストール
RUN npm ci

# Prisma Clientを生成
RUN npx prisma generate

# ビルダーステージ
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/generated ./app/generated
COPY . .

# Next.jsのテレメトリを無効化
ENV NEXT_TELEMETRY_DISABLED=1

# ビルド時のダミーDATABASE_URL（実際の接続はしない）
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# アプリケーションをビルド
RUN npm run build

# プロダクション実行ステージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/app/generated ./app/generated

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# サーバーを起動
CMD ["node", "server.js"]
