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

## License

Proprietary — All rights reserved.
