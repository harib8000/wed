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
COPY services/media-service/package.json ./services/media-service/

RUN pnpm install --frozen-lockfile

COPY packages ./packages
COPY services/media-service ./services/media-service



RUN pnpm --filter media-service build

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
COPY --from=builder /app/services/media-service/dist ./services/media-service/dist
COPY --from=builder /app/services/media-service/package.json ./services/media-service/
COPY --from=builder /app/services/media-service/node_modules ./services/media-service/node_modules


USER appuser
WORKDIR /app/services/media-service

EXPOSE 4010

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4010/media/health || exit 1

CMD ["node", "dist/server.js"]
