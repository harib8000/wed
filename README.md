<div align="center">

```
╦ ╦╔═╗╔╦╗╔╦╗╦╔╗╔╔═╗  ╔═╗╔═╗
║║║║╣  ║║ ║║║║║║║ ╦  ║ ║╚═╗
╚╩╝╚═╝═╩╝═╩╝╩╝╚╝╚═╝  ╚═╝╚═╝
```

# 💍 WeddingOS

### India's End-to-End Wedding Operating System

**Discover → Book → Pay (Escrow) → Execute → Review — One Unified Platform**

<br/>

| 🏗️ Services | 📱 Apps | 📡 Events | 📊 Endpoints | 🗄️ Databases | 📦 Shared Pkgs | 📝 Source Files |
|:-----------:|:------:|:--------:|:-----------:|:------------:|:--------------:|:--------------:|
| **12** Microservices | **4** (Web · Mobile · Admin · Vendor) | **43** Domain Events | **50+** REST | **8** Postgres + **1** Mongo | **4** Packages | **241** files · **30k** LOC |

<br/>

![Node](https://img.shields.io/badge/Node.js-20_LTS-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=flat-square&logo=next.js&logoColor=white)
![Flutter](https://img.shields.io/badge/Flutter-3.19-02569B?style=flat-square&logo=flutter&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.13-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.13-005571?style=flat-square&logo=elasticsearch&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Escrow-2962FF?style=flat-square&logo=razorpay&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?style=flat-square&logo=fastapi&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2.0-EF4444?style=flat-square&logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9.0-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Kong](https://img.shields.io/badge/Kong-3.6-003459?style=flat-square&logo=kong&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

</div>

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Web App — Next.js](#3-web-app--nextjs)
4. [Flutter Mobile App](#4-flutter-mobile-app)
5. [Admin Dashboard](#5-admin-dashboard)
6. [Vendor Portal](#6-vendor-portal)
7. [Backend Microservices](#7-backend-microservices)
8. [Shared Packages](#8-shared-packages)
9. [Database Architecture](#9-database-architecture)
10. [Event-Driven Communication](#10-event-driven-communication)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Infrastructure & Docker](#12-infrastructure--docker)
13. [CI/CD Pipelines](#13-cicd-pipelines)
14. [Getting Started](#14-getting-started)
15. [Environment Variables](#15-environment-variables)
16. [Project Status](#16-project-status)
17. [Testing Architecture](#17-testing-architecture)
18. [Error Handling Patterns](#18-error-handling-patterns)
19. [Code Quality Standards](#19-code-quality-standards)
20. [Event Bus Deep Dive](#20-event-bus-deep-dive)
21. [Booking & Payment Lifecycle](#21-booking--payment-lifecycle)
22. [Real-Time Architecture](#22-real-time-architecture)
23. [File Upload — S3 Presigned URLs](#23-file-upload--s3-presigned-urls)
24. [Seed Data](#24-seed-data)
25. [Rebuild from Scratch Guide](#25-rebuild-from-scratch-guide)
26. [Complete Database Schema Reference](#26-complete-database-schema-reference)
27. [Shared Package API Reference](#27-shared-package-api-reference)
28. [Cross-Service Communication Flows](#28-cross-service-communication-flows)
29. [Error Code Reference](#29-error-code-reference)
30. [Service Source File Architecture](#30-service-source-file-architecture)
31. [Testing Documentation](#31-testing-documentation)
32. [API Request & Response Examples](#32-api-request--response-examples)
33. [Rebuild from Scratch — Detailed Guide](#33-rebuild-from-scratch--detailed-guide)
34. [Troubleshooting & Debugging](#34-troubleshooting--debugging)
35. [Architectural Decision Records](#35-architectural-decision-records)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │  Next.js 14   │  │   Flutter    │  │  React 18  │  │  React 18    │   │
│  │  Web App      │  │   iOS/AND    │  │  Admin     │  │  Vendor      │   │
│  │  :3000        │  │   Riverpod   │  │  Ant Design│  │  Portal      │   │
│  │  Tailwind     │  │   GoRouter   │  │  Vite :3001│  │  Vite :3002  │   │
│  └──────┬────────┘  └──────┬───────┘  └─────┬──────┘  └──────┬───────┘   │
└─────────┼──────────────────┼────────────────┼────────────────┼───────────┘
          │                  │                │                │
          ▼                  ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    KONG API GATEWAY (:8000)                               │
│              Rate Limiting · Auth Routing · CORS                         │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ auth-service │  │ user-service │  │vendor-service│
│   :4001      │  │   :4002      │  │   :4003      │
│  Express+JWT │  │  Express+S3  │  │  Express+ES  │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│booking-svc   │  │payment-svc   │  │execution-svc │
│   :4004      │  │   :4005      │  │   :4006      │
│  Express+FSM │  │ Express+Rzpay│  │ Express+WS   │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│notification  │  │ review-svc   │  │  chat-svc    │
│   :4008      │  │   :4009      │  │   :4010      │
│ Express+BullMQ│ │  Express     │  │ Express+WS   │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│ search-svc   │  │ media-svc    │
│   :4011      │  │   :4012      │
│ Express+ES   │  │ Express+S3   │
└──────────────┘  └──────────────┘
┌──────────────┐
│  ai-service  │
│   :5000      │
│  FastAPI/Py  │
└──────────────┘
         │                │                │
         ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PostgreSQL 16│ │   Redis 7    │ │Elasticsearch │ │  MongoDB 7   │
│   :5432      │ │   :6379      │ │  8.13 :9200  │ │   :27017     │
│  8 databases │ │  Cache+PubSub│ │ Vendor search│ │  Chat msgs   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Web (Customer)** | Next.js (App Router) + Tailwind CSS | 14.2.3 | User-facing booking platform |
| **Web (Admin)** | React + Vite + Ant Design | 18.3.0 | Platform administration |
| **Web (Vendor)** | React + Vite + Tailwind CSS | 18.3.0 | Vendor management portal |
| **Mobile** | Flutter + Riverpod + GoRouter | 3.19 | iOS & Android customer + vendor app |
| **API Gateway** | Kong (DB-less mode) | 3.6 | Routing, rate-limiting |
| **Backend Services** | Express.js + TypeScript | 4.19 | 11 Node.js microservices |
| **AI Service** | FastAPI + Python | 3.12 | Budget planning, recommendations, chat |
| **ORM** | Prisma | 5.13 | PostgreSQL schema & migrations |
| **Primary DB** | PostgreSQL | 16 | 8 service databases |
| **Document DB** | MongoDB | 7 | Chat message storage |
| **Cache / PubSub** | Redis | 7 | Sessions, event bus, job queues |
| **Job Queue** | BullMQ | 5.7 | Async notification & escrow jobs |
| **Search Engine** | Elasticsearch | 8.13 | Full-text vendor search |
| **Payments** | Razorpay | — | Escrow, UPI, cards |
| **Push Notifications** | Firebase Admin SDK (FCM) | — | Mobile push notifications |
| **SMS / WhatsApp** | MSG91 | — | OTP delivery, alerts |
| **Email** | SendGrid | — | Transactional emails |
| **Object Storage** | AWS S3 / Cloudflare R2 | — | Media uploads |
| **Monorepo** | Turborepo + pnpm workspaces | 2.0 / 9.0 | Build orchestration |
| **CI/CD** | GitHub Actions | — | Lint, test, build, deploy |
| **Container Runtime** | Docker Compose | 3.9 | Local development environment |
| **Cloud Deploy** | AWS ECS Fargate + Vercel | — | Production hosting |

---

## 2. Monorepo Structure

```
wedding-os/                          ← Root (pnpm workspace + Turborepo)
├── package.json                     ← Root scripts: dev, build, lint, test, typecheck, db:migrate
├── turbo.json                       ← Task pipeline: build→test→lint→typecheck→db:migrate/generate
├── pnpm-workspace.yaml              ← Workspaces: apps/*, services/*, packages/*
├── tsconfig.base.json               ← Shared TS config: ES2022, strict, Prisma-compatible
├── .env.example                     ← All env vars documented
├── .gitignore                       ← node_modules, dist, .env, .next, build, keys, __pycache__
│
├── apps/
│   ├── web/                         ← Next.js 14 customer app (:3000)
│   ├── mobile/                      ← Flutter iOS/Android app
│   ├── admin/                       ← React + Ant Design admin dashboard (:3001)
│   └── vendor-web/                  ← React + Tailwind vendor portal (:3002)
│
├── services/
│   ├── auth-service/                ← JWT + OTP authentication (:4001)
│   ├── user-service/                ← User profiles + KYC (:4002)
│   ├── vendor-service/              ← Vendor CRUD + ES indexing (:4003)
│   ├── booking-service/             ← Booking lifecycle FSM (:4004)
│   ├── payment-service/             ← Razorpay escrow + refunds (:4005)
│   ├── execution-service/           ← Wedding timeline + tasks (:4006)
│   ├── notification-service/        ← Push/SMS/Email/WhatsApp (:4008)
│   ├── review-service/              ← Reviews + ratings (:4009)
│   ├── chat-service/                ← Real-time messaging (:4010)
│   ├── search-service/              ← Elasticsearch vendor search (:4011)
│   ├── media-service/               ← S3 presigned uploads (:4012)
│   └── ai-service/                  ← FastAPI AI assistant (:5000)
│
├── packages/
│   ├── shared-types/                ← TypeScript interfaces & enums
│   ├── shared-errors/               ← Standardized error classes (AUTH_1xxx → SYS_9xxx)
│   ├── shared-events/               ← Redis pub/sub event bus (43 event types)
│   └── shared-utils/                ← Currency, dates, validation, crypto helpers
│
├── scripts/
│   └── seed/init.sql                ← Creates 8 Postgres databases
│
├── sprints/                         ← Sprint planning documents (7 sprints)
├── docs/
│   ├── PRD_v1.0.md                  ← Product Requirements Document
│   └── Vol3_MasterBible.md          ← Master technical bible
│
├── docker-compose.dev.yml           ← Full stack: 12 services + 4 DBs + Kong + dev tools
├── docker-compose.infra.yml         ← Infrastructure only: Postgres + Redis + ES + MongoDB
│
└── .github/workflows/
    ├── ci.yml                       ← Lint → Test → Build (web + services + Flutter + Android + iOS)
    └── cd.yml                       ← Deploy services to ECS, web to Vercel, portals to S3/CloudFront
```

### Root Scripts (package.json)

| Command | Action |
|---------|--------|
| `pnpm dev` | Start all apps and services via Turborepo |
| `pnpm build` | Build all packages (respects `dependsOn: ["^build"]`) |
| `pnpm lint` | Lint all workspaces |
| `pnpm test` | Run all tests (outputs to `coverage/`) |
| `pnpm typecheck` | TypeScript `--noEmit` across all services |
| `pnpm db:migrate` | Run Prisma migrations (all services) |
| `pnpm db:generate` | Generate Prisma clients |
| `pnpm clean` | Remove `dist/` + `node_modules/` everywhere |

---

## 3. Web App — Next.js

**Location:** `apps/web/` · **Port:** 3000 · **Package:** `@wedding-os/web`

### 3.1 Configuration

| File | Details |
|------|---------|
| `next.config.js` | React strict mode, image domains (S3, Unsplash, placeholder), **10 API rewrites** to microservices |
| `tailwind.config.js` | Custom brand colors (purple #C026D3 → gold #F59E0B), Playfair Display + Inter fonts, custom animations (fade-in, slide-up, pulse-soft) |
| `postcss.config.js` | Tailwind CSS + Autoprefixer |
| `tsconfig.json` | Extends root, path aliases: `@/*` → `./src/*` |

### 3.2 API Rewrites (next.config.js)

All frontend API calls are proxied to backend services:

| Frontend Path | Backend Target |
|--------------|----------------|
| `/api/auth/*` | `http://localhost:4001/auth/*` |
| `/api/users/*` | `http://localhost:4002/users/*` |
| `/api/vendors/*` | `http://localhost:4003/vendors/*` |
| `/api/bookings/*` | `http://localhost:4004/bookings/*` |
| `/api/payments/*` | `http://localhost:4005/payments/*` |
| `/api/execution/*` | `http://localhost:4006/execution/*` |
| `/api/notifications/*` | `http://localhost:4008/notifications/*` |
| `/api/reviews/*` | `http://localhost:4009/reviews/*` |
| `/api/search/*` | `http://localhost:4011/search/*` |
| `/api/media/*` | `http://localhost:4012/media/*` |

### 3.3 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.3 | React framework (App Router) |
| `react` / `react-dom` | ^18.3.0 | UI library |
| `axios` | ^1.7.0 | HTTP client with interceptors |
| `zustand` | ^4.5.0 | Auth state management |
| `@tanstack/react-query` | ^5.37.0 | Server state / data fetching |
| `react-hook-form` | ^7.51.0 | Form handling |
| `zod` + `@hookform/resolvers` | ^3.23.0 | Schema validation |
| `framer-motion` | ^11.2.0 | Animations (card entry, page transitions) |
| `lucide-react` | ^0.378.0 | Icon library |
| `react-hot-toast` | ^2.4.0 | Toast notifications |
| `socket.io-client` | ^4.7.0 | Real-time messaging |
| `date-fns` | ^3.6.0 | Date formatting |
| `clsx` + `tailwind-merge` | latest | Conditional class names |
| `js-cookie` | ^3.0.5 | Cookie management (JWT tokens) |
| `tailwindcss` | ^3.4.0 | Utility-first CSS |

### 3.4 Pages & Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Homepage — Hero, CategoryGrid, HowItWorks, FeaturedVendors, TrustSection, Testimonials, CTA, Footer |
| `/login` | `app/login/page.tsx` | Role selection screen (Couple / Vendor / Coordinator / Admin) |
| `/login/couple` | `app/login/couple/page.tsx` | Customer OTP login |
| `/login/vendor` | `app/login/vendor/page.tsx` | Vendor OTP login |
| `/login/coordinator` | `app/login/coordinator/page.tsx` | Coordinator OTP login |
| `/login/admin` | `app/login/admin/page.tsx` | Admin OTP login |
| `/dashboard` | `app/dashboard/page.tsx` | Category browser, tasks, activity feed |
| `/vendors` | `app/vendors/page.tsx` | Vendor listing with category/city/rating filters, search, sort, pagination |
| `/vendors/[id]` | `app/vendors/[id]/page.tsx` | Vendor detail — packages, portfolio, reviews, availability |
| `/bookings` | `app/bookings/page.tsx` | User bookings with status tabs (All/Active/Pending/Completed) + stats header |
| `/bookings/[id]` | `app/bookings/[id]/page.tsx` | Booking detail — escrow timeline, payment summary, activity log, actions |
| `/checkout/[vendorId]` | `app/checkout/[vendorId]/page.tsx` | Package selector, event details form, Razorpay integration |
| `/checkout/success` | `app/checkout/success/page.tsx` | Payment success confirmation with confetti animation |
| `/profile` | `app/profile/page.tsx` | Edit profile, wedding countdown, notification preferences, logout |
| `/wishlist` | `app/wishlist/page.tsx` | Saved vendors with category filters (localStorage persistence) |
| `/chat` | `app/chat/page.tsx` | Vendor messaging interface |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy (accordion sections using native details/summary) |
| `/terms` | `app/terms/page.tsx` | Terms of service |
| `/*` (404) | `app/not-found.tsx` | Custom 404 page |

### 3.5 Components

#### Layout (`src/components/layout/`)

| Component | Description |
|-----------|-------------|
| `Navbar.tsx` | Top navigation — conditional guest vs logged-in menus, mobile hamburger |
| `Footer.tsx` | Site footer with links, social, copyright |
| `BottomNav.tsx` | Mobile bottom tab bar — Home, Vendors, Bookings, Wishlist, Profile |
| `CookieConsent.tsx` | Cookie consent banner (localStorage key: `wedding_os_cookie_consent`) |
| `NetworkStatus.tsx` | Online/offline connectivity indicator |

#### Home Page (`src/components/home/`)

| Component | Description |
|-----------|-------------|
| `HeroSection.tsx` | Hero banner with CTA buttons |
| `CategoryGrid.tsx` | 10 wedding service category cards with images |
| `HowItWorks.tsx` | 3-step process explanation |
| `FeaturedVendors.tsx` | Featured vendors carousel with framer-motion |
| `TrustSection.tsx` | Trust badges with IntersectionObserver count-up animations |
| `TestimonialsSection.tsx` | Customer testimonials carousel |
| `CTASection.tsx` | Call-to-action section |

#### Auth (`src/components/auth/`)

| Component | Description |
|-----------|-------------|
| `RoleLoginPage.tsx` | Reusable OTP login component — phone input, OTP verification, timer, resend logic |

### 3.6 API Client (`src/lib/api.ts`)

Axios instance with:
- **Base URL:** `/api` (proxied via Next.js rewrites)
- **Timeout:** 10 seconds
- **Token Storage:** Cookies (`access_token`, `refresh_token`) + localStorage fallback
- **Request Interceptor:** Auto-attaches `Authorization: Bearer <token>`
- **Response Interceptor:** 401 → auto-refresh token → retry request → redirect to `/login` on failure

**Exposed API methods:**

| Category | Methods |
|----------|---------|
| **Auth** | `sendOtp(phone)`, `verifyOtp(phone, otp)`, `me()`, `logout()`, `refresh(token)` |
| **Vendors** | `search(params)`, `getById(id)`, `getPackages(id)`, `getReviews(id)`, `getAvailability(id, year, month)`, `getPortfolio(id)`, `updateMe(data)` |
| **Search** | `search(params)`, `autocomplete(q)` |
| **Bookings** | `enquire(data)`, `list()`, `getById(id)`, `confirm(id)`, `cancel(id, reason)` |
| **Payments** | `createOrder(data)`, `verify(data)`, `getByBooking(bookingId)` |
| **Users** | `getProfile()`, `updateProfile(data)` |
| **Execution** | `getTimeline(customerId)`, `createTimeline(data)`, `updateTask(taskId, data)` |
| **Reviews** | `create(data)`, `getVendorReviews(vendorId, params)` |

### 3.7 State Management (`src/store/authStore.ts`)

Zustand store with:

```typescript
interface AuthState {
  user: User | null;        // { id, phone, email?, role, status, phoneVerified }
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  setUser(user): void;
  setLoading(loading): void;
  setTokens(access, refresh): void;  // Stores in cookies (sameSite: lax) + localStorage
  logout(): void;                     // Clears everything, redirects to /login
}
```

**User Roles:** `customer` | `vendor` | `coordinator` | `admin` | `super_admin`

### 3.8 Global Styles (`src/app/globals.css`)

- Tailwind directives (`@tailwind base/components/utilities`)
- Custom utility classes: `.btn-primary`, `.btn-secondary`, `.btn-gold`, `.card`, `.input-field`, `.badge`, `.section-heading`, `.gradient-brand`
- Keyframe animations: `shimmer`, `slideUp`
- Accessibility: `.focus-ring`, `.sr-only`
- Scrollbar: `.no-scrollbar`

### 3.9 Providers (`src/app/providers.tsx`)

React Query setup:
- **Stale time:** 60 seconds
- **Retry count:** 1

### 3.10 Root Layout (`src/app/layout.tsx`)

- Google Fonts: **Inter** (sans), **Playfair Display** (headings)
- Includes: `NetworkStatus`, `BottomNav`, `CookieConsent`, `Toaster`
- Body: `font-sans bg-white text-gray-900 antialiased pb-16 md:pb-0`
- SEO metadata configured

---

## 4. Flutter Mobile App

**Location:** `apps/mobile/` · **SDK:** Flutter ≥3.2.0 · **Dart:** ≥3.2.0

### 4.1 Dependencies (pubspec.yaml)

| Package | Version | Purpose |
|---------|---------|---------|
| `go_router` | 14.0.0 | Declarative routing with ShellRoute |
| `flutter_riverpod` | 2.5.0 | State management |
| `riverpod_annotation` | 2.3.0 | Code generation for providers |
| `dio` | 5.4.0 | HTTP client with interceptors |
| `flutter_secure_storage` | 9.0.0 | Secure JWT token storage |
| `hive_flutter` | 1.1.0 | Local offline cache |
| `shared_preferences` | 2.2.0 | Simple key-value storage |
| `razorpay_flutter` | 1.3.5 | Payment integration |
| `firebase_core` | 3.0.0 | Firebase initialization |
| `firebase_messaging` | 15.0.0 | Push notifications (FCM) |
| `flutter_local_notifications` | 17.0.0 | Local notification display |
| `cached_network_image` | 3.3.0 | Image caching |
| `shimmer` | 3.0.0 | Loading skeleton animations |
| `google_fonts` | 6.1.0 | Playfair Display + Inter fonts |
| `flutter_svg` | 2.0.9 | SVG rendering |
| `connectivity_plus` | 6.0.0 | Network connectivity monitoring |
| `intl` | 0.19.0 | Internationalization |
| `url_launcher` | 6.2.0 | External URL handling |
| `image_picker` | 1.0.0 | Camera/gallery image selection |
| `share_plus` | 9.0.0 | Native share dialog |

### 4.2 App Architecture

```
lib/
├── main.dart                         ← Entry point: Firebase init, ProviderScope, phone-frame on web
├── core/
│   ├── theme.dart                    ← Material 3 theme: brand purple #C026D3, gold #F59E0B
│   ├── router.dart                   ← GoRouter: auth guard, customer & vendor shells
│   └── api_client.dart               ← Dio: auto-JWT, 401 refresh, base URL per environment
├── models/
│   ├── user.dart                     ← User model
│   ├── vendor.dart                   ← Vendor model
│   ├── booking.dart                  ← Booking model
│   ├── review.dart                   ← Review model
│   └── vendor_analytics.dart         ← Vendor analytics model
├── providers/
│   ├── auth_provider.dart            ← Riverpod auth state
│   ├── vendor_provider.dart          ← Vendor data providers
│   ├── booking_provider.dart         ← Booking data providers
│   ├── connectivity_provider.dart    ← Online/offline state
│   └── vendor_analytics_provider.dart← Vendor dashboard analytics
├── services/
│   └── notification_service.dart     ← FCM + local notification setup
├── shared/widgets/
│   ├── app_shell.dart                ← Customer bottom nav: Home, Vendors, Bookings, Profile
│   └── vendor_app_shell.dart         ← Vendor bottom nav: Dashboard, Analytics, Bookings, Earnings, Profile
└── features/
    ├── auth/login_screen.dart
    ├── home/home_screen.dart
    ├── vendors/
    │   ├── vendors_screen.dart
    │   └── vendor_detail_screen.dart
    ├── bookings/
    │   ├── bookings_screen.dart
    │   ├── booking_detail_screen.dart
    │   └── checkout_screen.dart
    ├── chat/chat_screen.dart
    ├── reviews/write_review_screen.dart
    ├── wishlist/wishlist_screen.dart
    ├── checklist/checklist_screen.dart
    ├── notifications/notifications_screen.dart
    ├── profile/profile_screen.dart
    └── vendor_dashboard/
        ├── vendor_dashboard_screen_v2.dart
        ├── vendor_analytics_screen.dart
        ├── vendor_bookings_screen_v2.dart
        ├── vendor_earnings_screen_v2.dart
        ├── vendor_profile_screen_v2.dart
        ├── vendor_leads_screen.dart
        ├── vendor_calendar_screen.dart
        ├── vendor_reviews_screen.dart
        └── vendor_settings_screen.dart
```

### 4.3 Router (GoRouter)

| Route | Screen | Shell | Auth Required |
|-------|--------|-------|---------------|
| `/login` | LoginScreen | None | No |
| `/` | HomeScreen | Customer | Yes |
| `/vendors` | VendorsScreen | Customer | Yes |
| `/bookings` | BookingsScreen | Customer | Yes |
| `/wishlist` | WishlistScreen | Customer | Yes |
| `/checklist` | ChecklistScreen | Customer | Yes |
| `/profile` | ProfileScreen | Customer | Yes |
| `/vendors/:id` | VendorDetailScreen | None (full-screen) | Yes |
| `/bookings/:id` | BookingDetailScreen | None (full-screen) | Yes |
| `/checkout/:vendorId` | CheckoutScreen | None (full-screen) | Yes |
| `/chat/:vendorId` | ChatScreen | None (full-screen) | Yes |
| `/notifications` | NotificationsScreen | None (full-screen) | Yes |
| `/reviews/write` | WriteReviewScreen | None (full-screen) | Yes |
| `/vendor/dashboard` | VendorDashboardScreen | Vendor | Yes (vendor role) |
| `/vendor/analytics` | VendorAnalyticsScreen | Vendor | Yes (vendor role) |
| `/vendor/bookings` | VendorBookingsScreen | Vendor | Yes (vendor role) |
| `/vendor/earnings` | VendorEarningsScreen | Vendor | Yes (vendor role) |
| `/vendor/profile` | VendorProfileScreen | Vendor | Yes (vendor role) |
| `/vendor/leads` | VendorLeadsScreen | None (full-screen) | Yes (vendor role) |
| `/vendor/calendar` | VendorCalendarScreen | None (full-screen) | Yes (vendor role) |
| `/vendor/reviews` | VendorReviewsScreen | None (full-screen) | Yes (vendor role) |
| `/vendor/settings` | VendorSettingsScreen | None (full-screen) | Yes (vendor role) |

**RBAC:** Auth guard redirects vendors to `/vendor/dashboard`, customers to `/`.

### 4.4 API Client

- **Debug URL:** `http://10.0.2.2:8000/api/v1` (Android emulator)
- **Production URL:** `https://api.weddingos.in/api/v1`
- **Auth:** JWT stored in `FlutterSecureStorage`, auto-attached via Dio interceptor
- **Token Refresh:** Automatic on 401 response
- **Methods:** `sendOtp()`, `verifyOtp()`, `getMe()`, `registerFcmToken()`, `searchVendors()`, `getBookings()`, `submitReview()`, etc.

---

## 5. Admin Dashboard

**Location:** `apps/admin/` · **Port:** 3001 · **Package:** `@wedding-os/admin`

### 5.1 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.0 | UI framework |
| Vite | latest | Build tool |
| Ant Design | 5.17.0 | UI component library |
| React Router | 6.23.0 | Client-side routing |
| React Query | ^5.37.0 | Data fetching |
| Zustand | ^4.5.0 | Auth state |
| Recharts | 2.12.0 | Dashboard charts |
| Axios | ^1.7.0 | HTTP client |

### 5.2 Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | `Login.tsx` | Admin login |
| `/` | `Dashboard.tsx` | Stats cards (users, vendors, bookings, revenue), monthly revenue chart, pending vendors table |
| `/vendors` | `Vendors.tsx` | Vendor list with approve/reject/suspend actions |
| `/bookings` | `Bookings.tsx` | Booking management |
| `/users` | `Users.tsx` | User management |
| `/payments` | `Payments.tsx` | Payment management with refund & escrow release |

### 5.3 Layout

- **AdminLayout.tsx:** Ant Design Sider with collapse, Header with notification bell + avatar + logout
- **Sidebar Menu:** Dashboard, Vendors, Bookings, Users, Payments
- **Brand:** Purple/violet gradient "W" logo

### 5.4 API Client

- **Base URL:** `VITE_API_URL` or `http://localhost:8000/api/v1`
- **Auth:** Cookie-based (`admin_token`), auto-redirect on 401
- **Endpoints:** `/admin/stats`, `/admin/revenue/monthly`, `/admin/vendors`, `/admin/bookings`, `/admin/payments`, `/admin/users`

---

## 6. Vendor Portal

**Location:** `apps/vendor-web/` · **Port:** 3002 · **Package:** `@wedding-os/vendor-web`

### 6.1 Tech Stack

React 18.3 + Vite + Tailwind CSS + React Hook Form + Zod + React Query + Recharts + Zustand

### 6.2 Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | `LoginPage.tsx` | Vendor login |
| `/` | `DashboardHome.tsx` | Vendor dashboard home |
| `/bookings` | `BookingsPage.tsx` | Vendor booking management |
| `/analytics` | `AnalyticsPage.tsx` | Performance analytics |
| `/profile` | `ProfilePage.tsx` | Vendor profile management |

### 6.3 Structure

- **DashboardLayout.tsx:** Sidebar navigation layout
- **authStore.ts:** Zustand auth state (same pattern as web app)
- **api.ts:** Axios client for vendor-specific endpoints

---

## 7. Backend Microservices

All 11 Node.js services share a common structure:

```
services/{service-name}/
├── package.json          ← Scripts: dev, build, start, test, lint, typecheck, db:migrate, db:generate
├── tsconfig.json         ← Extends ../../tsconfig.base.json
├── Dockerfile            ← Multi-stage: Node 20-alpine, non-root user (appuser)
├── prisma/
│   └── schema.prisma     ← Service-specific database schema
└── src/
    ├── server.ts         ← Entry: Express app + graceful shutdown (SIGTERM/SIGINT)
    ├── app.ts            ← Express setup: middleware stack
    ├── config/
    │   └── index.ts      ← Environment variable validation
    ├── routes/
    │   └── *.routes.ts   ← Route definitions
    ├── controllers/
    │   └── *.controller.ts
    ├── services/
    │   └── *.service.ts  ← Business logic
    ├── middleware/
    │   ├── auth.ts       ← JWT verification
    │   ├── errorHandler.ts
    │   └── requestId.ts  ← X-Request-ID tracking
    └── utils/
```

**Common Middleware Stack** (all services):
1. `helmet()` — Security headers
2. `cors({ credentials: true })` — Cross-origin requests
3. `express-rate-limit()` — Rate limiting (100-500 req/15 min per service)
4. `express.json()` — Body parsing (10KB-1MB limits)
5. `pinoHttp()` — Structured JSON request logging
6. `requestId` — X-Request-ID header tracking
7. `errorHandler` — Global error handling with standardized responses

**Standard API Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

---

### 7.1 Auth Service (:4001)

**Package:** `@wedding-os/auth-service` · **Database:** PostgreSQL (`weddingos_auth`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/send-otp` | POST | No | Send 6-digit OTP to phone (rate-limited) |
| `/auth/verify-otp` | POST | No | Verify OTP → issue JWT + refresh token |
| `/auth/refresh` | POST | No | Refresh access token (30-day refresh tokens) |
| `/auth/logout` | POST | Yes | Revoke session, invalidate refresh token |
| `/auth/me` | GET | Yes | Get current authenticated user |
| `/auth/register-vendor` | POST | No | Register new vendor account |
| `/auth/health` | GET | No | Health check |

**Prisma Schema:**
- **User:** `id`, `phone` (unique), `email`, `passwordHash`, `role` (enum: customer/vendor/coordinator/admin/super_admin), `status` (active/suspended/deleted), `emailVerified`, `phoneVerified`
- **RefreshToken:** `id`, `userId` (FK), `tokenHash` (unique), `deviceId`, `expiresAt`, `revokedAt`

**Key Features:**
- RS256 JWT signing (private/public key pair)
- Access token: 15-minute expiry
- Refresh token: 30-day expiry, stored hashed in DB
- OTP: 6-digit via MSG91, 10-minute TTL, 3 attempts per window, 5-attempt lockout (30 min)
- BullMQ for async OTP delivery
- Redis for OTP storage and rate-limit tracking
- Google OAuth support (configured but optional)

**Rate Limit:** 300 requests / 15 minutes

---

### 7.2 User Service (:4002)

**Package:** `@wedding-os/user-service` · **Database:** PostgreSQL (`weddingos_users`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/users/me` | GET | Yes | Get user profile |
| `/users/me` | PUT | Yes | Update profile (name, email, DOB, wedding info) |
| `/users/me/notifications` | PUT | Yes | Update notification preferences |
| `/users/me/avatar/presign` | POST | Yes | Get presigned S3 URL for avatar upload |
| `/users/me/push-token` | POST | Yes | Register FCM push token |
| `/users/me/push-token` | DELETE | Yes | Deactivate push token |
| `/health` | GET | No | Health check |

**Prisma Schema:**
- **UserProfile:** `userId` (unique), `firstName`, `lastName`, `avatar`, `email` (unique), `dateOfBirth`, `city`, `state`, `pincode`, `partnerName`, `weddingDate`, `estimatedBudgetPaise`, `guestCount`, `venueCity`, `businessName`, `businessCity`, `whatsappNotif`, `emailNotif`, `pushNotif`, `smsNotif`
- **PushToken:** `profileId` (FK), `token` (unique), `platform`, `deviceId`, `active`
- **KycDocument:** `profileId` (FK), `docType` (AADHAAR/PAN/PASSPORT/DRIVING_LICENSE/VOTER_ID/GSTIN/BANK_STATEMENT), `s3Key`, `status` (PENDING/UNDER_REVIEW/APPROVED/REJECTED), `reviewNote`, `reviewedBy`

**Rate Limit:** 300 requests / 15 minutes

---

### 7.3 Vendor Service (:4003)

**Package:** `@wedding-os/vendor-service` · **Database:** PostgreSQL (`weddingos_vendors`) · **Search:** Elasticsearch

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/vendors/search` | GET | No | Search vendors (q, category, city, minRating, minPrice, maxPrice, plusMembersOnly, page, limit, sortBy) |
| `/vendors/suggest` | GET | No | Autocomplete suggestions |
| CRUD operations | Various | Yes | Vendor profiles, packages, portfolio, availability |

**Prisma Schema:**
- **Vendor:** `userId` (unique), `businessName`, `slug` (unique), `category` (20 categories enum), `subCategories[]`, `status` (DRAFT/PENDING_REVIEW/ACTIVE/SUSPENDED/BLACKLISTED), `city`, `state`, `pincode`, `serviceCities[]`, `tagline`, `description`, `yearsExperience`, `teamSize`, `coverPhoto`, `logoUrl`, `whatsappNumber`, `websiteUrl`, `instagramUrl`, `gstNumber`, `panNumber`, `bankAccountNo`, `bankIfsc`, `avgRating`, `reviewCount`, `bookingCount`, `plusMember`, `isFeatured`
- **VendorPackage:** `name`, `packageType` (BASIC/STANDARD/PREMIUM/CUSTOM), `priceFromPaise`, `priceUpToPaise`, `isCustomQuote`, `description`, `inclusions[]`, `exclusions[]`, `deliverables[]`

**Vendor Categories (20):** PHOTOGRAPHER, VIDEOGRAPHER, CATERER, DECORATOR, VENUE, DJ_SOUND, BAND_ENTERTAINMENT, BRIDAL_MAKEUP, GROOM_MAKEUP, MEHENDI, PANDIT_PRIEST, WEDDING_PLANNER, INVITATIONS, CHOREOGRAPHER, BARTENDER, LIGHTING, FIREWORKS, TENT_HOUSE, TRANSPORTATION, FLORIST

**Rate Limit:** 400 requests / 15 minutes

---

### 7.4 Booking Service (:4004)

**Package:** `@wedding-os/booking-service` · **Database:** PostgreSQL (`weddingos_bookings`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/bookings` | POST | Customer | Create booking enquiry |
| `/bookings` | GET | Yes | List bookings (role-filtered) |
| `/bookings/:id` | GET | Yes | Get booking details |
| `/bookings/:id/quote` | POST | Vendor | Send price quote |
| `/bookings/:id/accept-quote` | POST | Customer | Accept vendor quote |
| `/bookings/:id/cancel` | POST | Yes | Cancel booking |

**Booking Status State Machine:**
```
ENQUIRY → QUOTE_SENT → QUOTE_ACCEPTED → ADVANCE_PENDING → ADVANCE_PAID
    → CONFIRMED → CHECKIN → COMPLETED
    → CANCELLED_BY_CUSTOMER | CANCELLED_BY_VENDOR | DISPUTED | REFUNDED
```

**Prisma Schema:**
- **Booking:** `bookingNumber` (unique, format: WOS-TIMESTAMP-RANDOM), `customerId`, `vendorId`, `packageId`, `status`, `eventDate`, `eventType` (12 types), `eventCity`, `quotedAmountPaise`, `advanceAmountPaise`, `finalAmountPaise`, `platformFeePaise`, `gstOnFeePaise`, `requirements`, `guestCount`, `specialNotes`, `version` (optimistic locking)
- **BookingEvent:** `bookingId`, `eventType`, `actorId`, `actorRole`, `payload` (JSON) — audit trail

**Event Types:** WEDDING_CEREMONY, RECEPTION, ENGAGEMENT, HALDI, MEHNDI, SANGEET, BACHELOR_PARTY, PRE_WEDDING_SHOOT, BIRTHDAY, ANNIVERSARY, CORPORATE, OTHER

**Event Bus:** Publishes `booking.enquiry_created`, `booking.confirmed`, `booking.cancelled`, etc.

**Rate Limit:** 300 requests / 15 minutes

---

### 7.5 Payment Service (:4005)

**Package:** `@wedding-os/payment-service` · **Database:** PostgreSQL (`weddingos_payments`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/payments/order` | POST | Customer | Create Razorpay order |
| `/payments/verify` | POST | Customer | Verify payment after client-side Razorpay checkout |
| `/payments/webhook` | POST | No (signature verified) | Razorpay webhook receiver |
| `/payments/:id/refund` | POST | Admin | Process refund |
| `/payments/escrow/:id/release` | POST | Admin | Manual escrow release |

**Prisma Schema:**
- **Payment:** `bookingId`, `customerId`, `vendorId`, `razorpayOrderId` (unique), `razorpayPaymentId` (unique), `razorpaySignature`, `idempotencyKey` (unique), `amountPaise`, `currency` (default: INR), `status` (CREATED/PENDING/CAPTURED/FAILED/REFUNDED/PARTIALLY_REFUNDED), `webhookVerified`
- **EscrowHold:** `paymentId` (unique FK), `bookingId`, `vendorId`, `heldAmountPaise`, `platformFeePaise`, `gstOnFeePaise`, `vendorPayoutPaise`, `status` (HELD/RELEASED_TO_VENDOR/REFUNDED_TO_CUSTOMER/DISPUTED), `releaseScheduledAt`, `releasedAt`

**Key Features:**
- Escrow holds: Funds held for 7 days after event, then auto-released to vendor
- Platform fee: 10% commission + 18% GST on fee
- BullMQ worker for scheduled escrow releases
- Razorpay webhook signature verification
- Idempotency keys to prevent duplicate payments
- Raw body parsing for webhook endpoint

**Rate Limit:** 200 requests / 15 minutes

---

### 7.6 Execution Service (:4006)

**Package:** `@wedding-os/execution-service` · **Database:** PostgreSQL (`weddingos_execution`) · **Real-time:** Socket.IO

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/execution/timeline` | POST | Yes | Create wedding timeline |
| `/execution/timeline` | GET | Yes | Get timeline with tasks |
| `/execution/timeline/tasks` | POST | Yes | Add task to timeline |
| `/execution/timeline/tasks/:id` | PATCH | Yes | Update task status/details |
| `/execution/timeline/tasks/:id` | DELETE | Yes | Delete task |
| `/execution/health` | GET | No | Health check |

**Prisma Schema:**
- **WeddingTimeline:** `customerId` (unique), `weddingDate`, `title`
- **TimelineTask:** `timelineId` (FK), `title`, `description`, `category` (11 categories), `status` (PENDING/IN_PROGRESS/DONE/SKIPPED), `dueDate`, `dueDaysBeforeWedding`, `linkedBookingId`, `assignedVendorId`, `completedAt`, `sortOrder`, `isSystemGenerated`
- **TaskTemplate:** `title`, `description`, `category`, `dueDaysBeforeWedding`, `sortOrder`, `isActive` — pre-configured task templates

**Task Categories:** VENDOR_BOOKING, VENUE, CATERING, DECORATION, CEREMONY, GUEST_MANAGEMENT, PHOTOGRAPHY, ENTERTAINMENT, LOGISTICS, LEGAL, OTHER

**Real-time:** Socket.IO with WebSocket + polling, room-based (`timeline:{id}`) for live task updates

**Scheduled Jobs:** Daily reminder at 08:00 IST (02:30 UTC)

---

### 7.7 Notification Service (:4008)

**Package:** `@wedding-os/notification-service` · **Database:** PostgreSQL (`weddingos_notifications`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/notifications` | GET | Yes | Get unread notifications |
| `/notifications/internal/notify` | POST | Internal | Send notification (service-to-service) |
| `/notifications/health` | GET | No | Health check |

**Channels:**
| Channel | Provider | Implementation |
|---------|----------|---------------|
| PUSH | Firebase Admin SDK (FCM) | `channels/push` |
| SMS | MSG91 | `channels/sms` |
| WHATSAPP | MSG91 | `channels/whatsapp` |
| EMAIL | SendGrid | `channels/email` |
| IN_APP | Database | Direct insert |

**Prisma Schema:**
- **NotificationLog:** `userId`, `channel` (PUSH/SMS/WHATSAPP/EMAIL/IN_APP), `event`, `title`, `body`, `data` (JSON), `status` (QUEUED/SENT/DELIVERED/FAILED/SKIPPED), `providerRef`, `errorMsg`, `sentAt`

**Event Bus Subscriptions:**
- `booking.enquiry_created` → notify vendor
- `booking.confirmed` → notify customer
- `payment.captured` → notify both parties
- `escrow.released` → notify vendor
- `review.created` → notify vendor

**BullMQ Worker:** Processes notification jobs asynchronously with retry on failure

---

### 7.8 Review Service (:4009)

**Package:** `@wedding-os/review-service` · **Database:** PostgreSQL (`weddingos_reviews`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/reviews` | POST | Customer | Create review (one per booking) |
| `/reviews/me` | GET | Customer | Get own reviews |
| `/reviews/vendor/:vendorId` | GET | No | Get public vendor reviews |
| `/reviews/:reviewId/reply` | POST | Vendor | Reply to a review |
| `/reviews/:reviewId/helpful` | POST | Yes | Mark review as helpful |
| `/reviews/health` | GET | No | Health check |

**Prisma Schema:**
- **Review:** `bookingId` (unique — one review per booking), `customerId`, `vendorId`, `rating` (1-5), `qualityRating`, `valueRating`, `professionalismRating`, `punctualityRating`, `title`, `body`, `photos[]` (S3 URLs), `isPublished`, `adminNote`, `vendorReply`, `vendorRepliedAt`, `helpfulCount`

**Rate Limit:** 200 requests / 15 minutes

---

### 7.9 Chat Service (:4010)

**Package:** `@wedding-os/chat-service` · **Database:** MongoDB (`weddingos_chat`) · **Real-time:** Socket.IO

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/chat/conversations` | POST | Yes | Create or get conversation by bookingId |
| `/chat/conversations` | GET | Yes | Get user's conversation list |
| `/chat/conversations/:bookingId/messages` | GET | Yes | Get conversation messages (paginated, 50/page) |
| `/chat/health` | GET | No | Health check |

**MongoDB Schema (Mongoose):**
- **Conversation:** `bookingId`, `customerId`, `vendorId`, `lastMessageAt`
- **Message:** `conversationId`, `senderId`, `role` (customer/vendor), `content`, `isDeleted` (soft delete)

**Socket.IO:** Real-time message delivery, JWT-authenticated WebSocket connections

**Rate Limit:** 200 requests / 15 minutes

---

### 7.10 Search Service (:4011)

**Package:** `@wedding-os/search-service` · **Engine:** Elasticsearch 8.13

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/search/vendors` | GET | No | Full-text vendor search (query, category, city, minPrice, maxPrice, minRating, sortBy, page, limit, featured) |
| `/search/autocomplete` | GET | No | Autocomplete suggestions |
| `/search/vendors/index` | POST | Internal | Index/reindex a vendor document |
| `/search/health` | GET | No | Health check |

**No database** — uses Elasticsearch as primary store for search. Vendor data is pushed by vendor-service.

**Rate Limit:** 500 requests / 15 minutes (higher for search)

---

### 7.11 Media Service (:4012)

**Package:** `@wedding-os/media-service` · **Storage:** AWS S3 / Cloudflare R2

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/media/presign` | POST | Yes | Get presigned S3 upload URL |
| `/media` | DELETE | Yes | Delete media file (own files or admin) |
| `/media/health` | GET | No | Health check |

**Media Types:** `avatar`, `portfolio`, `kyc`, `review`, `vendor_cover`, `chat`

**Features:**
- Presigned URLs for direct-to-S3 uploads
- Sharp image processing/optimization
- Max file size: 10MB (configurable)
- RS256 JWT verification for auth
- Stateless service (no database)

**Rate Limit:** 100 requests / 15 minutes

---

### 7.12 AI Service (:5000)

**Package:** `ai-service` · **Framework:** FastAPI (Python 3.12) · **No database** (stateless, LLM-based)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/ai/budget-planner` | POST | No | AI wedding budget allocation |
| `/ai/vendor-recommendations` | POST | No | AI vendor selection criteria |
| `/ai/chat` | POST | No | Wedding planning AI assistant |
| `/health` | GET | No | Health check |

**AI Providers:**
- OpenAI (default): `gpt-4o-mini`
- Anthropic (optional): `claude-3-5-haiku-20241022`

**Budget Planner Input:** `total_budget_paise`, `guest_count`, `venue_city`, `wedding_type`, `preferences[]`
**Budget Planner Output:** `allocations[]`, `tips[]`, `warnings[]`

**Features:**
- System prompts tailored to Indian wedding context
- JSON response parsing and validation
- Stub responses when no API key is configured
- Multi-turn conversation support

**Dockerfile:** Python 3.12-slim, 2 Uvicorn workers

---

## 8. Shared Packages

### 8.1 @wedding-os/shared-types (`packages/shared-types/`)

TypeScript interfaces and enums shared across all services:

| Export | Key Types |
|--------|-----------|
| **User** | `User`, `UserProfile`, `UserRole` (customer/vendor/coordinator/admin/super_admin), `JwtPayload`, `RefreshTokenPayload` |
| **Vendor** | `Vendor`, `VendorPackage`, `VendorCategory` (12 categories), `VerificationStatus`, `KycStatus`, `SubscriptionTier`, `PriceType` |
| **Booking** | `Booking`, `BookingStatus` (enquiry→quoted→confirmed→advance_paid→in_progress→completed/cancelled/disputed), `Event`, `EventType` |
| **Payment** | `Payment`, `EscrowHold`, `PaymentStatus`, `PaymentGateway` (razorpay/stripe/manual), `EscrowStatus` |
| **Notification** | `NotificationPayload`, `NotificationChannel` (push/sms/whatsapp/email/in_app) |
| **Search** | `VendorSearchFilters`, `VendorSearchResult`, `VendorSearchItem` |
| **API** | `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiResponse<T>` |
| **Other** | `Task`, `Review` |

### 8.2 @wedding-os/shared-errors (`packages/shared-errors/`)

Standardized error hierarchy extending `AppError` (with `code`, `statusCode`, `isOperational`, `field`, `details`):

| Code Range | Category | Error Classes |
|------------|----------|---------------|
| `AUTH_1xxx` | Authentication | `OtpInvalidError`, `OtpExpiredError`, `RateLimitedError`, `AccountLockedError`, `TokenExpiredError`, `TokenInvalidError`, `UnauthorizedError`, `ForbiddenError` |
| `VAL_2xxx` | Validation | `ValidationError` |
| `RES_3xxx` | Resources | `NotFoundError`, `ConflictError` |
| `BOOK_4xxx` | Bookings | `VendorNotAvailableError`, `BookingAlreadyConfirmedError`, `BookingCancellationError` |
| `PAY_5xxx` | Payments | `PaymentVerificationError`, `EscrowNotFoundError`, `InsufficientFundsError`, `DuplicatePaymentError` |
| `VEN_6xxx` | Vendors | `VendorNotVerifiedError`, `VendorSubscriptionRequiredError` |
| `SYS_9xxx` | System | `InternalError`, `ServiceUnavailableError` |

### 8.3 @wedding-os/shared-events (`packages/shared-events/`)

Redis pub/sub event bus with 43 domain event types:

| Domain | Events |
|--------|--------|
| **Auth** | `auth.otp_sent`, `auth.user_registered`, `auth.login_success` |
| **Vendor** | `vendor.registered`, `vendor.kyc_submitted`, `vendor.kyc_approved`, `vendor.kyc_rejected`, `vendor.profile_updated`, `vendor.subscription_changed` |
| **Booking** | `booking.enquiry_created`, `booking.quote_sent`, `booking.confirmed`, `booking.advance_paid`, `booking.completed`, `booking.cancelled`, `booking.disputed` |
| **Payment** | `payment.captured`, `payment.failed`, `payment.refunded` |
| **Escrow** | `escrow.created`, `escrow.released`, `escrow.disputed` |
| **Payout** | `payout.processed`, `payout.failed` |
| **Execution** | `event.created`, `event.task_completed`, `event.vendor_checked_in`, `event.issue_reported`, `event.completed` |
| **Review** | `review.created` |

**EventBus class:** `connect()`, `disconnect()`, `publish<T>()`, `subscribe()`, `subscribeMany()`, `subscribePattern()` — with self-loop prevention via `metadata.source`

**Factory:** `createEventBus(serviceName)`, `getEventBus()` (singleton)

**Dependency:** `redis@4.6.0`

### 8.4 @wedding-os/shared-utils (`packages/shared-utils/`)

| Category | Functions |
|----------|-----------|
| **Currency** | `rupeesToPaise(rupees)`, `paiseToRupees(paise)`, `formatINR(paise)` — INR-specific |
| **Date** | `addDays(date, days)`, `daysBetween(a, b)`, `isWeekend(date)`, `formatDate(date)`, `isPeakSeason(date)` — Nov-Feb is peak |
| **IDs** | `generateBookingNumber()` → `WOS-{TIMESTAMP}-{RANDOM}`, `slugify(text)`, `maskPhone(phone)` |
| **Crypto** | `generateOtp()` → 6-digit, `hashSha256(data)`, `safeCompare(a, b)` — timing-safe comparison |
| **Validation** | `isValidIndianPhone(phone)` (+91XXXXXXXXXX), `isValidGST(gst)`, `isValidPAN(pan)`, `isValidIFSC(ifsc)` |
| **Pagination** | `encodeCursor(data)`, `decodeCursor(cursor)` |
| **Fees** | `calculatePlatformFee(amount)` → `{ platformFee, gstOnFee (18%), razorpayFee (2%), vendorPayout, netToVendor }` |

**Dependency:** `pino@9.0.0` (logger)

---

## 9. Database Architecture

### 9.1 PostgreSQL (8 Databases)

Created via `scripts/seed/init.sql`, each service has its own database:

| Database | Service | Key Tables |
|----------|---------|------------|
| `weddingos_auth` | auth-service | `User`, `RefreshToken` |
| `weddingos_users` | user-service | `UserProfile`, `PushToken`, `KycDocument` |
| `weddingos_vendors` | vendor-service | `Vendor`, `VendorPackage`, `PortfolioItem`, `VendorAvailability`, `VendorTag` |
| `weddingos_bookings` | booking-service | `Booking`, `BookingEvent` |
| `weddingos_payments` | payment-service | `Payment`, `EscrowHold` |
| `weddingos_execution` | execution-service | `WeddingTimeline`, `TimelineTask`, `TaskTemplate` |
| `weddingos_notifications` | notification-service | `NotificationLog` |
| `weddingos_reviews` | review-service | `Review` |

**ORM:** Prisma 5.13 — each service has its own `prisma/schema.prisma`

### 9.2 MongoDB (1 Database)

| Database | Service | Collections |
|----------|---------|-------------|
| `weddingos_chat` | chat-service | `Conversation`, `Message` |

**ORM:** Mongoose

### 9.3 Redis (Shared)

| Usage | Service(s) |
|-------|------------|
| OTP storage & rate-limiting | auth-service |
| Session/token caching | auth-service, user-service |
| Event bus (pub/sub) | All services via shared-events |
| Job queues (BullMQ) | notification-service, payment-service, execution-service |
| Real-time pub/sub | execution-service (Socket.IO adapter) |
| Search cache | search-service |

### 9.4 Elasticsearch

| Index | Service | Purpose |
|-------|---------|---------|
| `vendors` | search-service / vendor-service | Full-text vendor search with filters |

---

## 10. Event-Driven Communication

Services communicate asynchronously via Redis pub/sub using `@wedding-os/shared-events`:

```
booking.enquiry_created   → notification-service (SMS + push to vendor)
booking.confirmed         → payment-service (create escrow)
                          → notification-service (notify customer)
payment.captured          → booking-service (update status)
                          → notification-service (notify both)
escrow.released           → vendor-service (credit vendor)
                          → notification-service (notify vendor)
review.created            → vendor-service (recalculate avgRating)
                          → notification-service (notify vendor)
vendor.kyc_approved       → search-service (index vendor in ES)
event.task_completed      → notification-service (update customer)
```

**Self-loop prevention:** Each event includes `metadata.source` field; the EventBus skips events originating from the subscribing service.

---

## 11. Authentication & Authorization

### 11.1 Flow

```
1. Phone Input    → POST /auth/send-otp     → 6-digit OTP sent via MSG91
2. OTP Verify     → POST /auth/verify-otp   → Returns { accessToken, refreshToken, user }
3. Token Storage  → Cookies (sameSite: lax) + localStorage (SSR fallback)
4. API Calls      → Authorization: Bearer <accessToken> header
5. Token Refresh  → POST /auth/refresh       → New access token (auto on 401)
6. Logout         → POST /auth/logout        → Revoke refresh token, clear storage
```

### 11.2 JWT Configuration

| Setting | Value |
|---------|-------|
| Algorithm | RS256 (asymmetric) |
| Access Token Expiry | 15 minutes |
| Refresh Token Expiry | 30 days |
| Key Files | `keys/private.pem`, `keys/public.pem` |

### 11.3 Roles & Permissions

| Role | Web App | Mobile App | Admin App | Vendor Portal |
|------|---------|------------|-----------|---------------|
| `customer` | Full access | Customer shell (Home, Vendors, Bookings, Wishlist, Profile) | — | — |
| `vendor` | Limited | Vendor shell (Dashboard, Analytics, Bookings, Earnings, Profile) | — | Full access |
| `coordinator` | Limited | — | — | — |
| `admin` | — | — | Full access | — |
| `super_admin` | — | — | Full access | — |

### 11.4 OTP Security

- Rate limit: 3 OTP requests per 10-minute window
- Lockout: 5 failed verification attempts → 30-minute lockout
- OTP TTL: 10 minutes
- OTP length: 6 digits (cryptographically generated)

---

## 12. Infrastructure & Docker

### 12.1 Docker Compose — Infrastructure Only (`docker-compose.infra.yml`)

Starts databases only for local development:

| Service | Image | Port | Volumes |
|---------|-------|------|---------|
| `postgres` | `postgres:16-alpine` | 5432 | `postgres_data`, init.sql |
| `redis` | `redis:7-alpine` | 6379 | `redis_data` (AOF enabled) |
| `elasticsearch` | `elasticsearch:8.13.0` | 9200 | `es_data` (single-node, security disabled) |
| `mongodb` | `mongo:7-jammy` | 27017 | `mongo_data` |

```bash
docker compose -f docker-compose.infra.yml up -d
```

### 12.2 Docker Compose — Full Stack (`docker-compose.dev.yml`)

Starts everything: databases + 12 services + Kong + dev tools:

| Category | Services | Ports |
|----------|----------|-------|
| **Databases** | postgres, redis, elasticsearch, mongodb | 5432, 6379, 9200, 27017 |
| **Backend** | auth, user, vendor, booking, payment, execution, notification, review, chat, search, media | 4001-4012 |
| **AI** | ai-service | 5000 |
| **Gateway** | Kong (DB-less mode) | 8000 (proxy), 8001 (admin) |
| **Dev Tools** | Redis Commander, Kibana | 8081, 5601 |

**Network:** `weddingos-network` (shared Docker network)

**Volumes:** `postgres_data`, `redis_data`, `es_data`, `mongo_data`

### 12.3 Dockerfiles

All Node.js services use identical multi-stage builds:

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Runner
FROM node:20-alpine AS runner
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER appuser
EXPOSE {port}
CMD ["node", "dist/server.js"]
```

AI service uses `python:3.12-slim` with 2 Uvicorn workers.

---

## 13. CI/CD Pipelines

### 13.1 CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:** Push to `main`/`develop`, Pull requests

| Job | Runner | Depends On | Description |
|-----|--------|------------|-------------|
| **Lint & Type-check** | ubuntu-latest | — | `pnpm lint` + `tsc --noEmit` |
| **Service Tests** | ubuntu-latest | lint | Jest tests with Postgres + Redis services |
| **Build Web App** | ubuntu-latest | lint | `pnpm --filter web build`, uploads `.next` artifact |
| **Flutter Analyze** | ubuntu-latest | — | `flutter analyze` + `flutter test --coverage` |
| **Build Android APK** | ubuntu-latest | flutter-analyze | Debug APK (PRs) or release APK with keystore (main) |
| **Build iOS IPA** | macos-latest | flutter-analyze | Release build (main/tags only) |
| **Docker Build & Push** | ubuntu-latest | test-services, build-web | 11 services → GHCR (`ghcr.io/{owner}/weddingos-{service}:{sha}`) |
| **Deploy Staging** | ubuntu-latest | docker-services, build-android | Terraform apply (develop branch) |
| **Deploy Production** | ubuntu-latest | docker-services | Terraform apply (v* tags, manual approval) |

**Environment:** Node 20, pnpm 9, Flutter 3.19.6, Java 17

### 13.2 CD Pipeline (`.github/workflows/cd.yml`)

**Triggers:** Push to `develop`, tags (`v*`, `staging-*`), manual dispatch

| Job | Description |
|-----|-------------|
| **Resolve Environment** | Determine staging vs production based on trigger |
| **Deploy Services** | Matrix deploy 10 services to AWS ECS Fargate (max-parallel: 3) |
| **Deploy Web** | Build and deploy to Vercel |
| **Deploy Portals** | Build admin + vendor-web, deploy to S3 + CloudFront |
| **Migrate DB** | Run `prisma migrate deploy` for 6 services |
| **Smoke Test** | Health check all services + web reachability |
| **Promote to Production** | Manual approval gate (v* tags only) |

**Deployment Targets:**

| App | Staging | Production |
|-----|---------|------------|
| Web | `staging.weddingos.in` (Vercel) | `www.weddingos.in` (Vercel) |
| API | `api-staging.weddingos.in` (ECS) | `api.weddingos.in` (ECS) |
| Admin | `admin-staging.weddingos.in` (S3/CF) | `admin.weddingos.in` (S3/CF) |
| Vendor | `vendor-staging.weddingos.in` (S3/CF) | `vendor.weddingos.in` (S3/CF) |

---

## 14. Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0
- **Docker** + Docker Compose
- **Flutter** ≥ 3.19 (for mobile app)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/harib8000/wed.git
cd wed

# 2. Copy environment variables
cp .env.example .env

# 3. Generate JWT keys
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# 4. Start infrastructure (Postgres, Redis, Elasticsearch, MongoDB)
docker compose -f docker-compose.infra.yml up -d

# 5. Install dependencies
pnpm install

# 6. Generate Prisma clients
pnpm db:generate

# 7. Run database migrations
pnpm db:migrate

# 8. Start all services + web app
pnpm dev

# 9. (Optional) Start Flutter mobile app
cd apps/mobile
flutter pub get
flutter run
```

### Service URLs (Development)

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3000 |
| **Admin Dashboard** | http://localhost:3001 |
| **Vendor Portal** | http://localhost:3002 |
| **Kong Gateway** | http://localhost:8000 |
| **Auth Service** | http://localhost:4001 |
| **User Service** | http://localhost:4002 |
| **Vendor Service** | http://localhost:4003 |
| **Booking Service** | http://localhost:4004 |
| **Payment Service** | http://localhost:4005 |
| **Execution Service** | http://localhost:4006 |
| **Notification Service** | http://localhost:4008 |
| **Review Service** | http://localhost:4009 |
| **Chat Service** | http://localhost:4010 |
| **Search Service** | http://localhost:4011 |
| **Media Service** | http://localhost:4012 |
| **AI Service** | http://localhost:5000 |
| **Redis Commander** | http://localhost:8081 |
| **Kibana** | http://localhost:5601 |

### Full Stack (Docker)

```bash
# Start everything via Docker Compose
docker compose -f docker-compose.dev.yml up --build

# Tail logs for a specific service
docker compose -f docker-compose.dev.yml logs -f auth-service
```

### Flutter Mobile

```bash
cd apps/mobile
flutter pub get
flutter run -d chrome               # Web preview
flutter run -d emulator-5554        # Android emulator
flutter run -d "iPhone 15"          # iOS simulator
flutter build apk --release         # Android release APK
flutter build ipa --release          # iOS release
flutter test --coverage              # Run tests
```

---

## 15. Environment Variables

All environment variables are documented in `.env.example`:

| Category | Variables | Used By |
|----------|-----------|---------|
| **Database** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL` | All Prisma services |
| **Redis** | `REDIS_URL` | All services |
| **MongoDB** | `MONGODB_URL` | chat-service |
| **Elasticsearch** | `ELASTICSEARCH_URL` | vendor-service, search-service |
| **JWT** | `JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | auth-service, all services (public key) |
| **Razorpay** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | payment-service |
| **AWS S3** | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | media-service, user-service |
| **SMS (MSG91)** | `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`, `MSG91_SENDER_ID` | auth-service, notification-service |
| **Firebase** | `FIREBASE_PROJECT_ID`, `FIREBASE_ADMIN_CREDENTIALS` | notification-service |
| **Email (SendGrid)** | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | notification-service |
| **Google OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | auth-service (optional) |
| **CORS** | `ALLOWED_ORIGINS` | All services |
| **Service Ports** | `AUTH_SERVICE_PORT` through `MEDIA_SERVICE_PORT` | Each respective service |
| **Inter-Service** | `AUTH_SERVICE_URL`, `VENDOR_SERVICE_URL`, etc. | Cross-service HTTP calls |
| **Platform** | `PLATFORM_FEE_PERCENT` (10%), `ESCROW_RELEASE_DAYS_AFTER_EVENT` (7), `MAX_FILE_SIZE_MB` (10) | payment-service, media-service |

---

## 16. Project Status

### ✅ Implemented

- [x] **Monorepo** — Turborepo + pnpm workspaces, shared TypeScript config
- [x] **12 microservice scaffolds** — Express.js, Prisma schemas, Dockerfiles, routes, controllers, services
- [x] **4 shared packages** — shared-types (all interfaces), shared-errors (error hierarchy), shared-events (43 event types, Redis pub/sub), shared-utils (currency, dates, validation, crypto)
- [x] **Web app (Next.js 14)** — 19 pages, 12 components, API client with token refresh, Zustand auth store
- [x] **Flutter mobile app** — 20+ screens (customer + vendor), Riverpod state, GoRouter with RBAC, Dio API client, FCM push notifications
- [x] **Admin dashboard** — React + Ant Design, 5 pages (Dashboard, Vendors, Bookings, Users, Payments)
- [x] **Vendor portal** — React + Tailwind, 5 pages (Dashboard, Bookings, Analytics, Profile, Login)
- [x] **Auth service** — OTP (MSG91), RS256 JWT, refresh tokens, rate limiting, account lockout
- [x] **Booking service** — Full status state machine (ENQUIRY → COMPLETED), event bus integration
- [x] **Payment service** — Razorpay integration, escrow holds, webhook verification, BullMQ auto-release
- [x] **Execution service** — Wedding timeline/tasks, Socket.IO real-time, daily reminders
- [x] **Notification service** — 5 channels (Push/SMS/WhatsApp/Email/In-App), BullMQ workers, event subscriptions
- [x] **Review service** — Multi-dimension ratings, vendor replies, helpful votes
- [x] **Chat service** — MongoDB + Socket.IO real-time messaging
- [x] **Search service** — Elasticsearch full-text vendor search + autocomplete
- [x] **Media service** — S3 presigned uploads, Sharp image processing
- [x] **AI service** — FastAPI, budget planner, vendor recommendations, AI chat assistant
- [x] **CI pipeline** — Lint, type-check, test, build web, Flutter analyze/build (Android + iOS), Docker build
- [x] **CD pipeline** — ECS deploy (services), Vercel (web), S3/CloudFront (portals), Prisma migrations, smoke tests
- [x] **Docker Compose** — Full development stack with all services, databases, Kong gateway, dev tools
- [x] **Database init** — 8 Postgres databases auto-created via init.sql
- [x] **Sprint plans** — 7 sprint planning documents

### 🔄 Integration Pending

- [ ] End-to-end API integration (frontend ↔ backend with real data)
- [ ] Razorpay production credentials and live payment testing
- [ ] Elasticsearch index setup and vendor data seeding
- [ ] Firebase project setup and push notification testing
- [ ] MSG91 production credentials for OTP delivery
- [ ] SendGrid email template configuration
- [ ] S3 bucket creation and CORS configuration
- [x] ~~Kong API gateway route configuration~~ — `infrastructure/kong/kong.yml` exists (DB-less declarative mode, 11 services routed, global rate-limiting + CORS)
- [ ] Terraform infrastructure modules (referenced in CD but not in repo)

### ❌ Not Yet Built

- [x] ~~Unit tests~~ — **343 real unit tests** across all 11 services (Jest + ts-jest). See [Section 17](#17-testing-architecture)
- [ ] Integration tests (cross-service E2E flows — Jest + Supertest)
- [ ] E2E browser tests (Playwright for web, Flutter integration_test)
- [ ] Load testing (k6)
- [ ] Monitoring and alerting (CloudWatch, PagerDuty)
- [ ] Production Terraform infrastructure
- [x] ~~Database seed data~~ — `scripts/seed/init.sql` (8 DBs) + `scripts/seed/seed-data.sql` (7 users, 3 vendors, 5 packages, 3 bookings). See [Section 24](#24-seed-data)
- [ ] API documentation (OpenAPI/Swagger)

- [ ] App Store / Play Store submission

## 17. Testing Architecture

### Test Coverage Summary

All 11 Node.js services have **real unit tests** — zero placeholder tests remain.

| Service | Test File | Cases | Key Scenarios |
|---------|-----------|:-----:|---------------|
| auth-service | `otp.service.test.ts`, `jwt.service.test.ts` | ~18 | OTP send/verify, JWT sign/refresh, rate limiting, account lockout |
| booking-service | `booking.service.test.ts` | ~37 | Full lifecycle (enquiry → complete), cancel rules, fee calc, optimistic lock |
| payment-service | `payment.service.test.ts` | ~26 | Razorpay order/capture, escrow hold/release, refunds, webhook handling |
| review-service | `review.service.test.ts` | ~16 | CRUD, duplicate guard, star aggregation, vendor reply |
| user-service | `profile.service.test.ts` | ~18 | Profile CRUD, KYC submission/review, avatar upload |
| vendor-service | `vendor.service.test.ts` | ~16 | CRUD, ES sync, slug generation, KYC approval/rejection |
| chat-service | `chat.handler.test.ts` | ~66 | Socket.IO auth, join/leave, message send/validation, typing, disconnect |
| execution-service | `timeline.service.test.ts` | ~33 | Timeline CRUD, 12 default templates, date math, system task protection |
| media-service | `upload.service.test.ts` | ~49 | MIME validation, S3 presigned URLs, key format, dev fallback |
| notification-service | `notification.service.test.ts` | ~31 | BullMQ queue, multi-channel send, event routing, unread count |
| search-service | `search.service.test.ts` | ~33 | ES query building, filters, sorting, pagination, aggregations, autocomplete |
| **Total** | **12 test files** | **~343** | — |

### Framework & Configuration

- **Framework**: Jest + ts-jest
- **Config pattern** (`jest.config.js` per service):
  ```js
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
    coverageReporters: ['text', 'lcov'],
  };
  ```

### Mock Strategy

Every test file mocks external dependencies before importing the service under test:

| Dependency | Mock Technique | Used In |
|-----------|---------------|---------|
| Prisma Client | `jest.mock()` with method stubs (findUnique, create, update, etc.) | booking, payment, user, vendor, review, execution, notification |
| Redis / ioredis | `jest.mock('ioredis')` returning fake pub/sub | auth, notification, search |
| Razorpay SDK | `jest.mock('razorpay')` with `orders.create`, `payments.capture` stubs | payment |
| BullMQ | `jest.mock('bullmq')` with Queue/Worker stubs | notification, payment |
| Socket.IO | `jest.mock('socket.io')` with emit/on/join stubs | chat, execution |
| Mongoose | `jest.mock()` with Model.find/save stubs | chat |
| AWS S3 SDK v3 | `jest.mock('@aws-sdk/client-s3')` + `jest.mock('@aws-sdk/s3-request-presigner')` | media |
| Elasticsearch | `jest.mock('@elastic/elasticsearch')` with search/index stubs | search, vendor |
| axios / HTTP | `jest.mock('axios')` | notification (FCM/SMS) |

### Test Pattern

```typescript
// 1. Mock before imports
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }));

// 2. Import service under test
import { BookingService } from '../../src/services/booking.service';

// 3. Test error classes directly
await expect(service.cancel('id', 'user', 'CUSTOMER'))
  .rejects.toBeInstanceOf(NotFoundError);

// 4. Verify side effects
expect(mockPrisma.booking.update).toHaveBeenCalledWith(
  expect.objectContaining({ where: { id: 'id' } })
);
```

### CI Integration

- GitHub Actions CI runs tests with PostgreSQL 16 and Redis 7 service containers
- Each service tested independently: `cd services/{name} && npx jest`
- **Not yet implemented**: integration tests (cross-service), E2E tests (Playwright), load tests (k6)
- **Flutter**: `flutter test --coverage` in CI pipeline

---

## 18. Error Handling Patterns

### Error Class Hierarchy

All 11 services use `@wedding-os/shared-errors` in **both** the errorHandler middleware **and** service business logic. The package exports a base `AppError` class and 22 specific error subclasses across 7 code categories:

```
AppError (base)
├── AUTH_1xxx — Authentication & Authorization
│   ├── OtpInvalidError        (AUTH_1001, 401)
│   ├── OtpExpiredError        (AUTH_1002, 401)
│   ├── RateLimitedError       (AUTH_1003, 429)
│   ├── AccountLockedError     (AUTH_1004, 403)
│   ├── TokenExpiredError      (AUTH_1005, 401)
│   ├── TokenInvalidError      (AUTH_1006, 401)
│   ├── UnauthorizedError      (AUTH_1007, 401)
│   └── ForbiddenError         (AUTH_1008, 403)
├── VAL_2xxx — Validation
│   └── ValidationError        (VAL_2001, 400)  — accepts field name
├── RES_3xxx — Resource
│   ├── NotFoundError          (RES_3001, 404)  — accepts resource type + id
│   └── ConflictError          (RES_3002, 409)
├── BOOK_4xxx — Booking
│   ├── VendorNotAvailableError       (BOOK_4001, 409)
│   ├── BookingAlreadyConfirmedError  (BOOK_4002, 409)
│   └── BookingCancellationError      (BOOK_4003, 400)
├── PAY_5xxx — Payment
│   ├── PaymentVerificationError      (PAY_5001, 400)
│   ├── EscrowNotFoundError           (PAY_5002, 404)
│   ├── InsufficientFundsError        (PAY_5003, 402)
│   └── DuplicatePaymentError         (PAY_5004, 409)
├── VEN_6xxx — Vendor
│   ├── VendorNotVerifiedError        (VEN_6001, 403)
│   └── VendorSubscriptionRequiredError (VEN_6002, 402)
└── SYS_9xxx — System
    ├── InternalError           (SYS_9001, 500)
    └── ServiceUnavailableError (SYS_9002, 503)
```

### Error Handler Middleware

Every service uses the same error handler pattern in `src/middleware/errorHandler.ts`:

```typescript
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    // Structured response from shared-errors
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        field: err.field,       // optional (ValidationError)
        details: err.details,   // optional (additional context)
      },
      meta: {
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Legacy error object fallback: { statusCode, code, message }
  if ('statusCode' in err) { /* ... */ }

  // Unknown error → 500
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: { code: 'SYS_9001', message: 'Internal server error' },
  });
}
```

### Concurrency & Atomicity Patterns

| Service | Pattern | Implementation |
|---------|---------|---------------|
| booking-service | **Optimistic locking** | `version` field incremented on each update. Prisma error `P2025` caught → throws `ConflictError` |
| chat-service | **Atomic upsert** | `findOneAndUpdate()` with `{ upsert: true }` prevents duplicate conversations from concurrent requests |
| media-service | **Path-segment auth** | `key.startsWith(userId + '/')` prevents user123 from accessing user12's files (replaced vulnerable `key.includes(userId)`) |

---

## 19. Code Quality Standards

### Zero-Tolerance Rules (Enforced)

| Rule | Status | Details |
|------|--------|---------|
| `as any` type casts | ✅ Zero across all services + frontends | Replaced with proper interfaces (JwtPayload, EsTotal, Prisma enums) |
| `catch (err: any)` | ✅ Zero | All use `catch (err: unknown)` with `err instanceof Error` narrowing |
| Silent `catch {}` | ✅ Zero | All catch blocks log with `logger.warn({ err }, 'context message')` |
| `console.log` in production | ✅ Zero | All services use Pino logger (`import { logger } from '../config/logger'`) |
| `console.error` | ⚠️ Startup only | Permitted only for config validation at boot (e.g., missing env vars) |
| `throw new Error()` | ✅ Zero | All throw specific `AppError` subclasses from `@wedding-os/shared-errors` |
| Placeholder tests | ✅ Zero | All 11 services have real unit tests (~343 cases total) |

### Route Validation

All 11 services use **Zod schemas** for request validation:

```typescript
// Example: services/review-service/src/middleware/validate.ts
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message, result.error.issues[0].path[0]);
  }
  req.body = result.data;
  next();
};
```

### Linting & Formatting

**Root `.eslintrc.json`:**
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"]
  },
  "ignorePatterns": ["dist/", "node_modules/", "coverage/", "*.js", "*.d.ts"]
}
```

**Root `.prettierrc.json`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true
}
```

---

## 20. Event Bus Deep Dive

### Architecture

The event bus uses **Redis Pub/Sub** via the `@wedding-os/shared-events` package. Each service initializes a singleton bus in `server.ts`:

```typescript
import { createEventBus, getEventBus } from '@wedding-os/shared-events';

// Initialize once at startup
createEventBus({
  serviceName: 'booking-service',
  redisUrl: config.REDIS_URL,
  prefix: 'wos',           // Channel prefix
});

// Publish from anywhere via singleton
const bus = getEventBus();
await bus.publish('booking.confirmed', bookingId, 'Booking', { bookingId, vendorId, amount });

// Subscribe to events
bus.subscribe('payment.captured', async (event) => { /* handle */ });
bus.subscribeMany([
  { type: 'booking.confirmed', handler: handleConfirmed },
  { type: 'booking.completed', handler: handleCompleted },
]);
bus.subscribePattern('vendor.*', async (event) => { /* handle all vendor events */ });
```

### Channel Format

```
{prefix}:events:{domain}.{action}
Example: wos:events:booking.confirmed
```

### Self-Loop Prevention

Every published event includes `metadata.source` (the publishing service name). On receipt, the bus skips events where `metadata.source === serviceName`, preventing a service from reacting to its own events.

### Actively Published Events (12 of 35)

| Domain | Event | Published By |
|--------|-------|-------------|
| auth | `auth.user_registered` | auth-service |
| vendor | `vendor.registered` | vendor-service |
| vendor | `vendor.profile_updated` | vendor-service |
| vendor | `vendor.kyc_approved` | vendor-service |
| vendor | `vendor.kyc_rejected` | vendor-service |
| review | `review.created` | review-service |
| user | `user.profile_updated` | user-service |
| booking | `booking.enquiry_created` | booking-service |
| booking | `booking.confirmed` | booking-service |
| booking | `booking.cancelled` | booking-service |
| payment | `payment.captured` | payment-service |
| escrow | `escrow.released` | payment-service |

### Active Subscriptions (7)

| Event | Subscribed By | Action |
|-------|--------------|--------|
| `booking.confirmed` | payment-service | Create escrow hold |
| `booking.confirmed` | execution-service | Prepare wedding timeline |
| `booking.completed` | execution-service | Finalize timeline |
| `vendor.registered` | search-service | Index in Elasticsearch |
| `vendor.profile_updated` | search-service | Update ES index |
| `vendor.kyc_approved` | search-service | Mark as verified in ES |
| `vendor.kyc_rejected` | search-service, notification-service | Remove from search / notify vendor |

### Services Wired to Event Bus

10 of 11 Node.js services initialize the event bus. `media-service` is excluded (stateless file proxy — no domain events needed).

### Events Defined but Not Yet Published (23)

These are defined in `shared-events` for future implementation:

```
auth.otp_sent, auth.login_success
vendor.kyc_submitted, vendor.subscription_changed
booking.quote_sent, booking.advance_paid, booking.completed, booking.disputed
payment.failed, payment.refunded
escrow.created, escrow.disputed
payout.processed, payout.failed
event.created, event.task_completed, event.vendor_checked_in, event.issue_reported, event.completed
user.kyc_approved, user.kyc_rejected
review.created (already published — but listed in some enum variants)
```

---

## 21. Booking & Payment Lifecycle

### Booking State Machine

```
ENQUIRY
  ├─[vendor sends quote]→ QUOTE_SENT
  │   ├─[customer accepts]→ QUOTE_ACCEPTED
  │   │   └─[system]→ ADVANCE_PENDING
  │   │       └─[payment captured]→ ADVANCE_PAID
  │   │           └─[system]→ CONFIRMED
  │   │               └─[vendor checks in]→ CHECKIN
  │   │                   └─[event completes]→ COMPLETED
  │   └─[customer rejects]→ CANCELLED_BY_CUSTOMER
  └─[customer cancels]→ CANCELLED_BY_CUSTOMER

Any active state → CANCELLED_BY_VENDOR (vendor initiates)
Any active state → DISPUTED (either party)
DISPUTED → REFUNDED (admin resolves)
```

**Cancellable states**: ENQUIRY, QUOTE_SENT, QUOTE_ACCEPTED, ADVANCE_PENDING, CONFIRMED

Every state transition creates an **event audit record** with `actorId`, `actorRole`, and payload — providing a complete audit trail.

### Optimistic Locking

The booking service uses a `version` field that increments on each update. If two concurrent updates target the same version, Prisma throws error `P2025`, which the service catches and converts to `ConflictError` (HTTP 409). This prevents lost updates during simultaneous quote/accept operations.

### Fee Calculation

```
quotedAmount        = vendor's quoted price (in paise)
platformFee         = quotedAmount × 10%
gstOnFee            = platformFee × 18%
advanceAmount       = quotedAmount × 30%        (advance payment required)
vendorPayout        = quotedAmount - platformFee - gstOnFee
```

### Escrow Lifecycle

```
Payment CAPTURED
  └─→ EscrowHold created (status: HELD)
        ├─[eventDate + N days]→ BullMQ delayed job → RELEASED_TO_VENDOR
        ├─[dispute filed]→ DISPUTED
        └─[admin refund]→ REFUNDED_TO_CUSTOMER
```

The `ESCROW_RELEASE_DAYS_AFTER_EVENT` config (default: 7 days) controls when the BullMQ delayed job triggers automatic escrow release to the vendor.

### Payment Service Fee Breakdown

```
amountPaise         = total payment amount (in paise, 1 INR = 100 paise)
platformFeePaise    = amountPaise × PLATFORM_FEE_PERCENT / 100   (default 10%)
gstOnFeePaise       = platformFeePaise × 0.18                     (18% GST)
vendorPayoutPaise   = amountPaise - platformFeePaise - gstOnFeePaise
```

---

## 22. Real-Time Architecture

### Socket.IO Services

Two services expose WebSocket connections via Socket.IO:

| Service | Port | Purpose | Database |
|---------|------|---------|----------|
| execution-service | 4006 | Wedding day timeline, live task updates | PostgreSQL (Prisma) |
| chat-service | 4010 | Real-time vendor–customer messaging | MongoDB (Mongoose) |

Both configure Socket.IO on the same HTTP server with transports `['websocket', 'polling']` and CORS from config.

### Execution Service — Real-Time Timeline

```typescript
// Room pattern
io.on('connection', (socket) => {
  socket.on('join:timeline', ({ customerId }) => {
    socket.join(`timeline:${customerId}`);
  });
});

// Emitted events
io.to(`timeline:${customerId}`).emit('task:created', task);
io.to(`timeline:${customerId}`).emit('task:updated', task);
io.to(`timeline:${customerId}`).emit('task:deleted', { taskId });
```

**Daily Reminder Scheduler**: Custom cron job (no external dependency) runs at **08:00 IST (02:30 UTC)** daily, querying for tasks due within 3 days and emitting reminder notifications.

### Chat Service — Real-Time Messaging

```typescript
// JWT auth in handshake
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT → attach user to socket
});

// Room pattern: conversations by bookingId
socket.on('join:conversation', ({ conversationId }) => {
  socket.join(conversationId);
});

// Message events
socket.on('message:send', (data) => {
  // Persist to MongoDB → emit to room
  io.to(conversationId).emit('message:new', savedMessage);
});

socket.on('typing:start', ({ conversationId }) => {
  socket.to(conversationId).emit('typing:start', { userId });
});
```

### Client Connection Pattern

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4010', {
  auth: { token: jwtToken },
  transports: ['websocket', 'polling'],
});
```

### Redis Adapter (Horizontal Scaling)

Both services support Redis adapter for multi-instance deployments, enabling Socket.IO event broadcasting across multiple server instances.

---

## 23. File Upload — S3 Presigned URLs

### Upload Flow

```
Client                          Server                          S3/MinIO
  │                               │                               │
  │ POST /media/presign           │                               │
  │  { mediaType, mimeType }      │                               │
  │──────────────────────────────>│                               │
  │                               │ Generate S3 key:              │
  │                               │ {type}/{userId}/{uuid}.{ext}  │
  │                               │ getSignedUrl(PutObject, 300s) │
  │                               │──────────────────────────────>│
  │      { uploadUrl, key,        │                               │
  │        publicUrl }            │                               │
  │<──────────────────────────────│                               │
  │                               │                               │
  │ PUT uploadUrl                 │                               │
  │  [file binary]                │                               │
  │──────────────────────────────────────────────────────────────>│
  │                               │                               │
  │ POST /media/confirm           │                               │
  │  { key }                      │                               │
  │──────────────────────────────>│   (verify key exists)         │
```

### Media Types

| Type | Used By | Allowed MIME Types |
|------|---------|-------------------|
| `avatar` | user-service | image/jpeg, image/png, image/webp |
| `portfolio` | vendor-service | image/jpeg, image/png, image/webp |
| `kyc` | user-service | image/jpeg, image/png, application/pdf |
| `review` | review-service | image/jpeg, image/png, image/webp |
| `vendor_cover` | vendor-service | image/jpeg, image/png, image/webp |
| `chat` | chat-service | image/jpeg, image/png, image/webp |

### Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Upload URL expiry | 300 seconds (5 min) | Time client has to upload |
| Download URL expiry | 3600 seconds (1 hour) | For private media access |
| Max file size | 10 MB | Configurable via env |
| S3 key format | `{mediaType}/{userId}/{uuid}.{ext}` | Prevents collisions |
| Dev replacement | MinIO | Drop-in S3-compatible storage |
| CDN endpoint | Configurable | Set `CDN_ENDPOINT` env var for production |
| AWS SDK | v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) | — |

---

## 24. Seed Data

### Database Initialization

**`scripts/seed/init.sql`** — Creates all 8 PostgreSQL databases:

```sql
CREATE DATABASE weddingos_auth;
CREATE DATABASE weddingos_users;
CREATE DATABASE weddingos_vendors;
CREATE DATABASE weddingos_bookings;
CREATE DATABASE weddingos_payments;
CREATE DATABASE weddingos_execution;
CREATE DATABASE weddingos_notifications;
CREATE DATABASE weddingos_reviews;
```

This script is mounted into the PostgreSQL container via `docker-compose.infra.yml` and runs automatically on first startup.

### Sample Data

**`scripts/seed/seed-data.sql`** — Populates development data:

| Database | Table | Records | Details |
|----------|-------|:-------:|---------|
| weddingos_auth | users | 7 | 3 customers, 3 vendors, 1 admin; phone-based auth |
| weddingos_users | profiles | 3 | Priya Sharma (Mumbai), Rahul Patel (Bangalore), Ananya Reddy (Hyderabad) |
| weddingos_vendors | vendors | 3 | Photography, Catering, Decoration — all ACTIVE + verified |
| weddingos_vendors | packages | 5 | Photography: ₹50,000–₹120,000; Catering: ₹80,000–₹150,000; Decor: ₹30,000 |
| weddingos_bookings | bookings | 3 | Statuses: CONFIRMED, ADVANCE_PENDING, ENQUIRY |
| weddingos_payments | escrow_holds | 1 | Status: CAPTURED |
| weddingos_reviews | reviews | 1 | 5-star rating from customer |

### Loading Seed Data

```bash
# 1. Start infrastructure
docker compose -f docker-compose.infra.yml up -d

# 2. Wait for PostgreSQL to be ready
docker compose -f docker-compose.infra.yml exec postgres pg_isready

# 3. Create databases (runs automatically on first start via init.sql mount)
# Manual: docker compose exec postgres psql -U postgres -f /docker-entrypoint-initdb.d/init.sql

# 4. Load sample data
docker compose -f docker-compose.infra.yml exec -T postgres \
  psql -U postgres < scripts/seed/seed-data.sql
```

---

## 25. Rebuild from Scratch Guide

Complete step-by-step instructions to set up the entire WeddingOS platform from a fresh clone.

### Step 1: Prerequisites

```bash
# Required
node --version    # v20 LTS
pnpm --version    # v9+
docker --version  # Docker 24+
docker compose version  # v2.20+

# Optional (for mobile)
flutter --version # 3.19+
dart --version    # 3.3+

# Optional (for AI service)
python3 --version # 3.12+
```

### Step 2: Clone & Install Dependencies

```bash
git clone https://github.com/harib8000/wed.git
cd wed
pnpm install          # Installs all workspace dependencies
```

### Step 3: Environment Setup

```bash
# Copy environment templates for each service
for svc in auth user vendor booking payment execution notification review chat search media; do
  cp services/${svc}-service/.env.example services/${svc}-service/.env 2>/dev/null || true
done

# Copy frontend env files
cp apps/web/.env.example apps/web/.env.local 2>/dev/null || true
cp apps/admin/.env.example apps/admin/.env 2>/dev/null || true
cp apps/vendor-web/.env.example apps/vendor-web/.env 2>/dev/null || true
```

### Step 4: Generate RS256 JWT Keys

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Copy to each service that needs JWT verification
for svc in auth user vendor booking payment execution notification review chat search media; do
  mkdir -p services/${svc}-service/keys
  cp keys/private.pem services/${svc}-service/keys/
  cp keys/public.pem services/${svc}-service/keys/
done
```

### Step 5: Start Infrastructure

```bash
# Start PostgreSQL 16, Redis 7, Elasticsearch 8, MongoDB 7
docker compose -f docker-compose.infra.yml up -d

# Verify all containers are healthy
docker compose -f docker-compose.infra.yml ps
```

### Step 6: Initialize Databases

```bash
# init.sql creates 8 databases — runs automatically on first PostgreSQL start
# If needed manually:
docker compose -f docker-compose.infra.yml exec postgres \
  psql -U postgres -f /docker-entrypoint-initdb.d/init.sql
```

### Step 7: Generate Prisma Clients

```bash
# Services with Prisma schemas:
for svc in auth user vendor booking payment execution notification review; do
  echo "Generating Prisma client for ${svc}-service..."
  cd services/${svc}-service && npx prisma generate && cd ../..
done
```

### Step 8: Run Database Migrations

```bash
for svc in auth user vendor booking payment execution notification review; do
  echo "Migrating ${svc}-service..."
  cd services/${svc}-service && npx prisma migrate dev --name init && cd ../..
done
```

### Step 9: Load Seed Data

```bash
docker compose -f docker-compose.infra.yml exec -T postgres \
  psql -U postgres < scripts/seed/seed-data.sql
```

### Step 10: Start Backend Services

Start services in dependency order:

```bash
# 1. Auth service (no dependencies)
cd services/auth-service && pnpm dev &

# 2. User + Vendor services (depend on auth for JWT)
cd services/user-service && pnpm dev &
cd services/vendor-service && pnpm dev &

# 3. Core business services
cd services/booking-service && pnpm dev &
cd services/payment-service && pnpm dev &
cd services/execution-service && pnpm dev &

# 4. Supporting services
cd services/notification-service && pnpm dev &
cd services/review-service && pnpm dev &
cd services/chat-service && pnpm dev &
cd services/search-service && pnpm dev &
cd services/media-service && pnpm dev &

# 5. AI service (Python)
cd services/ai-service && pip install -r requirements.txt && uvicorn main:app --port 5000 &
```

### Step 11: Start Frontend Apps

```bash
# Customer web app (Next.js) — http://localhost:3000
cd apps/web && pnpm dev &

# Admin dashboard (React + Vite) — http://localhost:3001
cd apps/admin && pnpm dev &

# Vendor portal (React + Vite) — http://localhost:3002
cd apps/vendor-web && pnpm dev &

# Mobile (Flutter) — requires emulator or device
cd apps/mobile && flutter pub get && flutter run
```

### Step 12: Kong Gateway Setup (Optional)

```bash
# Kong config exists at infrastructure/kong/kong.yml
# Start Kong in DB-less declarative mode:
docker run -d --name kong \
  -e "KONG_DATABASE=off" \
  -e "KONG_DECLARATIVE_CONFIG=/kong/kong.yml" \
  -v $(pwd)/infrastructure/kong:/kong \
  -p 8000:8000 -p 8443:8443 \
  kong:3.6
```

### Step 13: Verification Checklist

| Service | Port | Health Endpoint | Verify |
|---------|:----:|-----------------|--------|
| auth-service | 4001 | `GET /auth/health` | `curl http://localhost:4001/auth/health` |
| user-service | 4002 | `GET /users/health` | `curl http://localhost:4002/users/health` |
| vendor-service | 4003 | `GET /vendors/health` | `curl http://localhost:4003/vendors/health` |
| booking-service | 4004 | `GET /bookings/health` | `curl http://localhost:4004/bookings/health` |
| payment-service | 4005 | `GET /payments/health` | `curl http://localhost:4005/payments/health` |
| execution-service | 4006 | `GET /execution/health` | `curl http://localhost:4006/execution/health` |
| notification-service | 4008 | `GET /notifications/health` | `curl http://localhost:4008/notifications/health` |
| review-service | 4009 | `GET /reviews/health` | `curl http://localhost:4009/reviews/health` |
| chat-service | 4010 | `GET /chat/health` | `curl http://localhost:4010/chat/health` |
| search-service | 4011 | `GET /search/health` | `curl http://localhost:4011/search/health` |
| media-service | 4012 | `GET /media/health` | `curl http://localhost:4012/media/health` |
| ai-service | 5000 | `GET /health` | `curl http://localhost:5000/health` |
| Web App | 3000 | — | Open `http://localhost:3000` |
| Admin | 3001 | — | Open `http://localhost:3001` |
| Vendor Portal | 3002 | — | Open `http://localhost:3002` |

### Common Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED :5432` | PostgreSQL not running | `docker compose -f docker-compose.infra.yml up -d postgres` |
| `ECONNREFUSED :6379` | Redis not running | `docker compose -f docker-compose.infra.yml up -d redis` |
| Prisma "database does not exist" | init.sql didn't run | Run `psql -U postgres -f scripts/seed/init.sql` manually |
| `Cannot find module '@prisma/client'` | Prisma not generated | `cd services/{name} && npx prisma generate` |
| JWT verification fails | Missing key files | Copy `keys/public.pem` to `services/{name}/keys/` |
| Elasticsearch connection refused | ES not started or still initializing | Wait 30s, check `curl localhost:9200/_cluster/health` |
| MongoDB auth failed | Wrong credentials in `.env` | Match `MONGO_*` env vars with docker-compose settings |
| Port already in use | Another service on same port | Check with `lsof -i :{port}` and kill conflicting process |
| `pnpm install` fails | Wrong Node version | Use Node 20 LTS: `nvm use 20` |
| Flutter build fails | Missing Android SDK / Xcode | Run `flutter doctor` and resolve listed issues |

---

## 26. Complete Database Schema Reference

Every field, type, constraint, relation, and index — the full specification needed to recreate all database schemas from scratch.

### 26.1 Auth Service — PostgreSQL (`weddingos_auth`)

**Enums:**

```sql
-- UserRole
CREATE TYPE "UserRole" AS ENUM ('customer', 'vendor', 'coordinator', 'admin', 'super_admin');

-- UserStatus
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deleted');
```

**Table: `users`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `phone` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `email` | `VARCHAR` | UNIQUE | `NULL` |
| `emailVerified` | `BOOLEAN` | NOT NULL | `false` |
| `phoneVerified` | `BOOLEAN` | NOT NULL | `false` |
| `passwordHash` | `VARCHAR` | | `NULL` |
| `role` | `UserRole` | NOT NULL | `customer` |
| `status` | `UserStatus` | NOT NULL | `active` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |
| `deletedAt` | `TIMESTAMP` | | `NULL` |

Indexes: `(phone)`, `(email)`, `(status)`

**Table: `refresh_tokens`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `userId` | `UUID` | FK → users.id (CASCADE) | — |
| `tokenHash` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `deviceId` | `VARCHAR` | | `NULL` |
| `expiresAt` | `TIMESTAMP` | NOT NULL | — |
| `revokedAt` | `TIMESTAMP` | | `NULL` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |

Indexes: `(userId)`, `(expiresAt)`

---

### 26.2 User Service — PostgreSQL (`weddingos_users`)

**Enums:**

```sql
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "DocumentType" AS ENUM ('AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'GSTIN', 'BANK_STATEMENT');
```

**Table: `user_profiles`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `userId` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `firstName` | `VARCHAR` | | `NULL` |
| `lastName` | `VARCHAR` | | `NULL` |
| `avatar` | `VARCHAR` | | `NULL` |
| `email` | `VARCHAR` | UNIQUE | `NULL` |
| `dateOfBirth` | `TIMESTAMP` | | `NULL` |
| `city` | `VARCHAR` | | `NULL` |
| `state` | `VARCHAR` | | `NULL` |
| `pincode` | `VARCHAR` | | `NULL` |
| `partnerName` | `VARCHAR` | | `NULL` |
| `weddingDate` | `TIMESTAMP` | | `NULL` |
| `estimatedBudgetPaise` | `INT` | | `NULL` |
| `guestCount` | `INT` | | `NULL` |
| `venueCity` | `VARCHAR` | | `NULL` |
| `businessName` | `VARCHAR` | | `NULL` |
| `businessCity` | `VARCHAR` | | `NULL` |
| `whatsappNotif` | `BOOLEAN` | | `true` |
| `emailNotif` | `BOOLEAN` | | `true` |
| `pushNotif` | `BOOLEAN` | | `true` |
| `smsNotif` | `BOOLEAN` | | `true` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

**Table: `push_tokens`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `profileId` | `UUID` | FK → user_profiles.id (CASCADE) | — |
| `token` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `platform` | `VARCHAR` | NOT NULL | — |
| `deviceId` | `VARCHAR` | | `NULL` |
| `active` | `BOOLEAN` | | `true` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |

Indexes: `(profileId)`

**Table: `kyc_documents`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `profileId` | `UUID` | FK → user_profiles.id (CASCADE) | — |
| `docType` | `DocumentType` | NOT NULL | — |
| `s3Key` | `VARCHAR` | NOT NULL | — |
| `status` | `KycStatus` | NOT NULL | `PENDING` |
| `reviewNote` | `VARCHAR` | | `NULL` |
| `reviewedAt` | `TIMESTAMP` | | `NULL` |
| `reviewedBy` | `VARCHAR` | | `NULL` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(profileId)`, `(status)`

---

### 26.3 Vendor Service — PostgreSQL (`weddingos_vendors`)

**Enums:**

```sql
CREATE TYPE "VendorStatus" AS ENUM (
  'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED'
);

CREATE TYPE "VendorCategory" AS ENUM (
  'PHOTOGRAPHER', 'VIDEOGRAPHER', 'CATERER', 'DECORATOR', 'VENUE',
  'DJ_SOUND', 'BAND_ENTERTAINMENT', 'BRIDAL_MAKEUP', 'GROOM_MAKEUP',
  'MEHENDI', 'PANDIT_PRIEST', 'WEDDING_PLANNER', 'INVITATIONS',
  'CHOREOGRAPHER', 'BARTENDER', 'LIGHTING', 'FIREWORKS',
  'TENT_HOUSE', 'TRANSPORTATION', 'FLORIST'
);

CREATE TYPE "PackageType" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'CUSTOM');
```

**Table: `vendors`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `userId` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `businessName` | `VARCHAR` | NOT NULL | — |
| `slug` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `category` | `VendorCategory` | NOT NULL | — |
| `subCategories` | `VendorCategory[]` | | `[]` |
| `status` | `VendorStatus` | NOT NULL | `DRAFT` |
| `city` | `VARCHAR` | NOT NULL | — |
| `state` | `VARCHAR` | NOT NULL | — |
| `pincode` | `VARCHAR` | NOT NULL | — |
| `serviceCities` | `VARCHAR[]` | | `[]` |
| `tagline` | `VARCHAR` | | `NULL` |
| `description` | `TEXT` | | `NULL` |
| `yearsExperience` | `INT` | | `NULL` |
| `teamSize` | `INT` | | `NULL` |
| `coverPhoto` | `VARCHAR` | | `NULL` |
| `logoUrl` | `VARCHAR` | | `NULL` |
| `whatsappNumber` | `VARCHAR` | | `NULL` |
| `websiteUrl` | `VARCHAR` | | `NULL` |
| `instagramUrl` | `VARCHAR` | | `NULL` |
| `gstNumber` | `VARCHAR` | | `NULL` |
| `panNumber` | `VARCHAR` | | `NULL` |
| `bankAccountNo` | `VARCHAR` | | `NULL` |
| `bankIfsc` | `VARCHAR` | | `NULL` |
| `bankAccountName` | `VARCHAR` | | `NULL` |
| `avgRating` | `FLOAT` | | `0` |
| `reviewCount` | `INT` | | `0` |
| `bookingCount` | `INT` | | `0` |
| `responseRatePercent` | `INT` | | `0` |
| `avgResponseHours` | `FLOAT` | | `0` |
| `plusMember` | `BOOLEAN` | | `false` |
| `isFeatured` | `BOOLEAN` | | `false` |
| `adminNote` | `VARCHAR` | | `NULL` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(category, city, status)`, `(slug)`, `(avgRating)`

**Table: `vendor_packages`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `vendorId` | `UUID` | FK → vendors.id (CASCADE) | — |
| `packageType` | `PackageType` | NOT NULL | `BASIC` |
| `name` | `VARCHAR` | NOT NULL | — |
| `description` | `TEXT` | | `NULL` |
| `priceFromPaise` | `INT` | NOT NULL | — |
| `priceUpToPaise` | `INT` | | `NULL` |
| `isCustomQuote` | `BOOLEAN` | | `false` |
| `inclusions` | `VARCHAR[]` | | `[]` |
| `exclusions` | `VARCHAR[]` | | `[]` |
| `deliverables` | `VARCHAR[]` | | `[]` |
| `isActive` | `BOOLEAN` | | `true` |
| `sortOrder` | `INT` | | `0` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(vendorId, isActive)`

**Table: `portfolio_items`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `vendorId` | `UUID` | FK → vendors.id (CASCADE) | — |
| `s3Key` | `VARCHAR` | NOT NULL | — |
| `publicUrl` | `VARCHAR` | NOT NULL | — |
| `thumbUrl` | `VARCHAR` | | `NULL` |
| `caption` | `VARCHAR` | | `NULL` |
| `mediaType` | `VARCHAR` | | `"image"` |
| `sortOrder` | `INT` | | `0` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |

Indexes: `(vendorId)`

**Table: `availability_blocks`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `vendorId` | `UUID` | FK → vendors.id (CASCADE) | — |
| `blockedDate` | `TIMESTAMP` | NOT NULL | — |
| `reason` | `VARCHAR` | | `NULL` |

Unique: `(vendorId, blockedDate)` · Indexes: `(vendorId, blockedDate)`

**Table: `vendor_tags`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `vendorId` | `UUID` | FK → vendors.id (CASCADE) | — |
| `tag` | `VARCHAR` | NOT NULL | — |

Unique: `(vendorId, tag)` · Indexes: `(tag)`

---

### 26.4 Booking Service — PostgreSQL (`weddingos_bookings`)

**Enums:**

```sql
CREATE TYPE "BookingStatus" AS ENUM (
  'ENQUIRY', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'ADVANCE_PENDING',
  'ADVANCE_PAID', 'CONFIRMED', 'CHECKIN', 'COMPLETED',
  'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_VENDOR', 'DISPUTED', 'REFUNDED'
);

CREATE TYPE "EventType" AS ENUM (
  'WEDDING_CEREMONY', 'RECEPTION', 'ENGAGEMENT', 'HALDI', 'MEHNDI',
  'SANGEET', 'BACHELOR_PARTY', 'PRE_WEDDING_SHOOT', 'BIRTHDAY',
  'ANNIVERSARY', 'CORPORATE', 'OTHER'
);
```

**Table: `bookings`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `bookingNumber` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `customerId` | `VARCHAR` | NOT NULL | — |
| `vendorId` | `VARCHAR` | NOT NULL | — |
| `packageId` | `VARCHAR` | | `NULL` |
| `status` | `BookingStatus` | NOT NULL | `ENQUIRY` |
| `eventDate` | `TIMESTAMP` | NOT NULL | — |
| `eventType` | `EventType` | NOT NULL | — |
| `eventCity` | `VARCHAR` | NOT NULL | — |
| `quotedAmountPaise` | `INT` | | `NULL` |
| `advanceAmountPaise` | `INT` | | `NULL` |
| `finalAmountPaise` | `INT` | | `NULL` |
| `platformFeePaise` | `INT` | | `NULL` |
| `gstOnFeePaise` | `INT` | | `NULL` |
| `requirements` | `TEXT` | | `NULL` |
| `guestCount` | `INT` | | `NULL` |
| `specialNotes` | `TEXT` | | `NULL` |
| `vendorQuoteNote` | `TEXT` | | `NULL` |
| `cancellationReason` | `TEXT` | | `NULL` |
| `quoteSentAt` | `TIMESTAMP` | | `NULL` |
| `quoteAcceptedAt` | `TIMESTAMP` | | `NULL` |
| `confirmedAt` | `TIMESTAMP` | | `NULL` |
| `completedAt` | `TIMESTAMP` | | `NULL` |
| `cancelledAt` | `TIMESTAMP` | | `NULL` |
| `version` | `INT` | NOT NULL | `0` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(customerId, status)`, `(vendorId, status)`, `(eventDate)`, `(bookingNumber)`

> **Optimistic Locking:** The `version` field is used for concurrent update protection. Updates use `WHERE id = ? AND version = ?` — if another process updated first, Prisma throws P2025, caught as `ConflictError`.

**Table: `booking_events`** (audit trail)

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `bookingId` | `UUID` | FK → bookings.id (CASCADE) | — |
| `eventType` | `VARCHAR` | NOT NULL | — |
| `actorId` | `VARCHAR` | NOT NULL | — |
| `actorRole` | `VARCHAR` | NOT NULL | — |
| `payload` | `JSON` | | `{}` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |

Indexes: `(bookingId)`

---

### 26.5 Payment Service — PostgreSQL (`weddingos_payments`)

**Enums:**

```sql
CREATE TYPE "PaymentStatus" AS ENUM (
  'CREATED', 'PENDING', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'
);
CREATE TYPE "EscrowStatus" AS ENUM (
  'HELD', 'RELEASED_TO_VENDOR', 'REFUNDED_TO_CUSTOMER', 'DISPUTED'
);
CREATE TYPE "RefundReason" AS ENUM ('CANCELLATION', 'DISPUTE_RESOLVED_CUSTOMER', 'OTHER');
```

**Table: `payments`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `bookingId` | `VARCHAR` | NOT NULL | — |
| `customerId` | `VARCHAR` | NOT NULL | — |
| `vendorId` | `VARCHAR` | NOT NULL | — |
| `razorpayOrderId` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `razorpayPaymentId` | `VARCHAR` | UNIQUE | `NULL` |
| `razorpaySignature` | `VARCHAR` | | `NULL` |
| `amountPaise` | `INT` | NOT NULL | — |
| `currency` | `VARCHAR` | NOT NULL | `"INR"` |
| `status` | `PaymentStatus` | NOT NULL | `CREATED` |
| `description` | `VARCHAR` | | `NULL` |
| `idempotencyKey` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `webhookVerified` | `BOOLEAN` | | `false` |
| `webhookReceivedAt` | `TIMESTAMP` | | `NULL` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(bookingId)`, `(customerId)`, `(status)`

**Table: `escrow_holds`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `paymentId` | `UUID` | UNIQUE, FK → payments.id | — |
| `bookingId` | `VARCHAR` | NOT NULL | — |
| `vendorId` | `VARCHAR` | NOT NULL | — |
| `heldAmountPaise` | `INT` | NOT NULL | — |
| `platformFeePaise` | `INT` | NOT NULL | — |
| `gstOnFeePaise` | `INT` | NOT NULL | — |
| `vendorPayoutPaise` | `INT` | NOT NULL | — |
| `status` | `EscrowStatus` | NOT NULL | `HELD` |
| `releaseScheduledAt` | `TIMESTAMP` | | `NULL` |
| `releasedAt` | `TIMESTAMP` | | `NULL` |
| `razorpayPayoutId` | `VARCHAR` | | `NULL` |
| `adminNote` | `VARCHAR` | | `NULL` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(vendorId, status)`, `(releaseScheduledAt)`

**Table: `refunds`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `paymentId` | `VARCHAR` | NOT NULL | — |
| `bookingId` | `VARCHAR` | NOT NULL | — |
| `razorpayRefundId` | `VARCHAR` | UNIQUE | `NULL` |
| `amountPaise` | `INT` | NOT NULL | — |
| `reason` | `RefundReason` | NOT NULL | `OTHER` |
| `note` | `VARCHAR` | | `NULL` |
| `status` | `VARCHAR` | NOT NULL | `"PENDING"` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |

Indexes: `(paymentId)`

---

### 26.6 Execution Service — PostgreSQL (`weddingos_execution`)

**Enums:**

```sql
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED');
CREATE TYPE "TaskCategory" AS ENUM (
  'VENDOR_BOOKING', 'VENUE', 'CATERING', 'DECORATION', 'CEREMONY',
  'GUEST_MANAGEMENT', 'PHOTOGRAPHY', 'ENTERTAINMENT', 'LOGISTICS', 'LEGAL', 'OTHER'
);
```

**Table: `wedding_timelines`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `customerId` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `weddingDate` | `TIMESTAMP` | NOT NULL | — |
| `title` | `VARCHAR` | NOT NULL | `"My Wedding"` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

**Table: `timeline_tasks`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `timelineId` | `UUID` | FK → wedding_timelines.id (CASCADE) | — |
| `title` | `VARCHAR` | NOT NULL | — |
| `description` | `TEXT` | | `NULL` |
| `category` | `TaskCategory` | NOT NULL | `OTHER` |
| `status` | `TaskStatus` | NOT NULL | `PENDING` |
| `dueDate` | `TIMESTAMP` | | `NULL` |
| `dueDaysBeforeWedding` | `INT` | | `NULL` |
| `linkedBookingId` | `VARCHAR` | | `NULL` |
| `assignedVendorId` | `VARCHAR` | | `NULL` |
| `completedAt` | `TIMESTAMP` | | `NULL` |
| `sortOrder` | `INT` | | `0` |
| `isSystemGenerated` | `BOOLEAN` | | `false` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(timelineId, status)`, `(dueDate)`

**Table: `task_templates`** (seed data)

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `title` | `VARCHAR` | NOT NULL | — |
| `description` | `TEXT` | | `NULL` |
| `category` | `TaskCategory` | NOT NULL | `OTHER` |
| `dueDaysBeforeWedding` | `INT` | NOT NULL | — |
| `sortOrder` | `INT` | | `0` |
| `isActive` | `BOOLEAN` | | `true` |

---

### 26.7 Notification Service — PostgreSQL (`weddingos_notifications`)

**Enums:**

```sql
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'WHATSAPP', 'EMAIL', 'IN_APP');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');
```

**Table: `notification_logs`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `userId` | `VARCHAR` | NOT NULL | — |
| `channel` | `NotificationChannel` | NOT NULL | — |
| `event` | `VARCHAR` | NOT NULL | — |
| `title` | `VARCHAR` | | `NULL` |
| `body` | `TEXT` | NOT NULL | — |
| `data` | `JSON` | | `{}` |
| `status` | `NotificationStatus` | NOT NULL | `QUEUED` |
| `providerRef` | `VARCHAR` | | `NULL` |
| `errorMsg` | `TEXT` | | `NULL` |
| `sentAt` | `TIMESTAMP` | | `NULL` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |

Indexes: `(userId, createdAt)`, `(event)`, `(status)`

---

### 26.8 Review Service — PostgreSQL (`weddingos_reviews`)

**Table: `reviews`**

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `id` | `UUID` | PRIMARY KEY | `uuid()` |
| `bookingId` | `VARCHAR` | UNIQUE, NOT NULL | — |
| `customerId` | `VARCHAR` | NOT NULL | — |
| `vendorId` | `VARCHAR` | NOT NULL | — |
| `rating` | `INT` | NOT NULL (1-5) | — |
| `title` | `VARCHAR` | | `NULL` |
| `body` | `TEXT` | NOT NULL | — |
| `qualityRating` | `INT` | | `NULL` |
| `valueRating` | `INT` | | `NULL` |
| `professionalismRating` | `INT` | | `NULL` |
| `punctualityRating` | `INT` | | `NULL` |
| `photos` | `VARCHAR[]` | | `[]` |
| `isPublished` | `BOOLEAN` | | `false` |
| `adminNote` | `TEXT` | | `NULL` |
| `vendorReply` | `TEXT` | | `NULL` |
| `vendorRepliedAt` | `TIMESTAMP` | | `NULL` |
| `helpfulCount` | `INT` | | `0` |
| `createdAt` | `TIMESTAMP` | NOT NULL | `now()` |
| `updatedAt` | `TIMESTAMP` | NOT NULL | auto |

Indexes: `(vendorId, isPublished)`, `(customerId)`

---

### 26.9 Chat Service — MongoDB (`weddingos_chat`)

**Collection: `conversations`**

```javascript
{
  bookingId:      String,     // required, unique index
  customerId:     String,     // required
  vendorId:       String,     // required
  lastMessage:    String,     // preview text
  lastMessageAt:  Date,
  customerUnread: Number,     // default: 0
  vendorUnread:   Number,     // default: 0
  isActive:       Boolean,    // default: true
  createdAt:      Date,       // auto
  updatedAt:      Date        // auto
}
// Indexes: (customerId), (vendorId)
```

**Collection: `messages`**

```javascript
{
  conversationId: String,     // required, indexed
  senderId:       String,     // required
  senderRole:     String,     // enum: ['customer', 'vendor', 'admin']
  content:        String,     // required, maxlength: 2000
  contentType:    String,     // enum: ['text', 'image', 'document'], default: 'text'
  mediaUrl:       String,     // optional (S3 URL)
  readBy:         [{          // array
    userId: String,
    readAt: Date
  }],
  isDeleted:      Boolean,    // default: false (soft delete)
  createdAt:      Date,       // auto
  updatedAt:      Date        // auto
}
// Compound Index: (conversationId, createdAt DESC)
```

---

### 26.10 Schema Summary

| Database | Service | Models | Enums | Relations | Financial Fields |
|----------|---------|--------|-------|-----------|-----------------|
| weddingos_auth | auth | 2 | 2 | 1 FK | — |
| weddingos_users | user | 3 | 2 | 2 FK | estimatedBudgetPaise |
| weddingos_vendors | vendor | 5 | 3 | 4 FK | priceFromPaise, priceUpToPaise |
| weddingos_bookings | booking | 2 | 2 | 1 FK | quotedAmountPaise, advanceAmountPaise, finalAmountPaise, platformFeePaise, gstOnFeePaise |
| weddingos_payments | payment | 3 | 3 | 1 FK | amountPaise, heldAmountPaise, platformFeePaise, gstOnFeePaise, vendorPayoutPaise |
| weddingos_execution | execution | 3 | 2 | 1 FK | — |
| weddingos_notifications | notification | 1 | 2 | 0 FK | — |
| weddingos_reviews | review | 1 | 0 | 0 FK | — |
| weddingos_chat (Mongo) | chat | 2 | — | — | — |

> **Currency Convention:** All monetary values are stored in **paise** (1 INR = 100 paise) for precision. Display conversion: `paiseToRupees(paise)` from `@wedding-os/shared-utils`.

---

## 27. Shared Package API Reference

Complete function signatures, class definitions, and type exports for all shared packages.

### 27.1 @wedding-os/shared-errors — Error Class Hierarchy

```typescript
// ═══════════════════════════════════════════════════════════════
// BASE ERROR CLASS
// ═══════════════════════════════════════════════════════════════

class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly field?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    field?: string,
    details?: Record<string, unknown>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH ERRORS (AUTH_1xxx)
// ═══════════════════════════════════════════════════════════════

class OtpInvalidError extends AppError;
  // Code: AUTH_1001  |  Status: 400  |  Field: "otp"
  // Message: "Invalid OTP. Please try again."

class OtpExpiredError extends AppError;
  // Code: AUTH_1002  |  Status: 400  |  Field: "otp"
  // Message: "OTP has expired. Please request a new one."

class RateLimitedError extends AppError;
  // Code: AUTH_1003  |  Status: 429
  // constructor(retryAfterSeconds?: number)
  // Message: "Too many requests. Try again in {retryAfterSeconds} seconds."

class AccountLockedError extends AppError;
  // Code: AUTH_1004  |  Status: 423
  // constructor(unlockMinutes: number = 30)
  // Message: "Account locked due to too many failed attempts. Try again in {unlockMinutes} minutes."

class TokenExpiredError extends AppError;
  // Code: AUTH_1005  |  Status: 401
  // Message: "Token has expired. Please login again."

class TokenInvalidError extends AppError;
  // Code: AUTH_1006  |  Status: 401
  // Message: "Invalid token."

class UnauthorizedError extends AppError;
  // Code: AUTH_1007  |  Status: 401
  // constructor(message: string = "Authentication required.")

class ForbiddenError extends AppError;
  // Code: AUTH_1008  |  Status: 403
  // constructor(message?: string)
  // Default: "You do not have permission to perform this action."

// ═══════════════════════════════════════════════════════════════
// VALIDATION ERRORS (VAL_2xxx)
// ═══════════════════════════════════════════════════════════════

class ValidationError extends AppError;
  // Code: VAL_2001  |  Status: 400
  // constructor(message: string, field?: string, details?: Record<string, unknown>)

// ═══════════════════════════════════════════════════════════════
// RESOURCE ERRORS (RES_3xxx)
// ═══════════════════════════════════════════════════════════════

class NotFoundError extends AppError;
  // Code: RES_3001  |  Status: 404
  // constructor(resource: string, id?: string)
  // Message: "{resource} with id '{id}' not found." OR "{resource} not found."

class ConflictError extends AppError;
  // Code: RES_3002  |  Status: 409
  // constructor(message: string, field?: string)

// ═══════════════════════════════════════════════════════════════
// BOOKING ERRORS (BOOK_4xxx)
// ═══════════════════════════════════════════════════════════════

class VendorNotAvailableError extends AppError;
  // Code: BOOK_4001  |  Status: 409  |  Field: "eventDate"
  // constructor(date: string)

class BookingAlreadyConfirmedError extends AppError;
  // Code: BOOK_4002  |  Status: 409
  // Message: "This booking has already been confirmed."

class BookingCancellationError extends AppError;
  // Code: BOOK_4003  |  Status: 400
  // constructor(reason: string)

// ═══════════════════════════════════════════════════════════════
// PAYMENT ERRORS (PAY_5xxx)
// ═══════════════════════════════════════════════════════════════

class PaymentVerificationError extends AppError;
  // Code: PAY_5001  |  Status: 400
  // Message: "Payment signature verification failed."

class EscrowNotFoundError extends AppError;
  // Code: PAY_5002  |  Status: 404
  // constructor(bookingId: string)

class InsufficientFundsError extends AppError;
  // Code: PAY_5003  |  Status: 400

class DuplicatePaymentError extends AppError;
  // Code: PAY_5004  |  Status: 409
  // Message: "This payment has already been processed."

// ═══════════════════════════════════════════════════════════════
// VENDOR ERRORS (VEN_6xxx)
// ═══════════════════════════════════════════════════════════════

class VendorNotVerifiedError extends AppError;
  // Code: VEN_6001  |  Status: 403

class VendorSubscriptionRequiredError extends AppError;
  // Code: VEN_6002  |  Status: 402
  // constructor(feature: string)

// ═══════════════════════════════════════════════════════════════
// SYSTEM ERRORS (SYS_9xxx)
// ═══════════════════════════════════════════════════════════════

class InternalError extends AppError;
  // Code: SYS_9001  |  Status: 500
  // constructor(message?: string)

class ServiceUnavailableError extends AppError;
  // Code: SYS_9002  |  Status: 503
  // constructor(service: string)
```

---

### 27.2 @wedding-os/shared-events — Event Bus API

```typescript
// ═══════════════════════════════════════════════════════════════
// DOMAIN EVENT TYPES (43 total)
// ═══════════════════════════════════════════════════════════════

type DomainEventType =
  // Auth (3)
  | 'auth.otp_sent'
  | 'auth.user_registered'
  | 'auth.login_success'
  // Vendor (6)
  | 'vendor.registered'
  | 'vendor.kyc_submitted'
  | 'vendor.kyc_approved'
  | 'vendor.kyc_rejected'
  | 'vendor.profile_updated'
  | 'vendor.subscription_changed'
  // Booking (7)
  | 'booking.enquiry_created'
  | 'booking.quote_sent'
  | 'booking.confirmed'
  | 'booking.advance_paid'
  | 'booking.completed'
  | 'booking.cancelled'
  | 'booking.disputed'
  // Payment (3)
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.refunded'
  // Escrow (3)
  | 'escrow.created'
  | 'escrow.released'
  | 'escrow.disputed'
  // Payout (2)
  | 'payout.processed'
  | 'payout.failed'
  // Execution (5)
  | 'event.created'
  | 'event.task_completed'
  | 'event.vendor_checked_in'
  | 'event.issue_reported'
  | 'event.completed'
  // Review (1)
  | 'review.created'
  // User (3)
  | 'user.profile_updated'
  | 'user.kyc_approved'
  | 'user.kyc_rejected'

// ═══════════════════════════════════════════════════════════════
// CORE INTERFACES
// ═══════════════════════════════════════════════════════════════

interface DomainEvent<T = unknown> {
  id: string;                         // UUID v4
  type: DomainEventType;
  occurredAt: string;                 // ISO 8601
  aggregateId: string;
  aggregateType: string;
  payload: T;
  metadata?: Record<string, unknown>; // includes 'source' for self-loop prevention
}

interface EventBusOptions {
  redisUrl: string;
  serviceName: string;
  prefix?: string;                    // default: 'wos'
}

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

// ═══════════════════════════════════════════════════════════════
// EVENT BUS CLASS
// ═══════════════════════════════════════════════════════════════

class EventBus {
  constructor(opts: EventBusOptions);
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;

  async publish<T>(
    type: DomainEventType,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    metadata?: Record<string, unknown>
  ): Promise<string>;                 // returns event ID

  async subscribe<T = unknown>(
    type: DomainEventType,
    handler: EventHandler<T>
  ): Promise<void>;

  async subscribeMany(
    subscriptions: Array<{ type: DomainEventType; handler: EventHandler }>
  ): Promise<void>;

  async subscribePattern(
    pattern: string,                  // e.g., 'booking.*'
    handler: EventHandler
  ): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS (Singleton)
// ═══════════════════════════════════════════════════════════════

function createEventBus(opts: EventBusOptions): EventBus;
  // Creates + stores singleton. Call once in server.ts startup.

function getEventBus(): EventBus;
  // Returns singleton. Throws if not initialized.

// ═══════════════════════════════════════════════════════════════
// EVENT PAYLOAD INTERFACES
// ═══════════════════════════════════════════════════════════════

interface BookingEnquiryPayload {
  bookingId: string;
  customerId: string;
  vendorId: string;
  eventDate: string;
  totalAmount: number;
}

interface PaymentCapturedPayload {
  paymentId: string;
  bookingId: string;
  vendorId: string;
  customerId: string;
  amount: number;
  gatewayPaymentId: string;
}

interface EscrowCreatedPayload {
  escrowId: string;
  paymentId: string;
  bookingId: string;
  vendorId: string;
  heldAmount: number;
  platformFee: number;
  vendorPayout: number;
}

interface VendorCheckedInPayload {
  eventId: string;
  bookingId: string;
  vendorId: string;
  checkedInAt: string;
  lat?: number;
  lng?: number;
}

interface NotificationRequestPayload {
  userId: string;
  channels: string[];
  template: string;
  variables: Record<string, string>;
}
```

---

### 27.3 @wedding-os/shared-types — Type Definitions (46 exports)

```typescript
// ═══════════════════════════════════════════════════════════════
// USER & AUTH
// ═══════════════════════════════════════════════════════════════

type UserRole = 'customer' | 'vendor' | 'coordinator' | 'admin' | 'super_admin';
type UserStatus = 'active' | 'suspended' | 'deleted';

interface User {
  id: string;
  phone: string;
  email?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  languagePreference: string;
  notificationPreferences: NotificationPreferences;
}

interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
}

interface JwtPayload {
  sub: string;       // user id
  role: UserRole;
  phone: string;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  sub: string;
  deviceId?: string;
  jti: string;       // unique token id
}

// ═══════════════════════════════════════════════════════════════
// VENDOR
// ═══════════════════════════════════════════════════════════════

type VendorCategory =
  | 'venue' | 'catering' | 'photography' | 'videography'
  | 'decor' | 'makeup' | 'mehendi' | 'music'
  | 'transport' | 'invitation' | 'priest' | 'other';

type VerificationStatus = 'pending' | 'verified' | 'rejected';
type KycStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected';
type SubscriptionTier = 'free' | 'premium' | 'enterprise';
type PriceType = 'fixed' | 'per_plate' | 'per_hour' | 'per_day' | 'custom';

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  category: VendorCategory;
  subCategories: string[];
  description?: string;
  verificationStatus: VerificationStatus;
  kycStatus: KycStatus;
  citiesServed: string[];
  yearsExperience?: number;
  teamSize?: number;
  basePrice?: number;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  isFeatured: boolean;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
}

interface VendorPackage {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  priceType: PriceType;
  inclusions: string[];
  exclusions: string[];
  minGuests?: number;
  maxGuests?: number;
  advancePercentage: number;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════
// BOOKING
// ═══════════════════════════════════════════════════════════════

type BookingStatus =
  | 'enquiry' | 'quoted' | 'confirmed' | 'advance_paid'
  | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

type EventType =
  | 'wedding' | 'engagement' | 'reception' | 'sangeet'
  | 'mehendi' | 'haldi' | 'birthday' | 'corporate' | 'other';

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vendorId: string;
  eventId?: string;
  packageId?: string;
  status: BookingStatus;
  eventDate: Date;
  eventTime?: string;
  eventLocation?: string;
  totalAmount: number;
  advanceAmount?: number;
  advancePaid: boolean;
  finalAmount?: number;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Event {
  id: string;
  customerId: string;
  eventName: string;
  eventType: EventType;
  weddingDate?: Date;
  venueCity?: string;
  totalBudget?: number;
  allocatedBudget: number;
  guestCount?: number;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════════════════════════════

type PaymentType = 'advance' | 'milestone' | 'final' | 'refund' | 'platform_fee';
type PaymentStatus = 'initiated' | 'processing' | 'success' | 'failed' | 'refunded';
type PaymentGateway = 'razorpay' | 'stripe' | 'manual';
type EscrowStatus =
  | 'holding' | 'partial_released' | 'release_pending'
  | 'fully_released' | 'disputed' | 'refunded';
type EscrowReleaseTrigger = 'manual' | 'auto_7day' | 'customer_confirm' | 'milestone';

interface Payment {
  id: string;
  bookingId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  createdAt: Date;
}

interface EscrowHold {
  id: string;
  paymentId: string;
  bookingId: string;
  vendorId: string;
  heldAmount: number;
  platformFee: number;
  vendorPayout: number;
  status: EscrowStatus;
  holdExpiry?: Date;
  releaseTrigger?: EscrowReleaseTrigger;
  releasedAt?: Date;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// TASK / EXECUTION
// ═══════════════════════════════════════════════════════════════

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped';
type TaskOwner = 'customer' | 'vendor' | 'coordinator' | 'system';

interface Task {
  id: string;
  eventId: string;
  bookingId?: string;
  title: string;
  description?: string;
  dueDate: Date;
  dueDaysBeforeEvent: number;
  status: TaskStatus;
  owner: TaskOwner;
  assignedUserId?: string;
  dependsOnTaskId?: string;
  isAutoGenerated: boolean;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// REVIEW
// ═══════════════════════════════════════════════════════════════

interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  vendorId: string;
  rating: number;
  comment?: string;
  photoUrls: string[];
  isVerified: boolean;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE
// ═══════════════════════════════════════════════════════════════

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    pagination?: { cursor?: string; hasNext: boolean; totalCount?: number; };
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
  meta: { requestId: string; timestamp: string; };
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════════════════════════

type NotificationChannel = 'push' | 'sms' | 'whatsapp' | 'email' | 'in_app';
type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface NotificationPayload {
  userId: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  template: string;
  variables: Record<string, string>;
  data?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════

interface VendorSearchFilters {
  query?: string;
  category?: VendorCategory;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  availabilityDate?: string;
  verifiedOnly?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  cursor?: string;
  limit?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
}

interface VendorSearchResult {
  vendors: VendorSearchItem[];
  cursor?: string;
  hasNext: boolean;
  total: number;
}

interface VendorSearchItem {
  id: string;
  businessName: string;
  category: VendorCategory;
  citiesServed: string[];
  basePrice?: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isFeatured: boolean;
  coverPhotoUrl?: string;
  score?: number;
}
```

---

### 27.4 @wedding-os/shared-utils — Utility Functions

```typescript
// ═══════════════════════════════════════════════════════════════
// CURRENCY (INR-specific)
// ═══════════════════════════════════════════════════════════════

/** Convert rupees to paise for Razorpay (1 INR = 100 paise) */
function rupeesToPaise(rupees: number): number;
  // returns Math.round(rupees * 100)

/** Convert paise back to rupees for display */
function paiseToRupees(paise: number): number;
  // returns paise / 100

/** Format as Indian currency: ₹1,23,456.00 */
function formatINR(rupees: number): string;
  // uses Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

// ═══════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════

function addDays(date: Date, days: number): Date;
function daysBetween(start: Date, end: Date): number;
function isWeekend(date: Date): boolean;
function formatDate(date: Date): string;   // returns "YYYY-MM-DD"

/** Indian wedding peak season: November through February */
function isPeakSeason(date: Date): boolean;
  // month 11, 12, 1, or 2

// ═══════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════

/** Generate booking number: "WOS-{timestamp_base36}-{random_4hex}" */
function generateBookingNumber(): string;
  // Example: WOS-LQ3ZMX7-A1B2

/** Convert text to URL-safe slug */
function slugify(text: string): string;
  // lowercase, replace non-alphanumeric with hyphens, trim hyphens

/** Mask phone number for display privacy */
function maskPhone(phone: string): string;
  // "+9196****789" — first 4 chars + **** + last 3 chars

// ═══════════════════════════════════════════════════════════════
// CRYPTOGRAPHIC UTILITIES
// ═══════════════════════════════════════════════════════════════

/** Generate cryptographically secure 6-digit OTP */
function generateOtp(): string;
  // uses crypto.randomBytes(3), range: 100000-999999

/** SHA-256 hash of any string */
function hashSha256(value: string): string;
  // returns hex digest

/** Constant-time string comparison (prevents timing attacks) */
function safeCompare(a: string, b: string): boolean;
  // uses crypto.timingSafeEqual, returns false if lengths differ

// ═══════════════════════════════════════════════════════════════
// INDIAN DOCUMENT VALIDATION
// ═══════════════════════════════════════════════════════════════

function isValidIndianPhone(phone: string): boolean;
  // Regex: /^\+91[6-9]\d{9}$/   — E.164 format

function isValidGST(gst: string): boolean;
  // Regex: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  // 15-char GST number

function isValidPAN(pan: string): boolean;
  // Regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  // 10-char PAN: AAAAA9999A

function isValidIFSC(ifsc: string): boolean;
  // Regex: /^[A-Z]{4}0[A-Z0-9]{6}$/
  // 11-char IFSC: ABCD0123456

// ═══════════════════════════════════════════════════════════════
// PAGINATION (Cursor-based)
// ═══════════════════════════════════════════════════════════════

function encodeCursor(id: string): string;
  // base64url(JSON.stringify({ id }))

function decodeCursor(cursor: string): { id: string } | null;
  // returns null on decode error

// ═══════════════════════════════════════════════════════════════
// PLATFORM FEE CALCULATION
// ═══════════════════════════════════════════════════════════════

interface FeeCalculation {
  totalAmount: number;
  platformFee: number;      // amount × commissionRate (default 10%)
  gstOnFee: number;         // platformFee × 0.18 (18% GST)
  vendorPayout: number;     // amount − platformFee − gstOnFee
  razorpayFee: number;      // amount × 0.02 (2% gateway fee)
  netToVendor: number;      // vendorPayout − razorpayFee
}

function calculatePlatformFee(
  amount: number,
  commissionRate: number = 0.10
): FeeCalculation;

// Example: calculatePlatformFee(100000)
// → { totalAmount: 100000, platformFee: 10000, gstOnFee: 1800,
//     vendorPayout: 88200, razorpayFee: 2000, netToVendor: 86200 }
```

---

## 28. Cross-Service Communication Flows

Detailed step-by-step flows showing how services interact for key business processes.

### 28.1 Complete Booking Lifecycle

```
┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│ Customer │    │ booking-svc  │    │ payment-svc  │    │notification   │    │ vendor-svc   │
│ (Web/App)│    │   :4004      │    │   :4005      │    │   :4008       │    │   :4003      │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘    └───────┬───────┘    └──────┬───────┘
     │                 │                   │                    │                   │
     │ 1. POST /bookings                  │                    │                   │
     │─────────────────>                   │                    │                   │
     │ { vendorId, eventDate, eventType,   │                    │                   │
     │   guestCount, requirements }        │                    │                   │
     │                 │                   │                    │                   │
     │                 │ Creates Booking(ENQUIRY)               │                   │
     │                 │ Generates WOS-XXXXX number             │                   │
     │                 │                   │                    │                   │
     │                 │ PUBLISH: booking.enquiry_created       │                   │
     │                 │──────────────────────────────────────────>                  │
     │                 │                   │                    │ SMS+Push to vendor │
     │                 │                   │                    │                   │
     │ 2. Vendor sends quote               │                    │                   │
     │ POST /bookings/:id/quote            │                    │                   │
     │─────────────────>                   │                    │                   │
     │ { quotedAmountPaise, vendorQuoteNote }                   │                   │
     │                 │                   │                    │                   │
     │                 │ Updates status → QUOTE_SENT            │                   │
     │                 │ PUBLISH: booking.quote_sent             │                   │
     │                 │──────────────────────────────────────────>                  │
     │                 │                   │                    │ Push to customer   │
     │                 │                   │                    │                   │
     │ 3. Customer accepts quote           │                    │                   │
     │ POST /bookings/:id/accept-quote     │                    │                   │
     │─────────────────>                   │                    │                   │
     │                 │                   │                    │                   │
     │                 │ Updates → QUOTE_ACCEPTED               │                   │
     │                 │ Calculates platformFee + GST            │                   │
     │                 │                   │                    │                   │
     │ 4. Customer pays via Razorpay       │                    │                   │
     │ POST /payments/order                │                    │                   │
     │────────────────────────────────────>│                    │                   │
     │                 │                   │ Creates Razorpay order                  │
     │                 │                   │ Returns { orderId, amount, key }        │
     │<────────────────────────────────────│                    │                   │
     │                 │                   │                    │                   │
     │ (Razorpay checkout in browser/app)  │                    │                   │
     │                 │                   │                    │                   │
     │ POST /payments/verify               │                    │                   │
     │────────────────────────────────────>│                    │                   │
     │ { razorpayOrderId, paymentId, signature }                │                   │
     │                 │                   │                    │                   │
     │                 │                   │ Verifies HMAC signature                 │
     │                 │                   │ Creates Payment(CAPTURED)               │
     │                 │                   │ Creates EscrowHold(HELD)                │
     │                 │                   │ Schedules release (eventDate + 7 days)  │
     │                 │                   │                    │                   │
     │                 │                   │ HTTP: booking-svc/internal/confirm      │
     │                 │<──────────────────│                    │                   │
     │                 │ Updates → CONFIRMED                    │                   │
     │                 │                   │                    │                   │
     │                 │                   │ PUBLISH: payment.captured               │
     │                 │                   │──────────────────────>                  │
     │                 │                   │                    │ Notify both parties │
     │                 │                   │                    │                   │
     │ 5. Event day + 7 days (auto)        │                    │                   │
     │                 │                   │ BullMQ cron job    │                   │
     │                 │                   │ Releases escrow    │                   │
     │                 │                   │ PUBLISH: escrow.released                │
     │                 │                   │──────────────────────>                  │
     │                 │                   │                    │ Notify vendor      │
     │                 │                   │                    │──────────────────>│
     │                 │                   │                    │                   │ Credit vendor
```

### 28.2 Review & Rating Flow

```
1. Customer submits review:
   POST /reviews { bookingId, rating, title, body, photos[] }
   └─ review-service creates Review (isPublished: false for moderation)
   └─ PUBLISHES: review.created { bookingId, vendorId, rating, customerId }
      ├─ notification-service → Push notification to vendor
      └─ vendor-service → Recalculates vendor avgRating from all reviews

2. Vendor replies:
   POST /reviews/:id/reply { vendorReply }
   └─ review-service updates Review (vendorReply, vendorRepliedAt)

3. User marks helpful:
   POST /reviews/:id/helpful
   └─ review-service increments helpfulCount
```

### 28.3 Vendor Registration & KYC Flow

```
1. POST /auth/register-vendor { phone }
   └─ auth-service creates User(role: vendor)
   └─ PUBLISHES: auth.user_registered

2. PUT /vendors/me { businessName, category, city, ... }
   └─ vendor-service creates/updates Vendor profile
   └─ PUBLISHES: vendor.profile_updated
      └─ search-service → Indexes vendor (but not yet searchable)

3. POST /users/me/kyc/presign { docType: "PAN" }
   └─ user-service creates KycDocument(PENDING), returns presigned S3 URL
   └─ Client uploads document directly to S3

4. Admin reviews KYC:
   PATCH /users/kyc/:docId/review { status: "APPROVED" }
   └─ user-service updates KycDocument(APPROVED)
   └─ PUBLISHES: vendor.kyc_approved
      ├─ search-service → Makes vendor searchable in ES
      └─ notification-service → Notifies vendor of approval
```

### 28.4 Real-time Chat Flow

```
1. Create conversation:
   POST /chat/conversations { bookingId }
   └─ chat-service finds or creates Conversation (upsert by bookingId)
   └─ Returns conversationId

2. WebSocket connection:
   Client connects: io('ws://localhost:4010', { auth: { token: JWT } })
   └─ chat-service verifies JWT via middleware
   └─ Client joins room: socket.emit('join:conversation', { conversationId })

3. Send message:
   socket.emit('message:send', { conversationId, content, contentType })
   └─ chat-service validates input, saves Message to MongoDB
   └─ Broadcasts to room: io.to(conversationId).emit('message:new', message)
   └─ Updates Conversation.lastMessage + unread counts

4. Typing indicator:
   socket.emit('typing:start', { conversationId })
   └─ Broadcast to room: socket.to(conversationId).emit('typing:start', { userId })
```

### 28.5 Search & Indexing Flow

```
1. Vendor profile updated → vendor-service PUBLISHES: vendor.profile_updated
2. search-service SUBSCRIBES to vendor.profile_updated
3. search-service calls internal: POST /search/vendors/index { vendor data }
4. Elasticsearch index updated with vendor document

5. Customer searches: GET /search/vendors?q=photographer&city=Mumbai
6. search-service builds ES query with:
   - Multi-match on businessName + description
   - Filters: category, city, price range, rating
   - Aggregations: category counts, city counts
7. Returns paginated results with relevance scores
```

---

## 29. Error Code Reference

Complete mapping of all error codes used across the platform.

| Code | HTTP Status | Category | Error Class | Default Message |
|------|-------------|----------|-------------|-----------------|
| `AUTH_1001` | 400 | Auth | `OtpInvalidError` | Invalid OTP. Please try again. |
| `AUTH_1002` | 400 | Auth | `OtpExpiredError` | OTP has expired. Please request a new one. |
| `AUTH_1003` | 429 | Auth | `RateLimitedError` | Too many requests. Try again in {n} seconds. |
| `AUTH_1004` | 423 | Auth | `AccountLockedError` | Account locked. Try again in {n} minutes. |
| `AUTH_1005` | 401 | Auth | `TokenExpiredError` | Token has expired. Please login again. |
| `AUTH_1006` | 401 | Auth | `TokenInvalidError` | Invalid token. |
| `AUTH_1007` | 401 | Auth | `UnauthorizedError` | Authentication required. |
| `AUTH_1008` | 403 | Auth | `ForbiddenError` | You do not have permission. |
| `VAL_2001` | 400 | Validation | `ValidationError` | (custom message + field) |
| `RES_3001` | 404 | Resource | `NotFoundError` | {resource} not found. |
| `RES_3002` | 409 | Resource | `ConflictError` | (custom message) |
| `BOOK_4001` | 409 | Booking | `VendorNotAvailableError` | Vendor not available on {date}. |
| `BOOK_4002` | 409 | Booking | `BookingAlreadyConfirmedError` | Booking already confirmed. |
| `BOOK_4003` | 400 | Booking | `BookingCancellationError` | Cannot cancel: {reason}. |
| `PAY_5001` | 400 | Payment | `PaymentVerificationError` | Payment signature verification failed. |
| `PAY_5002` | 404 | Payment | `EscrowNotFoundError` | No escrow found for booking {id}. |
| `PAY_5003` | 400 | Payment | `InsufficientFundsError` | Insufficient funds in wallet. |
| `PAY_5004` | 409 | Payment | `DuplicatePaymentError` | Payment already processed. |
| `VEN_6001` | 403 | Vendor | `VendorNotVerifiedError` | Vendor KYC verification pending. |
| `VEN_6002` | 402 | Vendor | `VendorSubscriptionRequiredError` | Feature requires Premium subscription. |
| `SYS_9001` | 500 | System | `InternalError` | An internal error occurred. |
| `SYS_9002` | 503 | System | `ServiceUnavailableError` | Service {name} temporarily unavailable. |

**Standard Error Response Format:**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "Invalid OTP. Please try again.",
    "field": "otp",
    "details": {}
  },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 30. Service Source File Architecture

Detailed file structure for every backend service showing exact files, their purpose, and key implementation details.

### 30.1 Common Service Structure

Every Node.js service follows this pattern:

```
services/{service-name}/
├── package.json              ← Dependencies, scripts (dev, build, start, test, lint, typecheck)
├── tsconfig.json             ← Extends ../../tsconfig.base.json
├── jest.config.js            ← Jest + ts-jest config (roots: ['tests'], diagnostics: false)
├── Dockerfile                ← Multi-stage: node:20-alpine builder → runner
├── prisma/
│   └── schema.prisma         ← Database schema (PostgreSQL or MongoDB)
├── src/
│   ├── server.ts             ← HTTP server + graceful shutdown (SIGTERM/SIGINT) + event bus
│   ├── config/
│   │   └── index.ts          ← Environment variable loading with defaults
│   ├── routes/
│   │   └── *.routes.ts       ← Express route definitions with middleware chain
│   ├── controllers/
│   │   └── *.controller.ts   ← Request handler functions (parse req → call service → send response)
│   ├── services/
│   │   └── *.service.ts      ← Business logic layer (throws AppError subclasses)
│   ├── middleware/
│   │   ├── auth.ts           ← JWT verification (RS256 public key), req.user extraction
│   │   ├── errorHandler.ts   ← Global error handler (AppError → JSON, unknown → 500)
│   │   ├── validate.ts       ← Zod schema validation middleware
│   │   └── requestId.ts      ← X-Request-ID header generation
│   └── utils/
│       └── logger.ts         ← Pino logger (JSON in prod, pino-pretty in dev)
└── tests/
    └── unit/
        └── *.test.ts         ← Jest unit tests (mock Prisma, Redis, external APIs)
```

### 30.2 Per-Service Source Files

| Service | Source Files | Key Tech | Routes File | Service File | Test File |
|---------|-------------|----------|-------------|-------------|-----------|
| auth | server, config, routes/auth.routes, services/otp.service, services/user.service, middleware/auth+errorHandler, utils/logger | JWT RS256, Redis OTP, MSG91 | auth.routes.ts | otp.service.ts, user.service.ts | otp.service.test.ts |
| user | server, config/index+database, routes/user.routes, controllers/user.controller, services/profile.service, middleware/auth+errorHandler, utils/logger | Prisma, S3 presign, KYC | user.routes.ts | profile.service.ts | profile.service.test.ts |
| vendor | server, config/index+database, routes/vendor.routes, controllers/vendor.controller, services/vendor.service+search.service, middleware/auth+errorHandler, utils/logger | Prisma, ES indexing | vendor.routes.ts | vendor.service.ts, search.service.ts | vendor.service.test.ts |
| booking | server, config/index+database, routes/booking.routes, controllers/booking.controller, services/booking.service, middleware/auth+errorHandler+validate, utils/logger | Prisma, FSM, event bus | booking.routes.ts | booking.service.ts | booking.service.test.ts |
| payment | server, config/index+database, routes/payment.routes, controllers/payment.controller, services/payment.service, middleware/auth+errorHandler+validate, utils/logger | Razorpay SDK, BullMQ, escrow | payment.routes.ts | payment.service.ts | payment.service.test.ts |
| execution | server, config/index+database, routes/execution.routes, controllers/timeline.controller, services/timeline.service, middleware/auth+errorHandler, utils/logger | Prisma, Socket.IO, cron | execution.routes.ts | timeline.service.ts | timeline.service.test.ts |
| notification | server, config/index+database, routes/notification.routes, controllers/notification.controller, services/notification.service, channels/{push,sms,email,whatsapp}, middleware/auth+errorHandler+validate, utils/logger | BullMQ, FCM, MSG91, SendGrid | notification.routes.ts | notification.service.ts | notification.service.test.ts |
| review | server, config/index+database, routes/review.routes, controllers/review.controller, services/review.service, middleware/auth+errorHandler+validate, utils/logger | Prisma, event bus | review.routes.ts | review.service.ts | review.service.test.ts |
| chat | server (Express+Socket.IO), config/index+database, middleware/errorHandler, utils/logger | Mongoose, Socket.IO, JWT | (in server.ts) | (in server.ts) | chat.handler.test.ts |
| search | server, config/index, routes/search.routes, services/search.service, middleware/errorHandler+validate, utils/logger | Elasticsearch 8.13 | search.routes.ts | search.service.ts | search.service.test.ts |
| media | server, config/index, routes/media.routes, services/upload.service, middleware/errorHandler+validate, utils/logger | AWS S3, Sharp, presigned URLs | media.routes.ts | upload.service.ts | upload.service.test.ts |
| ai | main.py (FastAPI) | OpenAI, Anthropic, FastAPI | (in main.py) | (in main.py) | — |

### 30.3 Middleware Stack (Applied in Order)

```typescript
// Every service applies these in server.ts / app.ts:
app.use(helmet());                              // 1. Security headers
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));  // 2. CORS
app.use(rateLimit({ windowMs: 15*60*1000, max: N }));           // 3. Rate limit
app.use(express.json({ limit: '10kb' }));       // 4. Body parsing
app.use(pinoHttp({ logger }));                  // 5. Request logging
app.use(requestId);                             // 6. X-Request-ID

// Routes with auth middleware per-endpoint:
router.get('/protected', authMiddleware, controller.handler);

// Error handler MUST be last:
app.use(errorHandler);                          // 7. Global error handler
```

### 30.4 Error Handler Pattern

```typescript
// All 11 services use this pattern in errorHandler.ts:
import { AppError } from '@wedding-os/shared-errors';

export const errorHandler = (err, req, res, next) => {
  // 1. Check for shared-errors AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        field: err.field,
        details: err.details,
      },
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  }

  // 2. Legacy error object support (backward compat)
  if (err.statusCode && err.code) {
    return res.status(err.statusCode).json({ ... });
  }

  // 3. Unknown errors → 500
  logger.error({ err, requestId: req.id }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: { code: 'SYS_9001', message: 'An unexpected error occurred' },
    meta: { requestId: req.id, timestamp: new Date().toISOString() },
  });
};
```

---

## 31. Testing Documentation

### 31.1 Test Infrastructure

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | ^29.0.0 | Test runner & assertion library |
| ts-jest | ^29.0.0 | TypeScript transformer for Jest |
| @types/jest | ^29.0.0 | TypeScript definitions |

**Jest Configuration (`jest.config.js`):**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['tests'],
  testMatch: ['**/*.test.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { diagnostics: false }] },
  moduleNameMapper: {
    '@wedding-os/(.*)': '<rootDir>/../../packages/$1/src',
  },
};
```

### 31.2 Test Counts by Service

| Service | Test File | Test Cases | Key Scenarios |
|---------|-----------|------------|---------------|
| **auth** | otp.service.test.ts | 18 | OTP generation, verification, expiry, rate limiting, lockout, JWT signing |
| **booking** | booking.service.test.ts | 37 | Fee calculation, enquiry CRUD, quote send/accept, confirm, cancel (customer/vendor/forbidden/non-cancellable), status filtering |
| **payment** | payment.service.test.ts | 26 | Razorpay order creation, idempotency, signature verification, escrow hold, escrow release, refund (full/partial), webhook handlers |
| **review** | review.service.test.ts | 16 | Create review, duplicate prevention (ConflictError), vendor reply, helpful votes, pagination |
| **user** | profile.service.test.ts | 18 | Profile CRUD, avatar presign, KYC upload, push token management, notification preferences |
| **vendor** | vendor.service.test.ts | 16 | Vendor CRUD, package management, ES sync, search query building |
| **chat** | chat.handler.test.ts | 66 | Socket auth, join:conversation, message:send, message validation, typing indicators, disconnect, unread counts |
| **execution** | timeline.service.test.ts | 33 | Timeline CRUD, 12 default task templates, due date calculation, system task protection, task status updates |
| **media** | upload.service.test.ts | 49 | MIME validation (image/pdf), S3 presigned URL generation, key structure by media type, dev fallback, file deletion, ownership check |
| **notification** | notification.service.test.ts | 31 | BullMQ job processing, multi-channel dispatch (FCM/SMS/Email/WhatsApp), event routing, unread count, preferences |
| **search** | search.service.test.ts | 33 | ES query building, category/city/price filters, rating filter, sort modes, pagination, aggregations, autocomplete |
| **TOTAL** | **11 files** | **~343** | |

### 31.3 Mocking Strategy

Every test file mocks external dependencies to ensure isolated unit testing:

```typescript
// Pattern: Mock at module level, reset in beforeEach

// Prisma client mock
jest.mock('../../src/config/database', () => ({
  prisma: {
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    bookingEvent: { create: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  },
}));

// Redis mock
jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({
  get: jest.fn(), set: jest.fn(), del: jest.fn(), incr: jest.fn(),
})));

// External API mocks
jest.mock('axios');             // Inter-service HTTP calls
jest.mock('razorpay');          // Payment gateway
jest.mock('@aws-sdk/client-s3');// S3 operations
jest.mock('@elastic/elasticsearch'); // Search engine
jest.mock('mongoose');          // MongoDB (chat-service)
jest.mock('bullmq');            // Job queues
jest.mock('socket.io');         // WebSocket (chat, execution)

// Config mock (avoid loading .env in tests)
jest.mock('../../src/config', () => ({
  PORT: 4004,
  DATABASE_URL: 'postgresql://test@localhost/test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_PUBLIC_KEY: 'test-key',
  // ... service-specific defaults
}));

// Logger mock (suppress output)
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));
```

### 31.4 Running Tests

```bash
# Run all tests across all services
pnpm test

# Run tests for a specific service
pnpm test --filter=auth-service
pnpm test --filter=booking-service

# Run tests with coverage
cd services/booking-service && npx jest --coverage

# Run a specific test file
cd services/chat-service && npx jest tests/unit/chat.handler.test.ts

# Watch mode for development
cd services/payment-service && npx jest --watch
```

---

## 32. API Request & Response Examples

Concrete request/response examples for key endpoints.

### 32.1 Authentication

**Send OTP:**

```bash
POST /auth/send-otp
Content-Type: application/json

{ "phone": "+919876543210" }
```

```json
// 200 OK
{
  "success": true,
  "data": { "message": "OTP sent successfully", "expiresInSeconds": 600 },
  "meta": { "requestId": "uuid", "timestamp": "2024-01-15T10:00:00Z" }
}
```

**Verify OTP:**

```bash
POST /auth/verify-otp
Content-Type: application/json

{ "phone": "+919876543210", "otp": "123456" }
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "id": "uuid",
      "phone": "+919876543210",
      "role": "customer",
      "status": "active",
      "phoneVerified": true
    }
  }
}
```

### 32.2 Vendor Search

```bash
GET /search/vendors?q=photographer&city=Mumbai&minRating=4&sortBy=rating&page=1&limit=10
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "uuid",
        "businessName": "Pixel Perfect Studios",
        "category": "PHOTOGRAPHER",
        "city": "Mumbai",
        "avgRating": 4.8,
        "reviewCount": 124,
        "priceFrom": 5000000,
        "coverPhoto": "https://s3.amazonaws.com/...",
        "plusMember": true
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

### 32.3 Create Booking Enquiry

```bash
POST /bookings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "vendorId": "vendor-uuid",
  "packageId": "package-uuid",
  "eventDate": "2024-12-15",
  "eventType": "WEDDING_CEREMONY",
  "eventCity": "Mumbai",
  "guestCount": 500,
  "requirements": "Need candid + traditional photography"
}
```

```json
// 201 Created
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "bookingNumber": "WOS-LQ3ZMX7-A1B2",
    "status": "ENQUIRY",
    "vendorId": "vendor-uuid",
    "eventDate": "2024-12-15T00:00:00Z",
    "eventType": "WEDDING_CEREMONY",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 32.4 Create Payment Order

```bash
POST /payments/order
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "bookingId": "booking-uuid",
  "amountPaise": 5000000,
  "description": "Advance payment for WOS-LQ3ZMX7-A1B2"
}
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_NNNNxxxxxxxx",
    "amountPaise": 5000000,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_xxxx"
  }
}
```

### 32.5 Verify Payment

```bash
POST /payments/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "razorpayOrderId": "order_NNNNxxxxxxxx",
  "razorpayPaymentId": "pay_NNNNxxxxxxxx",
  "razorpaySignature": "hmac_sha256_signature"
}
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "status": "CAPTURED",
    "escrow": {
      "id": "escrow-uuid",
      "heldAmountPaise": 5000000,
      "platformFeePaise": 500000,
      "gstOnFeePaise": 90000,
      "vendorPayoutPaise": 4410000,
      "status": "HELD",
      "releaseScheduledAt": "2024-12-22T00:00:00Z"
    }
  }
}
```

### 32.6 Get Presigned Upload URL

```bash
POST /media/presign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "mediaType": "portfolio",
  "mimeType": "image/jpeg",
  "fileName": "wedding-photo-1.jpg"
}
```

```json
// 200 OK
{
  "success": true,
  "data": {
    "uploadUrl": "https://weddingos-dev-media.s3.ap-south-1.amazonaws.com/portfolio/vendor-uuid/wedding-photo-1.jpg?X-Amz-...",
    "s3Key": "portfolio/vendor-uuid/wedding-photo-1.jpg",
    "expiresIn": 3600
  }
}
```

### 32.7 Submit Review

```bash
POST /reviews
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "bookingId": "booking-uuid",
  "rating": 5,
  "title": "Amazing photographer!",
  "body": "Pixel Perfect Studios exceeded our expectations...",
  "qualityRating": 5,
  "valueRating": 4,
  "professionalismRating": 5,
  "punctualityRating": 5,
  "photos": ["https://s3.amazonaws.com/reviews/booking-uuid/photo1.jpg"]
}
```

```json
// 201 Created
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "bookingId": "booking-uuid",
    "rating": 5,
    "isPublished": false,
    "createdAt": "2024-01-20T14:30:00Z"
  }
}
```

---

## 33. Rebuild from Scratch — Detailed Guide

Complete step-by-step instructions to recreate the entire WeddingOS platform from zero. For a high-level overview, see [Section 25](#25-rebuild-from-scratch-guide). This section provides the exact commands and file structures.

### 33.1 Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | ≥ 20.0.0 LTS | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 9.0.0 | `npm install -g pnpm@9` |
| Docker | ≥ 24.0 | [docker.com](https://docker.com) |
| Docker Compose | ≥ 2.20 | Included with Docker Desktop |
| Flutter SDK | ≥ 3.19 | [flutter.dev](https://flutter.dev) |
| OpenSSL | any | Pre-installed on macOS/Linux |
| Git | any | Pre-installed on macOS/Linux |

### 33.2 Step 1 — Monorepo Setup

```bash
# Create root project
mkdir wedding-os && cd wedding-os
pnpm init

# Configure pnpm workspaces
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
EOF

# Install Turborepo
pnpm add -D turbo typescript rimraf

# Create turbo.json with task pipeline
# (build depends on ^build, test depends on ^build, lint/typecheck independent)

# Create tsconfig.base.json
# (ES2022, commonjs, strict, declaration, sourceMap)

# Create .eslintrc.json, .prettierrc.json
# Create .gitignore, .env.example
```

### 33.3 Step 2 — Shared Packages

Create in order (shared-errors has no deps, shared-utils needs pino, shared-events needs redis):

```bash
# 1. shared-types — TypeScript interfaces (no runtime deps)
mkdir -p packages/shared-types/src
# Export: User, Vendor, Booking, Payment, Review, Task, Notification types
# Export: UserRole, BookingStatus, EventType, PaymentStatus enums
# Export: ApiSuccessResponse, ApiErrorResponse, VendorSearchFilters

# 2. shared-errors — Error class hierarchy (no runtime deps)
mkdir -p packages/shared-errors/src
# Export: AppError base class + 18 specific error subclasses
# Code ranges: AUTH_1xxx, VAL_2xxx, RES_3xxx, BOOK_4xxx, PAY_5xxx, VEN_6xxx, SYS_9xxx

# 3. shared-utils — Utility functions
mkdir -p packages/shared-utils/src
pnpm --filter shared-utils add pino
# Export: currency (rupeesToPaise, formatINR), dates, crypto (generateOtp, hashSha256),
#         validation (isValidIndianPhone, isValidGST), pagination, calculatePlatformFee

# 4. shared-events — Redis pub/sub event bus
mkdir -p packages/shared-events/src
pnpm --filter shared-events add redis@4.6.0
# Export: EventBus class, createEventBus/getEventBus factories
# Define: 43 DomainEventType literals, DomainEvent<T> interface
```

### 33.4 Step 3 — Infrastructure

```bash
# Create docker-compose.infra.yml with:
# - PostgreSQL 16 (port 5432, user: weddingos)
# - Redis 7 (port 6379, AOF enabled)
# - Elasticsearch 8.13 (port 9200, single-node, security disabled)
# - MongoDB 7 (port 27017, user: weddingos)

# Create database init script
mkdir -p scripts/seed
cat > scripts/seed/init.sql << 'EOF'
CREATE DATABASE weddingos_auth;
CREATE DATABASE weddingos_users;
CREATE DATABASE weddingos_vendors;
CREATE DATABASE weddingos_bookings;
CREATE DATABASE weddingos_payments;
CREATE DATABASE weddingos_execution;
CREATE DATABASE weddingos_notifications;
CREATE DATABASE weddingos_reviews;
-- Grant all privileges to weddingos user
EOF

# Generate JWT keys
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Start infrastructure
docker compose -f docker-compose.infra.yml up -d
```

### 33.5 Step 4 — Backend Services (Build Order)

Build services in dependency order:

```
Phase 1 (no inter-service deps):
  1. auth-service    — JWT issuing, OTP verification
  2. media-service   — S3 presigned URLs (stateless)
  3. search-service  — Elasticsearch queries (stateless)

Phase 2 (depends on auth):
  4. user-service     — Profiles, KYC, push tokens
  5. vendor-service   — Vendor CRUD, ES indexing
  6. review-service   — Reviews, ratings

Phase 3 (depends on auth + vendor):
  7. booking-service  — Booking lifecycle FSM

Phase 4 (depends on booking):
  8. payment-service  — Razorpay, escrow holds

Phase 5 (depends on everything):
  9. notification-service — Multi-channel notifications
  10. execution-service   — Wedding timeline, tasks
  11. chat-service        — Real-time messaging

Phase 6 (optional):
  12. ai-service         — Python FastAPI, LLM integration
```

**For each Node.js service:**

```bash
mkdir -p services/{service-name}/{src/{config,routes,controllers,services,middleware,utils},prisma,tests/unit}

# 1. Create package.json with scripts: dev, build, start, test, lint, typecheck, db:migrate, db:generate
# 2. Create tsconfig.json extending ../../tsconfig.base.json
# 3. Create prisma/schema.prisma (see Section 17 for complete schemas)
# 4. Create src/config/index.ts (env var loading)
# 5. Create src/utils/logger.ts (Pino)
# 6. Create src/middleware/auth.ts (JWT RS256 verification)
# 7. Create src/middleware/errorHandler.ts (AppError handling)
# 8. Create src/middleware/validate.ts (Zod schema validation)
# 9. Create src/services/*.service.ts (business logic)
# 10. Create src/routes/*.routes.ts (Express routes)
# 11. Create src/server.ts (Express setup + event bus + graceful shutdown)
# 12. Create jest.config.js
# 13. Create Dockerfile (multi-stage, node:20-alpine)
# 14. Create tests/unit/*.test.ts

# Install dependencies
pnpm --filter {service-name} add express cors helmet express-rate-limit pino pino-http jsonwebtoken zod
pnpm --filter {service-name} add @prisma/client ioredis
pnpm --filter {service-name} add @wedding-os/shared-errors @wedding-os/shared-events @wedding-os/shared-utils
pnpm --filter {service-name} add -D typescript @types/express @types/node prisma jest ts-jest @types/jest

# Generate Prisma client
cd services/{service-name}
npx prisma generate
npx prisma migrate dev --name init
```

### 33.6 Step 5 — Frontend Apps

**Web App (Next.js 14):**

```bash
cd apps
npx create-next-app@14 web --typescript --tailwind --eslint --app --src-dir
cd web
pnpm add axios zustand @tanstack/react-query react-hook-form zod @hookform/resolvers
pnpm add framer-motion lucide-react react-hot-toast socket.io-client date-fns
pnpm add js-cookie clsx tailwind-merge

# Create:
# - next.config.js with API rewrites to all 12 services
# - tailwind.config.js with brand colors (purple/gold)
# - src/lib/api.ts (Axios with JWT interceptors)
# - src/store/authStore.ts (Zustand)
# - 19 pages (see Section 3.4)
# - 12+ components (see Section 3.5)
```

**Admin Dashboard:**

```bash
cd apps
npm create vite@latest admin -- --template react-ts
cd admin
pnpm add antd @ant-design/icons react-router-dom axios zustand @tanstack/react-query recharts date-fns js-cookie

# Create:
# - vite.config.ts with API proxy to services
# - 5 pages: Login, Dashboard, Vendors, Bookings, Users/Payments
# - AdminLayout with Ant Design Sider
```

**Vendor Portal:**

```bash
cd apps
npm create vite@latest vendor-web -- --template react-ts
cd vendor-web
pnpm add react-router-dom axios zustand @tanstack/react-query recharts date-fns react-hook-form zod

# Create:
# - vite.config.ts with API proxy
# - 5 pages: Login, Dashboard, Bookings, Profile, Analytics
# - DashboardLayout with sidebar
```

**Flutter Mobile App:**

```bash
cd apps
flutter create mobile --org com.weddingos --platforms android,ios,web
cd mobile
# Add to pubspec.yaml:
# flutter_riverpod, go_router, dio, flutter_secure_storage, hive_flutter
# cached_network_image, shimmer, google_fonts, razorpay_flutter
# firebase_core, firebase_messaging, flutter_local_notifications
# connectivity_plus, image_picker, share_plus, url_launcher

flutter pub get
# Create:
# - lib/core/ (theme, router, api_client)
# - lib/models/ (user, vendor, booking, review)
# - lib/providers/ (auth, vendor, booking, connectivity)
# - lib/features/ (20+ screens for customer + vendor)
# - lib/shared/widgets/ (app_shell, vendor_app_shell)
```

### 33.7 Step 6 — Kong API Gateway

```bash
mkdir -p infrastructure/kong
# Create kong.yml with:
# - Global plugins: rate-limiting (500/min), CORS, request-size-limiting (10MB)
# - 12 service routes: /api/v1/{service} → {service}:{port}
# - strip_path: false
```

### 33.8 Step 7 — CI/CD

```bash
mkdir -p .github/workflows

# ci.yml:
# - Lint & type-check (pnpm lint + tsc --noEmit)
# - Service tests (Jest with Postgres + Redis services)
# - Build web app (Next.js)
# - Flutter analyze + test
# - Build Android APK + iOS IPA
# - Docker build & push (11 services → GHCR)
# - Deploy staging (Terraform, develop branch)
# - Deploy production (Terraform, v* tags)

# cd.yml:
# - Deploy services to AWS ECS
# - Deploy web to Vercel
# - Deploy portals to S3 + CloudFront
# - Run Prisma migrations
# - Smoke test health endpoints
```

### 33.9 Step 8 — Verification Checklist

```bash
# 1. Infrastructure health
docker compose -f docker-compose.infra.yml ps  # All 4 services healthy
curl localhost:9200                              # Elasticsearch responding
redis-cli -h localhost ping                     # Redis PONG

# 2. Database setup
pnpm db:generate                                # Prisma clients generated
pnpm db:migrate                                 # Migrations applied
psql -U weddingos -l                            # 8 databases visible

# 3. Service health
pnpm dev                                        # Start all services
curl localhost:4001/auth/health                 # Auth service up
curl localhost:4002/health                      # User service up
# ... repeat for all 12 services

# 4. Frontend
open http://localhost:3000                      # Web app loads
open http://localhost:3001                      # Vendor portal loads
open http://localhost:3002                      # Admin dashboard loads

# 5. Tests
pnpm test                                       # All ~343 tests pass

# 6. Build
pnpm build                                      # All packages compile
```

---

## 34. Troubleshooting & Debugging

### 34.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` on service start | Database not running | `docker compose -f docker-compose.infra.yml up -d` |
| Prisma client not found | Client not generated | `pnpm db:generate` in service directory |
| JWT verification fails | Missing/wrong key path | Ensure `keys/private.pem` and `keys/public.pem` exist |
| `MODULE_NOT_FOUND` for shared packages | Packages not built | `pnpm build --filter=shared-*` |
| Port already in use | Another process on same port | `lsof -ti:PORT \| xargs kill` |
| Elasticsearch connection refused | ES not started or needs time | Wait 30s after `docker compose up`, check `curl localhost:9200` |
| MongoDB auth failure | Wrong credentials | Match MONGODB_URL credentials with docker-compose env vars |
| Redis connection timeout | Password mismatch | Check REDIS_URL includes password matching docker-compose |
| `P2025` error in booking-service | Optimistic locking conflict | Retry the operation (concurrent update detected) |
| CORS errors in browser | Origin not in allowed list | Add your frontend URL to `ALLOWED_ORIGINS` in `.env` |
| OTP not received | MSG91 not configured | Set `MSG91_AUTH_KEY` in .env, or use demo login buttons |

### 34.2 Debugging Commands

```bash
# ── Logs ──
# Service logs (dev mode)
pnpm dev --filter=auth-service 2>&1 | npx pino-pretty

# Docker container logs
docker compose -f docker-compose.dev.yml logs -f auth-service

# ── Database Inspection ──
# Open Prisma Studio (visual DB browser)
cd services/booking-service && npx prisma studio

# Direct PostgreSQL access
docker exec -it weddingos-postgres psql -U weddingos -d weddingos_bookings

# Direct MongoDB access
docker exec -it weddingos-mongodb mongosh -u weddingos -p mongo_dev_password weddingos_chat

# Direct Redis access
docker exec -it weddingos-redis redis-cli

# ── Elasticsearch ──
# Check cluster health
curl localhost:9200/_cluster/health?pretty

# List all indexes
curl localhost:9200/_cat/indices?v

# Search vendors index
curl "localhost:9200/vendors/_search?pretty" -H 'Content-Type: application/json' -d '{"query":{"match_all":{}}}'

# ── Network ──
# Test service connectivity
curl -v localhost:4001/auth/health
curl -v localhost:8000/api/v1/auth/health  # Via Kong

# Check what's running on a port
lsof -i :4001

# ── Dev Tools ──
# Redis Commander UI
open http://localhost:8081

# Kibana (Elasticsearch UI)
open http://localhost:5601
```

### 34.3 Environment-Specific Notes

**macOS (Apple Silicon):**
- Elasticsearch 8.13 Docker image is `linux/amd64` only — runs under Rosetta emulation (slower)
- Flutter iOS simulator: `flutter run -d "iPhone 15"`

**Linux:**
- Docker may require `sudo` — add user to docker group: `sudo usermod -aG docker $USER`
- Elasticsearch requires `vm.max_map_count=262144`: `sudo sysctl -w vm.max_map_count=262144`

**Windows (WSL2):**
- Run all commands inside WSL2 Ubuntu
- Docker Desktop with WSL2 backend recommended
- Flutter Android: use Android Studio emulator from Windows side

---

## 35. Architectural Decision Records

Key decisions made during the design and implementation of WeddingOS, with rationale.

### ADR-1: Microservices over Monolith

**Decision:** Split into 12 independent microservices instead of a single monolithic application.

**Rationale:**
- Independent deployment and scaling per domain (booking may need more resources than media)
- Clear domain boundaries enforce separation of concerns
- Team can work on different services simultaneously
- Each service can choose its own database (PostgreSQL, MongoDB, Elasticsearch)

**Trade-offs:** Higher operational complexity, network latency for inter-service calls, eventual consistency challenges.

### ADR-2: Database per Service

**Decision:** Each service has its own PostgreSQL database (8 total), plus MongoDB for chat and Elasticsearch for search.

**Rationale:**
- Services can evolve schemas independently
- No cross-service table joins (prevents tight coupling)
- Each service owns its data exclusively
- Chat messages are document-shaped (MongoDB natural fit)
- Search requires full-text indexing (Elasticsearch natural fit)

### ADR-3: Event-Driven Architecture via Redis Pub/Sub

**Decision:** Use Redis pub/sub for asynchronous inter-service communication instead of synchronous HTTP calls.

**Rationale:**
- Non-blocking: booking confirmation doesn't wait for notification delivery
- Decoupled: adding a new subscriber doesn't require changing the publisher
- Redis already in the stack for caching — no additional infrastructure
- Simple to implement and debug compared to Kafka/RabbitMQ at current scale

**Trade-offs:** At-most-once delivery (messages can be lost if subscriber is down), no message persistence.

### ADR-4: RS256 JWT (Asymmetric)

**Decision:** Use RS256 (RSA) instead of HS256 (HMAC) for JWT signing.

**Rationale:**
- Only auth-service needs the private key (signing)
- All other services only need the public key (verification)
- Public key can be freely distributed without security risk
- Enables future support for key rotation and JWKS endpoints

### ADR-5: OTP-Only Authentication (No Passwords)

**Decision:** Use phone-based OTP authentication exclusively, with no password support.

**Rationale:**
- Standard practice for Indian marketplace apps
- Eliminates password storage, hashing, and breach risks
- Simpler UX — no "forgot password" flow needed
- Phone numbers are verified at registration

### ADR-6: Escrow Payment Model

**Decision:** All payments go through an escrow hold before release to vendors.

**Rationale:**
- Builds customer trust — money is protected until event completion
- Vendor is guaranteed payment after event
- Platform earns commission on each transaction
- Dispute resolution possible before fund release

**Implementation:** 7-day auto-release after event date, manual admin override available.

### ADR-7: Paise for All Monetary Values

**Decision:** Store all monetary amounts in paise (1 INR = 100 paise) as integers.

**Rationale:**
- Avoids floating-point precision errors
- Razorpay API expects amounts in paise
- Integer arithmetic is precise and fast
- Display conversion: `paiseToRupees()` from shared-utils

### ADR-8: Prisma ORM with Service-Specific Schemas

**Decision:** Use Prisma instead of raw SQL or other ORMs (TypeORM, Sequelize).

**Rationale:**
- Type-safe database access with auto-generated TypeScript types
- Schema-first approach (schema.prisma is source of truth)
- Built-in migration system (`prisma migrate`)
- Visual database browser (`prisma studio`)
- First-class PostgreSQL support with enum types

### ADR-9: Flutter for Mobile (Cross-Platform)

**Decision:** Use Flutter instead of React Native or native development.

**Rationale:**
- Single codebase for iOS, Android, and web preview
- Superior UI performance and consistency
- Riverpod provides compile-safe state management
- Strong widget ecosystem for Material Design 3
- Hot reload for rapid development

### ADR-10: Turborepo + pnpm for Monorepo

**Decision:** Use Turborepo with pnpm workspaces for the monorepo.

**Rationale:**
- pnpm's strict dependency resolution prevents phantom dependencies
- Turborepo provides incremental builds with caching
- Task pipeline ensures build order (shared packages before services)
- Remote caching for CI/CD speed optimization
- Single `pnpm install` sets up entire project

### ADR-11: Kong API Gateway (DB-less Mode)

**Decision:** Use Kong in declarative (DB-less) mode as the API gateway.

**Rationale:**
- Single entry point for all client requests
- Built-in rate limiting, CORS, and request size limits
- Declarative configuration in YAML (version-controlled)
- No database dependency (simpler deployment)
- Easy to extend with plugins (authentication, logging, etc.)

### ADR-12: S3 Presigned URLs for File Uploads

**Decision:** Client uploads files directly to S3 via presigned URLs, not through backend services.

**Rationale:**
- Reduces backend bandwidth and compute (no file proxying)
- Scales independently of application servers
- Supports large file uploads without server memory pressure
- Presigned URLs have time-limited access (1 hour)

---

## License

Proprietary — All rights reserved.
