# Sprint 5: Testing, CI/CD & Infrastructure

> **Duration:** 2 days | **Priority:** P0
> **Goal:** Test coverage for critical paths, GitHub Actions pipeline, Kong gateway, Dockerfiles

---

## 5.1 Test Suite — Critical Path Coverage

### Current State
- 2 unit test files in auth-service only
- 0 integration tests, 0 E2E tests
- PRD requires: 100% auth, 100% payment, 90% booking, 80% others

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 5.1.1 | **Auth service unit tests** | `services/auth-service/tests/unit/` — OTP generation (6 digits, crypto random), OTP hashing (SHA-256), JWT sign/verify (RS256), rate limiting (3/10min), lockout (5 fails → 30min) | 2h |
| 5.1.2 | **Auth service integration tests** | `tests/integration/auth.test.ts` — Full flow: send-otp → verify-otp → get tokens → refresh → logout. Use Supertest | 2h |
| 5.1.3 | **Payment service tests** | `services/payment-service/tests/` — Webhook signature verification (valid/invalid), escrow creation, escrow state transitions, platform fee calculation (10% + 18% GST), idempotency (duplicate webhook) | 3h |
| 5.1.4 | **Booking service tests** | `services/booking-service/tests/` — Full lifecycle: enquiry → quote → confirm → pay → complete. Cancellation flows. Dispute flow. Status validation (can't skip states) | 2h |
| 5.1.5 | **Vendor service tests** | `services/vendor-service/tests/` — CRUD operations, search/filter, availability check, double-booking prevention, package management | 2h |
| 5.1.6 | **Shared utils tests** | `packages/shared-utils/tests/` — Currency conversion (paise↔rupees), phone validation, GST/PAN validation, platform fee calculation, slug generation | 1h |
| 5.1.7 | **E2E critical path tests** | `tests/e2e/` — Using Supertest across services: (1) Register → Login → Create Event → Search Vendor → Enquire → Quote → Confirm → Pay → Complete → Review, (2) Vendor registers → KYC → Gets verified → Receives enquiry → Quotes → Gets paid | 4h |

### Acceptance Criteria
- [ ] Auth service: 100% unit + integration coverage
- [ ] Payment service: 100% unit coverage (webhook, escrow, fees)
- [ ] Booking service: 90% coverage (lifecycle, edge cases)
- [ ] All tests pass in CI (< 3 min total)
- [ ] At least 2 E2E critical path tests

---

## 5.2 GitHub Actions CI/CD

### Current State
- `.github/workflows/` is empty
- No automated testing, building, or deploying

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 5.2.1 | **PR validation workflow** | `.github/workflows/ci.yml` — On PR: (1) pnpm install, (2) TypeScript type-check (`tsc --noEmit` per service), (3) ESLint, (4) Unit tests (all services in parallel), (5) Build check | 2h |
| 5.2.2 | **Integration test workflow** | `.github/workflows/integration.yml` — On PR to main: (1) Start Docker services (postgres, redis, elasticsearch, mongodb), (2) Run migrations, (3) Run integration + E2E tests | 2h |
| 5.2.3 | **Docker build workflow** | `.github/workflows/docker.yml` — On merge to main: Build Docker image per service, tag with commit SHA, push to GitHub Container Registry | 2h |
| 5.2.4 | **Dependency scanning** | `.github/workflows/security.yml` — Weekly: npm audit, Snyk scan, Dependabot auto-PRs | 1h |
| 5.2.5 | **Prisma migration check** | Part of CI — Ensure prisma migrate status shows no pending migrations for PR | 30m |

### CI Workflow Structure
```yaml
# ci.yml triggers
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lint-typecheck:  # Parallel per service
  unit-tests:      # Parallel per service
  integration:     # Sequential, needs Docker
  build:           # Docker images
```

---

## 5.3 Kong API Gateway

### Current State
- `infrastructure/kong/` is empty
- All services accessed directly by port number
- No rate limiting, no routing, no auth at gateway level

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 5.3.1 | **Kong declarative config** | `infrastructure/kong/kong.yml` — Route definitions: `/api/v1/auth/*` → auth-service:4001, `/api/v1/users/*` → user-service:4002, etc. for all 12 services | 2h |
| 5.3.2 | **Rate limiting plugin** | Global: 100 req/min. Auth endpoints: 5 req/min. OTP: 3/10min. Search: 200/min. Payment: 20/min | 1h |
| 5.3.3 | **JWT plugin** | Validate JWT on protected routes at gateway level (skip auth-service public endpoints) | 1h |
| 5.3.4 | **CORS plugin** | Allow origins: localhost:3000, localhost:3001, localhost:3002, *.weddingos.in | 30m |
| 5.3.5 | **Request logging** | Log all requests with request_id, response time, status code | 30m |
| 5.3.6 | **Docker compose integration** | Add Kong to `docker-compose.dev.yml` — Kong Gateway on port 8000, Kong Admin on port 8001 | 1h |
| 5.3.7 | **Update frontend API URLs** | All frontend apps: change API base URL from direct service ports to `http://localhost:8000/api/v1/` | 1h |

### Kong Route Map
```
/api/v1/auth/*          → auth-service:4001/auth/*
/api/v1/users/*         → user-service:4002/users/*
/api/v1/vendors/*       → vendor-service:4003/vendors/*
/api/v1/bookings/*      → booking-service:4004/bookings/*
/api/v1/payments/*      → payment-service:4005/payments/*
/api/v1/execution/*     → execution-service:4006/execution/*
/api/v1/notifications/* → notification-service:4008/notifications/*
/api/v1/reviews/*       → review-service:4009/reviews/*
/api/v1/chat/*          → chat-service:4010/chat/*
/api/v1/search/*        → search-service:4011/search/*
/api/v1/media/*         → media-service:4012/media/*
/api/v1/ai/*            → ai-service:4020/ai/*
```

---

## 5.4 Dockerfiles & Production Build

### Current State
- Services have no Dockerfiles (except ai-service)
- No multi-stage builds, no production optimization

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 5.4.1 | **Node.js service Dockerfile** | `infrastructure/docker/Dockerfile.node` — Multi-stage: (1) Install deps with pnpm, (2) Build TypeScript, (3) Production stage with node:20-alpine, copy dist + node_modules, non-root user, health check | 1h |
| 5.4.2 | **Per-service Dockerfile** | Each service gets a Dockerfile extending base: `services/*/Dockerfile` — Copy Prisma schema, generate client, set entry point | 2h |
| 5.4.3 | **Next.js Dockerfile** | `apps/web/Dockerfile` — Multi-stage Next.js build with standalone output | 1h |
| 5.4.4 | **Vite app Dockerfile** | `apps/vendor-web/Dockerfile` + `apps/admin/Dockerfile` — Build static files, serve with nginx:alpine | 1h |
| 5.4.5 | **Docker compose production** | `docker-compose.prod.yml` — All services with proper resource limits, health checks, restart policies, log drivers | 1h |

### Acceptance Criteria
- [ ] GitHub Actions runs on every PR: lint + type-check + unit tests < 5 min
- [ ] Integration tests run with real Docker services in CI
- [ ] Kong routes all API traffic through single gateway
- [ ] Rate limiting enforced at gateway level
- [ ] All services have production-ready Dockerfiles
