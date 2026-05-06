# Wedding OS

> India's First End-to-End Wedding Operating System

[![Status](https://img.shields.io/badge/status-Phase%201%20Validation-yellow)]()
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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | Flutter 3.19 (iOS + Android) |
| **Web (Customer)** | Next.js 14 + React |
| **Web (Vendor)** | Vite + React |
| **Admin** | Vite + React + Ant Design |
| **Backend** | Node.js 20 + Express (microservices) |
| **Database** | PostgreSQL 16 (Prisma ORM) |
| **Cache** | Redis 7 (BullMQ for jobs) |
| **Search** | Elasticsearch 8 |
| **AI** | Python FastAPI + Claude API |
| **Payments** | Razorpay (escrow model) |
| **Cloud** | AWS (ECS Fargate, RDS, S3, CloudFront) |
| **CI/CD** | GitHub Actions + Docker + Terraform |

## Project Structure

```
wedding-os/
├── apps/
│   ├── mobile/              # Flutter cross-platform app
│   ├── web/                 # Next.js 14 — Customer web
│   ├── vendor-web/          # Vendor OS dashboard
│   └── admin/               # Admin panel
├── services/
│   ├── auth-service/        # JWT, OTP, OAuth
│   ├── user-service/        # Profiles, preferences
│   ├── vendor-service/      # Vendor CRUD, packages
│   ├── search-service/      # Elasticsearch
│   ├── booking-service/     # Bookings, enquiries
│   ├── payment-service/     # Razorpay, escrow
│   ├── execution-service/   # Tasks, timeline, event day
│   ├── notification-service/# SMS/Push/Email/WhatsApp
│   ├── ai-service/          # Python — ML + recommendations
│   ├── chat-service/        # Socket.io messaging
│   └── review-service/      # Ratings, moderation
├── packages/
│   ├── shared-types/        # TypeScript interfaces
│   ├── shared-utils/        # Helpers
│   └── shared-errors/       # Error classes
├── infrastructure/
│   ├── terraform/           # IaC
│   └── docker/              # Dockerfiles
├── docs/
│   ├── PRD_v1.0.md          # Product Requirements Document
│   ├── Vol3_MasterBible.md  # Engineering Master Bible
│   └── openapi/             # API specs
└── WeddingOS_PRD_Implementation_Plan.md  # Sprint plan
```

## Documentation

| Document | Description |
|----------|-------------|
| [Implementation Plan](WeddingOS_PRD_Implementation_Plan.md) | Full sprint breakdown (37+ sprints, 5 phases) |
| [PRD v1.0](docs/PRD_v1.0.md) | Product Requirements: features, DB schema, APIs, security |
| [Vol3 Master Bible](docs/Vol3_MasterBible.md) | Engineering: architecture, financial model, ops, scaling |

## Phases

| Phase | Timeline | Status |
|-------|---------|--------|
| 1. Validation | Month 0–2 | **Current** |
| 2. MVP | Month 2–5 | Planned |
| 3. Traction | Month 5–10 | Planned |
| 4. Differentiation | Month 10–18 | Planned |
| 5. Scale | Month 18+ | Planned |

## Market

- **TAM:** ₹2,00,000 Crore (India wedding industry)
- **Launch City:** Hyderabad, Telangana
- **Revenue Model:** Commission (10%) + SaaS (₹1999–4999/mo) + Escrow

## Getting Started

```bash
# Clone the repo
git clone https://github.com/harib8000/wed.git
cd wed

# Read the implementation plan
cat WeddingOS_PRD_Implementation_Plan.md
```

---

*CONFIDENTIAL — For development team use only*