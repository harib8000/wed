import os

with open('README.md.bak', 'w') as f_out, open('README.md', 'r') as f_in:
    f_out.write(f_in.read())

readme_content = """<div align="center">

<img src="https://img.shields.io/badge/Wedding%20OS-India's%20First%20Wedding%20Operating%20System-FF6B6B?style=for-the-badge&logo=heart&logoColor=white" alt="Wedding OS" />

<br/>

# 💍 WEDDING OS — PROJECT MASTER AUDIT DOCUMENT

### *India's First End-to-End Wedding Operating System*
### *From First Click to Final Applause — The Infrastructure Layer of a ₹2,00,000 Crore Industry*

<br/>

[![Status](https://img.shields.io/badge/Status-Development%20Phase-2196F3?style=for-the-badge)]()
[![Sprint](https://img.shields.io/badge/Sprint-7%20Plans%20Ready-4CAF50?style=for-the-badge)]()
[![Services](https://img.shields.io/badge/Microservices-12%20Running-00BCD4?style=for-the-badge)]()
[![Rating](https://img.shields.io/badge/Completion-3.5%2F10-FF9800?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Proprietary-F44336?style=for-the-badge)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-24.14-339933?style=for-the-badge&logo=node.js&logoColor=white)]()
[![Flutter](https://img.shields.io/badge/Flutter-3.19-02569B?style=for-the-badge&logo=flutter&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)]()

<br/>

> **"Build the infrastructure layer of India's wedding industry — where every wedding runs through our platform."**

<br/>

---

Inspired by the engineering excellence of:
[**Razorpay**](https://github.com/razorpay) · [**Zepto**](https://github.com/zepto-org) · [**Swiggy**](https://github.com/swiggy-engineering) · [**Shopify**](https://github.com/shopify) · [**Airbnb**](https://github.com/airbnb) · [**Uber**](https://github.com/uber)

</div>

---

## 📋 Table of Contents

<details>
<summary><strong>Click to expand full table of contents</strong></summary>

1. [Project Overview](#1-project-overview)
2. [Complete Feature List](#2-complete-feature-list)
3. [Complete User Flow](#3-complete-user-flow)
4. [App Platforms](#4-app-platforms)
5. [Complete Tech Stack](#5-complete-tech-stack)
6. [Project Structure](#6-project-structure)
7. [Database Structure](#7-database-structure)
8. [API Structure](#8-api-structure)
9. [Authentication & Security](#9-authentication--security)
10. [UI/UX Analysis](#10-uiux-analysis)
11. [Android App Analysis](#11-android-app-analysis)
12. [Performance Analysis](#12-performance-analysis)
13. [Scalability & Future Growth](#13-scalability--future-growth)
14. [Known Bugs & Blockers](#14-known-bugs--blockers)
15. [Business Logic](#15-business-logic)
16. [Payment System](#16-payment-system)
17. [Notifications & Communication](#17-notifications--communication)
18. [Admin Panel Analysis](#18-admin-panel-analysis)
19. [Analytics & Tracking](#19-analytics--tracking)
20. [DevOps & Deployment](#20-devops--deployment)
21. [Legal & Compliance](#21-legal--compliance)
22. [AI Features & Automation](#22-ai-features--automation)
23. [Similar Platforms / Competitor Analysis](#23-similar-platforms--competitor-analysis)
24. [Future Feature Wishlist](#24-future-feature-wishlist)
25. [Screenshots & Recordings](#25-screenshots--recordings)
26. [Access Details (Optional)](#26-access-details-optional)
27. [Main Expectations From AI Assistants](#27-main-expectations-from-chatgpt)
28. [Special Notes](#28-special-notes)
29. [Final Analysis Request & Execution Strategy](#29-final-analysis-request)

</details>

---

# 1. PROJECT OVERVIEW

### 1.1 App / Platform Name
**WeddingOS** (Wedding Operating System)

### 1.2 Tagline
*India's First End-to-End Wedding Operating System. From First Click to Final Applause.*

### 1.3 Problem Statement
The Indian wedding industry (₹2,00,000 Crore TAM) is highly fragmented, chaotic, and heavily reliant on unorganized offline networks. Customers face pricing opacity, tracking issues, and scattered vendor coordination. Vendors face manual lead management, uncertain cashflows, and scattered scheduling. WeddingOS brings order, escrow-based financial security, and end-to-end execution to the chaos.

### 1.4 Industry / Domain
- Marketplace
- Execution Platform
- FinTech (Escrow Payments)
- SaaS (Vendor CRM/OS)

### 1.5 Business Type
- **B2B2C** (Marketplace linking Vendors to Customers)
- **Commission Model** (Standardized escrow fees per transaction)
- **SaaS** (Vendor OS subscription for premium B2B tooling)

### 1.6 Target Users
- **Customers:** Couples & Families organizing weddings.
- **Vendors:** Venues, Caterers, Planners, Decorators, Photographers, Artists.
- **Admins:** Operational staff for platform health, dispute resolution.

### 1.7 Countries / Regions Targeted
- Current: **India** (Focus on Tier-1 and Tier-2 cities).
- Future: **Global / NRI** destination weddings, expanding Pan-Asia.

### 1.8 Current Project Status
- **Beta / MVP Implementation Stage** (Current codebase Completion Rating: 3.5/10)
- Core Monorepo scaffolding set up with 12 microservices. Next UI apps generated but lack deep functionality.

### 1.9 Main Business Goals
- Centralize 10% of India's wedding execution flow within 5 years.
- Standardize payments through Escrow, protecting both customers and vendors.
- Reduce vendor coordination overhead by 80% with automated workflows.
- Introduce AI-based budget optimization for Indian weddings.

### 1.10 Main Revenue Model
- Transaction Commissions on escrow bookings (e.g., 3-5%).
- SaaS subscription fees for Vendor OS unlocking premium CRM/Analytics tools.
- Featured vendor listings / Advertising revenues.

### 1.11 Core USP (Unique Selling Point)
We are not just a discovery or listing site (like competitors). We are an **Execution Engine** combined with **Escrow Payments**, offering a **Vendor CRM (SaaS)** wrapper. We handle the discovery, booking, payments, execution timelines, and post-event reviews.

---

# 2. COMPLETE FEATURE LIST

## Existing & Planned Features

### User Features
- AI Budget Planner & Cost Estimator
- Discovery Engine for 15+ Vendor Categories
- Escrow Secure Bookings & Insta-Refunds
- Real-time Execution Timeline & Dashboard
- Guest Management System (Digital Invites & RSVPs)
- Real-time Collaboration (Family sharing mode)
- Dispute Management & Resolution Centre

### Vendor / Seller Features (Vendor OS)
- Centralized Enquiry & Pipeline CRM (Kanban style)
- Calendar & Real-time Availability Blocking
- Automated Quotation & Invoice Generation
- Subscription Management & Premium Profile
- Staff & Sub-contractor coordination (Execution Engine)
- Earnings & Payout Analytics

### Admin Features
- User / Vendor Verification (DigiLocker/GST verification approvals)
- Escrow Release & Refund Overrides
- Global Dashboard & Metrics (Revenue, Active Events, Churn)
- Content Moderation & Dispute Arbitration

### AI Features
- **Budget Optimizer Algorithm:** Allocates budget seamlessly based on location & guest count.
- **Vendor Recommender:** Collaborative filtering based on taste and budget.
- **AI Fraud Detector:** Prevents fake reviews and illegitimate bookings.
- **AI Chatbot:** Real-time customer support and wedding planning assistant.

---

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Monorepo Architecture | Working | Turborepo, pnpm setup with 12 services |
| Microservices Shells | Working | Basic setups in Express/FastAPI, lacking depth |
| User & Vendor Auth | Partial | Basic JWT/Prisma schema exists |
| AI Service | Buggy | FastAPI Placeholder implemented, missing true ML logic |
| Payments & Escrow | Pending | Schema created, but no Razorpay/Webhooks integrated |
| Vendor CRM UI | Pending | Mock data pages in Next.js vendor-web app |
| Execution Engine | Buggy/Pending | Schema mapped but no Cron/Queue orchestration |
| React Native/Flutter Mobile | Planned | Structure added, no dart codebase yet |

---

# 3. COMPLETE USER FLOW

## User Journey
1. **Discovery:** User opens Web/Mobile App → Answers AI Quiz (Budget, City, Guest Count).
2. **Onboarding:** App auto-generates structured Budget & Checklist. User Registers/Logs in via OTP.
3. **Execution/Search:** User browses recommended venues/photographers.
4. **Interaction:** User requests Quote → Vendor counters/accepts.
5. **Booking:** User accepts Quote → Pays 30% Advance to Escrow via Payment Gateway.
6. **Timeline Prep:** Tasks auto-generated in Execution Dashboard.
7. **Event Day:** App tracks check-ins, remaining payments hit Escrow. Event occurs.
8. **Completion:** Customer approves delivery → Escrow auto-releases to Vendor.
9. **Feedback:** Verified reviews prompted.

## Vendor Journey
1. **Validation:** Vendor registers with GST/KYC docs → Admin approves.
2. **Profile Setup:** Vendor builds packages, sets base pricing.
3. **CRM Management:** Vendor dashboard shows new "Leads" directly from Customers.
4. **Booking:** Vendor replies with Quotation → Receives Escrow confirmation.
5. **Operation:** Calendar auto-blocks dates. Vendor coordinates team ops via Dashboard.
6. **Payouts:** Event triggers automated T+1 day bank payout processing.

## Admin Workflow
1. Approving flagged vendor KYCs.
2. Managing platform commission percentages.
3. Resolving blocked Escrow disputes.
4. Moderating reported reviews & users.

---

# 4. APP PLATFORMS

### Available Platforms
- Web App (Customer facing Next.js)
- Vendor Web OS (B2B SaaS Next.js)
- Admin Panel (React/Next.js)
- Mobile App iOS (Flutter)
- Mobile App Android (Flutter)

### Android App Type
- **Flutter** framework (Scheduled for Sprint 6).

### iOS App Type
- **Flutter** cross-platform rendering engine.

### Web Technology
- **Next.js 14** (App Router), React, Tailwind CSS, TypeScript.

---

# 5. COMPLETE TECH STACK

## Frontend
- **Framework:** Next.js 14 (React)
- **Language:** TypeScript 5.x
- **UI Libraries:** Tailwind CSS + UI Kit Packages (shadcn/ui planned)

## Backend
- **Core Platform:** Node.js (24.x) / Express microservices
- **AI Services:** Python (FastAPI)
- **Language:** TypeScript / Python

## Database
- **Primary RDBMS:** PostgreSQL 16 (via Prisma ORM)
- **Caching/PubSub:** Redis 7
- **Analytics/Search:** Elasticsearch 8 (Planned integration)

## Authentication
- Express JWT (RS256) microservices level auth.
- Redis-backed OTP sessions.
- Role-based Access Control (RBAC).

## Hosting / Infrastructure
- **Deployment Strategy:** Docker Containers (via Docker Compose for Dev/Infra)
- **API Gateway:** Kong
- **Cloud Provider (Target):** AWS (EKS / ECS / Lambda)
- **Infrastructure as Code:** Terraform (staging/production modules ready)

## Storage
- **Media Files:** AWS S3 (Planned) + CDN (CloudFront/Cloudflare)

## APIs & Services Used (Phase 1-3 Focus)
- **Payments:** Razorpay, Stripe
- **Communication:** MSG91 (SMS), Twilio, WhatsApp 360dialog
- **KYC:** DigiLocker API, GST API
- **Maps:** Google Maps / Mapbox
- **Machine Learning:** OpenAI endpoints (for natural language bots, sentiment analysis)
- **CI/CD & Source:** GitHub Actions

---

# 6. PROJECT STRUCTURE

```text
/workspaces/wed
├── apps/                # Frontend Applications
│   ├── admin/           # Next.js Admin Panel
│   ├── mobile/          # Flutter Customer/Vendor App
│   ├── vendor-web/      # Next.js Vendor SaaS Platform
│   └── web/             # Next.js Customer Marketplace Web
├── docs/                # Architecture, PRDs, Master Bible
├── infrastructure/      # Infrastructure configurations
│   ├── docker/
│   ├── kong/
│   └── terraform/       # IaC staging/production setups
├── packages/            # Shared libraries (Turborepo)
│   ├── shared-errors/   # Custom Error definitions
│   ├── shared-events/   # Event bus payloads/types
│   ├── shared-types/    # Zod/TS types
│   ├── shared-utils/    # Helper functions
│   └── ui-kit/          # Centralized React UI components
├── services/            # Backend Microservices
│   ├── ai-service/      # Python FastAPI (ML algorithms)
│   ├── auth-service/    # Node Express (JWT, OTP)
│   ├── booking-service/ # Node Express (Booking CRM)
│   ├── chat-service/    # Node Express (Socket.io WebSockets)
│   ├── execution-service/# Node Express (Timeline & Tasks)
│   ├── media-service/   # Node Express (S3 Uploads, processing)
│   ├── notification-service/ # Node Express (SMS, Email, Push)
│   ├── payment-service/ # Node Express (Escrow & Razorpay)
│   ├── review-service/  # Node Express (Ratings & Disputes)
│   ├── search-service/  # Node Express (ElasticSearch)
│   ├── user-service/    # Node Express (User Profiles)
│   └── vendor-service/  # Node Express (Vendor Profiles & Stats)
├── scripts/             # Deployment, DB Seeding & Migrations
└── sprints/             # 7-Sprint Dev Timeline documentation
```

### Architecture Pattern
- **Distributed Microservices architecture** with a central API Gateway (Kong).
- Managed by a **Turborepo** Monorepo structure.

### State Management (Frontend)
- React Context / Zustand (planned integration)
- React Query (for async data fetching/caching)

---

# 7. DATABASE STRUCTURE

## Database Design
- **12 DB Schemas:** Each microservice has its own isolated bounded context and its own `schema.prisma`.
- **Relationships:** Microservices manage cross-data dependencies by emitting events or API Gateway calls.

## Important Tables
1. `Users` (user-service/auth-service)
2. `Vendors`, `VendorServices` (vendor-service)
3. `Bookings`, `Quotations` (booking-service)
4. `Payments`, `EscrowHolds`, `Payouts` (payment-service)
5. `Timelines`, `TimelineTasks` (execution-service)

## Current Database Problems (As per Audit)
- Partial schemas defined; relationships across microservices lack real synchronisation strategies (Event bus not yet implemented).
- Missing critical dimensions: Webhook events, advanced analytics tables.
- Lack of Database Indexing logic in current skeleton logic.
- Poor setup for replication/scaling at present moment inside monolithic docker-compose context.

---

# 8. API STRUCTURE

## API Architecture
- Microservices exposes internal REST APIs.
- Kong API Gateway handles routing, rate limiting, and outward exposure.
- JWT tokens forwarded as trusted headers.

## Major APIs
- `POST /auth/login`, `POST /auth/verify-otp`
- `GET /search/vendors`
- `POST /booking/enquiry`, `PUT /booking/quote`
- `POST /payments/escrow/create-order`
- `POST /execution/tasks`

## API Problems
- High coupling risk due to direct service-to-service synchronous calls (need Kafka/RabbitMQ implementation).
- Mostly placeholder responses right now (~3.5/10 completion).
- No standard API timeout/retry mechanisms defined code-side.

---

# 9. AUTHENTICATION & SECURITY

## Authentication Flow
1. User enters Phone/Email.
2. OTP Generated via `auth-service` -> `notification-service`.
3. Validated OTP returns JWT + Refresh Token (RS256 asymmetric encryption).
4. Future calls append `Bearer: JWT` to Gateway; Kong validates the signature public key.

## Security Features
- JWT (RS256), OTP hashing with bcrypt.
- Express middlewares: Helmet (headers), custom rate-limiting, Zod input validation.

## Current Security Concerns
- Missing CSRF protections on Web apps.
- Field-level PII encryption not yet implemented inside PostgreSQL.
- API Key rotations for external partners not handled.

---

# 10. UI/UX ANALYSIS

## Current UI Problems
- The Next.js implementations are purely structural shells using mock placeholder data.
- Global UI Kit (`packages/ui-kit`) lacks complex atomic components (Dates, Autocomplete, Kanban boards).

## UX Problems
- Currently inaccessible for a full end-to-end journey review (No staging server, dummy routes only).

## Pages Needing Redesign (Impending Sprints)
- Vendor Dashboard CRM
- Complex Escrow Payment UX Flow
- AI Budget Matrix Table

## UI Inspiration Apps
- Airbnb (For discovery clean architecture)
- Stripe (For dashboard / analytics visibility)
- Linear (For Execution Engine speed and task rendering)
- Razorpay Checkout

---

# 11. ANDROID / iOS APP ANALYSIS

## Current App Issues
- Currently a structural scaffold (`apps/mobile`), 0% Dart implementation present.

## App Scale Architecture Considerations
- Needs state-of-the-art Offline Caching (SQLite/Hive) as weddings occur in remote rural regions with bad connectivity.
- Isolate image uploading logic to background isolates to prevent main-thread freezing.

---

# 12. PERFORMANCE ANALYSIS

## Performance Bottlenecks
- Synchronous calls during search (Requires syncing postgres to Elasticsearch to fix).
- Large media rendering expected (Photographers' portfolios require strict CDN integration, blurred placeholders).

## Caching Strategy
- Redis will handle Session states, Top 100 Vendor configurations locally for regions.

## Offline Support
- Mobile: Heavy Reliance. Web Vendor OS: PWA manifests planned.

---

# 13. SCALABILITY & FUTURE GROWTH

## Expansion Plans
- Start: Initial Launch in Top 3 Metro cities (Delhi NCR, Mumbai, Bangalore).
- Phase 2: Tier-2 Integration, mapping regional custom traditions.

## Scaling Concerns
- During "Muhurat Days" (Auspicious Indian Wedding Dates), traffic spikes by 500x. Auto-scaling ECS configurations must be intensely benchmarked.
- Payment Webhook reconciliation at scale during system stress could result in dropped events.

---

# 14. KNOWN BUGS & BLOCKERS

| Issue | Severity | Platform | Status |
|---|---|---|---|
| Complete Lack of Event Bus | High | Backend Architecture | Pending |
| Mock Data in UIs | High | Frontend | Pending |
| Auth Integration Mismatch | Medium | API/Web | Investigating |
| Deployment Pipelines absent | High | DevOps | Pending |

---

# 15. BUSINESS LOGIC

## Pricing Logic
- Registration is free for basic users and vendors.

## Commission Logic
- Tiered Platform fee deduced at Escrow Release: 3% to 7% based on vendor subscription level.

## Vendor Approval Logic
- Manual review triggers if automatic GST/PAN + Face Check score < 85%.

## Escrow Release Payout Logic
- Payout triggers upon "Event Completion Signed Off by User", OR automatically T+3 days post-event if user raises no technical dispute ticket.

---

# 16. PAYMENT SYSTEM

## Payment Providers
- Primarily **Razorpay** Route (handling multi-party splits).

## Payment Flow
1. Booking initiates logic block in `booking-service`
2. Redirect to `payment-service` to generate order id mapping Escrow amounts.
3. User pays via Checkout Modal. Gateway Webhook pushes to `payment-service`.
4. Logic flags booking as CONFIRMED. Escrow funds placed in holding Virtual Account.

---

# 17. NOTIFICATIONS & COMMUNICATION

## Push, SMS, Email
- `notification-service` handles all protocols asynchronously to avoid blocking user flows. Providers: Firebase Cloud Messaging, MSG91, AWS SES.

---

# 18. ADMIN PANEL ANALYSIS

## Core Need
- Needs to be highly metric-driven. Missing dispute resolution real-time chat overlays allowing admin moderation.

---

# 19. ANALYTICS & TRACKING

## Tools Planned
- Firebase Analytics (Mobile), Mixpanel (Web flows), Sentry (Error tracking), Grafana (Sys metrics).

---

# 20. DEVOPS & DEPLOYMENT

## Architecture Setup
- Docker Compose currently for dev. Terraform configs built for modules (`vpc`, `eks`, `rds`).
- Missing CI/CD GitHub Actions pipelines to deploy automatically to staging on `main` merge.

---

# 21. LEGAL & COMPLIANCE

- Crucial handling of India's **DPDP Act (Digital Personal Data Protection)**, mandating PII encryption and Right To Forget.
- Escrow regulations compliance via nodal bank routing via Razorpay.

---

# 22. AI FEATURES & AUTOMATION

- **Budget Planner:** (Planned) Given 15L INR budget, extrapolates dynamic allocations (Catering 30%, Venue 40% etc.) based on historical metro averages.

---

# 23. SIMILAR PLATFORMS / COMPETITOR ANALYSIS

## Direct Competitors
- **WedMeGood, WeddingWire, ShaadiSaga, Shaadi.com**

## Why WeddingOS Wins (Competitor Weaknesses)
- Competitors are primarily **Lead-Gen Directories** (JustDial for weddings).
- Vendors pay for leads, but transactions occur OFF PLATFORM.
- **WeddingOS** enforces ON-PLATFORM escrow transactions acting directly as the protective middleware and Execution software. We solve TRUTH over DISCOVERY.

---

# 24. FUTURE FEATURE WISHLIST
- AR/VR Venue plotting (walkthroughs).
- Smart AI contract parsing.
- Hyperlocal instant delivery integrations (Zepto-like emergency event supplies).

---

# 25. SCREENSHOTS & RECORDINGS
*(To be populated after Sprint 3)*

---

# 26. ACCESS DETAILS
| Environment | URL | Details |
|---|---|---|
| Dev Local | `localhost:3000` | Start via `pnpm dev` |
| Swagger API | `localhost:8000/docs` | Kong Proxy routing |

---

# 27. MAIN EXPECTATIONS FROM CHATGPT / AI CODERS

1. Immediate remediation to **Event Bus integration** across microservices.
2. Complete construction of the **Flutter Mobile App**.
3. Refactoring UIs to integrate directly with internal APIs (replace mock data).
4. Implement rigorous E2E testing.

---

# 28. SPECIAL NOTES

Development operates on a 7-Sprint strict Go-To-Market roadmap. Current state lies entirely prior to Sprint 1 backend business integrations. See `sprints/` folder.

---

# 29. FINAL ANALYSIS REQUEST

**Immediate AI Executive Strategy Checklist:**
1. **Architecture Pivot:** Add a message queue (BullMQ + Redis / Kafka) instantly for async tasks.
2. **Phase 1 Priority:** Enforce the Authentication <-> Booking CRM <-> Database linkage. Forget UI Polish until APIs return clean business logic data.
3. **Database Setup:** Refactor the existing Prisma schemas to map relations via UUID bindings appropriately across microservice boundaries.
4. **DevOps Reality:** Finalize the GitHub Actions scripts so that tests are mandatory to approve PRs.

---
"""
    f_out.write(readme_content)
