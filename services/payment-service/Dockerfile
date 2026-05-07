# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./

COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-errors/package.json ./packages/shared-errors/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-events/package.json ./packages/shared-events/
COPY services/payment-service/package.json ./services/payment-service/

RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY services/payment-service ./services/payment-service

RUN pnpm --filter payment-service exec prisma generate

RUN pnpm --filter payment-service build

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
RUN npm install -g pnpm@9

COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/payment-service/dist ./services/payment-service/dist
COPY --from=builder /app/services/payment-service/package.json ./services/payment-service/
COPY --from=builder /app/services/payment-service/node_modules ./services/payment-service/node_modules
COPY --from=builder /app/services/payment-service/prisma ./services/payment-service/prisma

USER appuser
WORKDIR /app/services/payment-service

EXPOSE 4004

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4004/payment/health || exit 1

CMD ["node", "dist/server.js"]
