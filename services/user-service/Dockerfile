FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9
COPY pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-errors/package.json ./packages/shared-errors/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-events/package.json ./packages/shared-events/
COPY services/user-service/package.json ./services/user-service/
RUN pnpm install --frozen-lockfile
COPY packages ./packages
COPY services/user-service ./services/user-service
RUN pnpm --filter user-service exec prisma generate
RUN pnpm --filter user-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
RUN npm install -g pnpm@9
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/services/user-service/package.json ./services/user-service/
COPY --from=builder /app/services/user-service/node_modules ./services/user-service/node_modules
COPY --from=builder /app/services/user-service/prisma ./services/user-service/prisma
USER appuser
WORKDIR /app/services/user-service
EXPOSE 4002
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD wget -qO- http://localhost:4002/health || exit 1
CMD ["node", "dist/server.js"]
