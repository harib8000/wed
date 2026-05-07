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
COPY services/booking-service/package.json ./services/booking-service/

RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY services/booking-service ./services/booking-service

RUN pnpm --filter booking-service exec prisma generate

RUN pnpm --filter booking-service build

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
COPY --from=builder /app/services/booking-service/dist ./services/booking-service/dist
COPY --from=builder /app/services/booking-service/package.json ./services/booking-service/
COPY --from=builder /app/services/booking-service/node_modules ./services/booking-service/node_modules
COPY --from=builder /app/services/booking-service/prisma ./services/booking-service/prisma

USER appuser
WORKDIR /app/services/booking-service

EXPOSE 4002

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4002/booking/health || exit 1

CMD ["node", "dist/server.js"]
