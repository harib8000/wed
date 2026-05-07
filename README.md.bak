# Wedding OS

> India's First End-to-End Wedding Operating System

[![Status](https://img.shields.io/badge/status-Foundation%20Built-blue)]()
[![Services](https://img.shields.io/badge/microservices-12-green)]()
[![Completion](https://img.shields.io/badge/completion-3.5%2F10-orange)]()
[![License](https://img.shields.io/badge/license-Proprietary-red)]()

## What is Wedding OS?

Wedding OS is the complete operating system for the Indian wedding industry — from first click to final applause. Not a listing site. An **infrastructure layer** where every wedding runs through our platform.

| What We Replace | With |
|----------------|------|
| WhatsApp groups & Excel sheets | Unified planning dashboard |
| Phone calls for vendor discovery | AI-powered search + verified profiles |
| Cash advances with no protection | Escrow-protected payments (Razorpay) |
| Zero coordination between 15-20 vendors | Real-time execution engine with GPS check-ins |
| No accountability for vendor quality | Verified reviews + milestone-based payouts |

---

## Current Implementation Status

**Overall Rating: 3.5 / 10** — Foundation built, business logic pending.

See [DEEP_ANALYSIS_RATING.md](DEEP_ANALYSIS_RATING.md) for the full breakdown.

| Area | Rating | Status |
|------|--------|--------|
| Database Design & Prisma | 6/10 | ✅ 8 PostgreSQL DBs, schemas defined, migrations run |
| Auth & Security | 5/10 | ✅ RS256 JWT, OTP w/ SHA-256, rate limiting, helmet |
| Architecture Foundation | 5/10 | ✅ 12 services structured, Express routers, middleware |
| Customer Web App | 2/10 | ⚠️ Next.js running, all data is mock |
| Vendor Web App | 3/10 | ⚠️ Vite running, mock dashboard |
| Admin Panel | 3/10 | ⚠️ Vite+AntD running, mock tables |
| Execution Engine | 2/10 | ⚠️ Empty task/timeline routes |
| AI Service | 1/10 | ⚠️ Python FastAPI healthcheck only |
| Payment / Escrow | 2/10 | ⚠️ No Razorpay integration |
| DevOps / CI | 1/10 | ⚠️ No Docker builds, no GitHub Actions |
| Testing | 0.5/10 | ⚠️ Only 2 test files in auth-service |
| Flutter Mobile | 0/10 | ❌ Empty scaffold |

### What Works End-to-End (Verified)
- ✅ Send OTP → Verify OTP → JWT issued → `/users/me` returns profile
- ✅ All 11 backend services running and health-checked
- ✅ All 3 frontend apps serving HTTP 200
- ✅ All 4 Docker infra containers healthy (PostgreSQL, Redis, Elasticsearch, MongoDB)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Mobile** | Flutter | 3.19 (scaffold only) |
| **Web (Customer)** | Next.js + React + Tailwind | 14 |
| **Web (Vendor)** | Vite + React + Tailwind | 6 |
| **Admin** | Vite + React + Ant Design | 5 |
| **Backend** | Node.js + Express + TypeScript | 24.14.0 |
| **AI Service** | Python + FastAPI | 3.x |
| **Database** | PostgreSQL (Prisma ORM) | 16 |
| **Cache / Queue** | Redis + BullMQ | 7 |
| **Search** | Elasticsearch | 8 |
| **Document DB** | MongoDB | 7 |
| **Payments** | Razorpay (escrow model) | Planned |
| **Cloud** | AWS (ECS, RDS, S3, CloudFront) | Planned |
| **CI/CD** | GitHub Actions + Docker | Planned |

---

## Architecture

```
                       ┌─────────────┐
                       │   Clients   │
                       │ Web│Vendor│  │
                       │ Admin│Mobile│
                       └──────┬──────┘
                              │
                    ┌─────────▼─────────┐
                    │   Kong Gateway    │  (planned)
                    │  Rate Limit, Auth │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐         ┌─────▼─────┐        ┌─────▼──────┐
   │  Auth   │         │  Vendor   │        │  Booking   │
   │ :4001   │         │  :4003    │        │  :4004     │
   └────┬────┘         └─────┬─────┘        └─────┬──────┘
        │                     │                     │
   ┌────▼────┐         ┌─────▼─────┐        ┌─────▼──────┐
   │  User   │         │  Search   │        │  Payment   │
   │ :4002   │         │  :4011    │        │  :4005     │
   └─────────┘         └───────────┘        └────────────┘

   ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
   │Execution│  │Notification│  │  Review  │  │   Chat   │
   │  :4006  │  │   :4008   │  │  :4009   │  │  :4010   │
   └─────────┘  └───────────┘  └──────────┘  └──────────┘

   ┌─────────┐  ┌───────────┐
   │  Media  │  │    AI     │
   │  :4012  │  │  :4020    │
   └─────────┘  └───────────┘

   ┌──────────────── Infrastructure ─────────────────┐
   │ PostgreSQL:5432 │ Redis:6379 │ ES:9200 │ Mongo  │
   └─────────────────────────────────────────────────┘
```

---

## Service Map

| Service | Port | Health Endpoint | Database | Status |
|---------|------|----------------|----------|--------|
| auth-service | 4001 | `/auth/health` | wedding_auth | ✅ Running |
| user-service | 4002 | `/health` | wedding_users | ✅ Running |
| vendor-service | 4003 | `/health` | wedding_vendors | ✅ Running |
| booking-service | 4004 | `/health` | wedding_bookings | ✅ Running |
| payment-service | 4005 | `/health` | wedding_payments | ✅ Running |
| execution-service | 4006 | `/health` | wedding_execution | ✅ Running |
| notification-service | 4008 | `/health` | wedding_notifications | ✅ Running |
| review-service | 4009 | `/reviews/health` | wedding_reviews | ✅ Running |
| chat-service | 4010 | `/chat/health` | MongoDB | ✅ Running |
| search-service | 4011 | `/search/health` | Elasticsearch | ✅ Running |
| media-service | 4012 | `/media/health` | S3 (planned) | ✅ Running |
| ai-service | 4020 | `/health` | — | ✅ Running |

| Frontend | Port | Framework | Status |
|----------|------|-----------|--------|
| Customer Web | 3000 | Next.js 14 | ✅ Running |
| Vendor Web | 3001 | Vite + React | ✅ Running |
| Admin Panel | 3002 | Vite + Ant Design | ✅ Running |
| Mobile App | — | Flutter | ❌ Empty |

---

## Project Structure

```
wed/
├── apps/
│   ├── mobile/                # Flutter (empty scaffold)
│   ├── web/                   # Next.js 14 — Customer web (:3000)
│   ├── vendor-web/            # Vite + React — Vendor OS (:3001)
│   └── admin/                 # Vite + Ant Design — Admin (:3002)
├── services/
│   ├── auth-service/          # JWT RS256, OTP, refresh tokens
│   ├── user-service/          # Profiles, preferences, KYC
│   ├── vendor-service/        # Vendor CRUD, packages, portfolio
│   ├── booking-service/       # Enquiry → booking lifecycle
│   ├── payment-service/       # Orders, escrow, payouts
│   ├── execution-service/     # Tasks, timeline, event day
│   ├── notification-service/  # SMS, push, email, WhatsApp
│   ├── review-service/        # Ratings, moderation
│   ├── chat-service/          # Socket.io messaging
│   ├── search-service/        # Elasticsearch integration
│   ├── media-service/         # Upload, resize, CDN
│   └── ai-service/            # Python FastAPI — ML + LLM
├── packages/
│   ├── shared-types/          # TypeScript interfaces
│   ├── shared-utils/          # Helpers (JWT verify, hashing)
│   └── shared-errors/         # AppError classes
├── infrastructure/
│   ├── terraform/             # AWS IaC (planned)
│   └── docker/                # Dockerfiles (planned)
├── docs/
│   ├── openapi/               # API specs (planned)
│   └── adr/                   # Architecture Decision Records (planned)
├── sprints/                   # Sprint implementation plans
├── keys/                      # JWT RS256 key pair
├── scripts/                   # DB setup, startup scripts
├── docker-compose.infra.yml   # PostgreSQL, Redis, ES, MongoDB
├── docker-compose.dev.yml     # Dev services (planned)
├── pnpm-workspace.yaml        # pnpm workspace config
├── turbo.json                 # Turborepo pipeline
└── tsconfig.base.json         # Shared TS config
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 20 (tested on v24.14.0)
- pnpm ≥ 9
- Docker & Docker Compose

### 1. Start Infrastructure

```bash
docker compose -f docker-compose.infra.yml up -d
```

This starts:
- PostgreSQL 16 on port 5432 (8 databases auto-created)
- Redis 7 on port 6379
- Elasticsearch 8 on port 9200
- MongoDB 7 on port 27017

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Generate Prisma Clients & Run Migrations

```bash
# For each service with a database:
cd services/auth-service && npx prisma generate && npx prisma migrate deploy
cd ../user-service && npx prisma generate && npx prisma migrate deploy
cd ../vendor-service && npx prisma generate && npx prisma migrate deploy
cd ../booking-service && npx prisma generate && npx prisma migrate deploy
cd ../payment-service && npx prisma generate && npx prisma migrate deploy
cd ../execution-service && npx prisma generate && npx prisma migrate deploy
cd ../notification-service && npx prisma generate && npx prisma migrate deploy
cd ../review-service && npx prisma generate && npx prisma migrate deploy
```

### 4. Generate JWT Keys

```bash
mkdir -p keys
openssl genpkey -algorithm RSA -out keys/jwt.private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in keys/jwt.private.pem -out keys/jwt.public.pem
```

### 5. Start Backend Services

```bash
# Start each service (from project root):
cd services/auth-service && node_modules/.bin/tsx src/server.ts &
cd services/user-service && node_modules/.bin/tsx src/server.ts &
cd services/vendor-service && node_modules/.bin/tsx src/server.ts &
cd services/booking-service && node_modules/.bin/tsx src/server.ts &
cd services/payment-service && node_modules/.bin/tsx src/server.ts &
cd services/execution-service && node_modules/.bin/tsx src/server.ts &
cd services/notification-service && node_modules/.bin/tsx src/server.ts &
cd services/review-service && node_modules/.bin/tsx src/server.ts &
cd services/chat-service && node_modules/.bin/tsx src/server.ts &
cd services/search-service && node_modules/.bin/tsx src/server.ts &
cd services/media-service && node_modules/.bin/tsx src/server.ts &
```

### 6. Start Frontend Apps

```bash
# Customer Web (Next.js)
cd apps/web && npx next dev -p 3000 &

# Vendor Web (Vite)
cd apps/vendor-web && npx vite --port 3001 --host &

# Admin Panel (Vite)
cd apps/admin && npx vite --port 3002 --host &
```

### 7. Verify

```bash
# Health checks
curl http://localhost:4001/auth/health   # auth-service
curl http://localhost:4002/health        # user-service
curl http://localhost:3000               # customer web

# Test auth flow
curl -X POST http://localhost:4001/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+917777666555"}'

# Then verify OTP (check service logs for code)
curl -X POST http://localhost:4001/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+917777666555", "otp": "<otp-from-logs>"}'
```

---

## Sprint Plans

7 detailed sprint plans for reaching 10/10 completion:

| Sprint | Focus | Est. | File |
|--------|-------|------|------|
| 1 | Booking lifecycle + Razorpay payments + escrow | 3 days | [Sprint 1](sprints/SPRINT_1_booking_payment_lifecycle.md) |
| 2 | Frontend API integration (replace all mock data) | 3 days | [Sprint 2](sprints/SPRINT_2_frontend_api_integration.md) |
| 3 | Execution engine + multi-channel notifications | 2 days | [Sprint 3](sprints/SPRINT_3_execution_engine_notifications.md) |
| 4 | AI budget optimizer + search + vendor KYC | 2 days | [Sprint 4](sprints/SPRINT_4_ai_search_kyc.md) |
| 5 | Testing + CI/CD + Kong gateway + Dockerfiles | 2 days | [Sprint 5](sprints/SPRINT_5_testing_cicd_infrastructure.md) |
| 6 | Flutter mobile app (20+ screens) | 3 days | [Sprint 6](sprints/SPRINT_6_flutter_mobile_app.md) |
| 7 | OpenAPI docs + ADRs + security hardening + privacy | 2 days | [Sprint 7](sprints/SPRINT_7_docs_security_polish.md) |

**Total estimated: ~17 days to production-ready**

---

## Documentation

| Document | Description |
|----------|-------------|
| [Deep Analysis Rating](DEEP_ANALYSIS_RATING.md) | Comprehensive audit — 3.5/10 rating with gap details |
| [Implementation Plan](WeddingOS_PRD_Implementation_Plan.md) | Original 37+ sprint breakdown (5 phases) |
| [PRD v1.0](WeddingOS_PRD_v1.0.extracted.txt) | Product requirements: features, DB schema, APIs, security |
| [Vol3 Master Bible](WeddingOS_Vol3_MasterBible.extracted.txt) | Engineering: architecture, financial model, ops, scaling |

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | RS256 JWT + OTP | No passwords — phone-first India market |
| Database | DB-per-service | Isolation for independent scaling |
| Monorepo | pnpm + Turborepo | Shared types/utils with independent deploys |
| Search | Elasticsearch | Geo-search, fuzzy matching, faceted filters |
| Queue | BullMQ on Redis | Delayed jobs, retries, escrow auto-release |
| ORM | Prisma | Type-safe, migration management, schema-first |
| Gateway | Kong (planned) | Rate limiting, auth forwarding, routing |

## Market

- **TAM:** ₹2,00,000 Crore (India wedding industry)
- **Launch City:** Hyderabad, Telangana
- **Revenue Model:** Commission (10%) + SaaS (₹1999–4999/mo) + Escrow float

---

*CONFIDENTIAL — For development team use only*