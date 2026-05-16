# WeddingOS — End-to-End Execution Plan

> Master execution blueprint covering Web, Mobile (Flutter), Backend, and Infrastructure.  
> Last updated: Session 6 — 2026-05-16

---

## Session 6 — Deep Audit: Gaps, Issues, Improvements & Implementation

### 🔍 Comprehensive Audit Findings

Full analysis across all 12 backend services, 4 shared packages, 4 frontend apps, and infrastructure.

---

### 📊 Current State Dashboard

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Shared-errors in service logic | 4/11 (auth, booking, payment, search) | 11/11 | 7 services |
| Shared-errors in errorHandler | 11/11 | 11/11 | ✅ Done |
| Shared-utils adoption | 3/11 (auth, booking, payment) | 11/11 | 8 services |
| Shared-types adoption | 0/11 | 11/11 | 11 services |
| Real unit tests | 6/11 (auth, booking, payment, review, user, vendor) | 11/11 | 5 services |
| Placeholder tests remaining | 5 (chat, execution, media, notification, search) | 0 | 5 services |
| Zod route validation | 7/11 | 11/11 | 4 services (review, notification, chat, media) |
| `as any` type casts | 26 instances across 10 files | 0 | 26 instances |
| Event bus wired | 10/11 (all except media) | 11/11 | 1 service |
| Frontend API integration | ~20% (heavy mock data) | 100% | 80% remaining |
| Code quality (estimated) | 5.5/10 | 8.0/10 | +2.5 points |

---

### 🚨 Critical Issues Found

#### 1. Shared Packages — Massively Under-Utilized

**shared-types (0% adoption)**
- 38 types exported (User, Vendor, Booking, Payment, JwtPayload, etc.)
- ZERO imports across all 11 services and 4 apps
- Services define their own inline types or use `as any`

**shared-errors — Only 4/11 services use in business logic**
- ✅ Used in service files: auth, booking, payment (throw specific errors)
- ❌ errorHandler-only: user, vendor, review, execution, notification, chat, media, search
- These 7 services still throw plain `Error` objects with manual statusCode

**shared-utils — Only 3/11 services**
- ✅ auth (generateOtp, hashSha256, safeCompare), booking (generateBookingNumber), payment (calculatePlatformFee)
- ❌ 8 services don't import any utilities
- Unused exports: rupeesToPaise, paiseToRupees, formatINR, addDays, daysBetween, isWeekend, formatDate, isPeakSeason, slugify, maskPhone, isValidIndianPhone, isValidGST, isValidPAN, isValidIFSC, encodeCursor, decodeCursor

**shared-events — Event bus wired but underused**
- 46 event types defined, Redis pub/sub bus implemented
- 10/11 services have createEventBus() in server.ts
- But most services don't actively publish or subscribe to events

#### 2. Test Coverage Gaps

| Service | Test Status | Test Lines | Quality |
|---------|------------|------------|---------|
| auth-service | ✅ Real | 127 lines | OTP + JWT tests |
| booking-service | ✅ Real | 370 lines | 19 tests, full lifecycle |
| payment-service | ✅ Real | 297 lines | 13 tests, escrow flow |
| review-service | ✅ Real | 201 lines | CRUD + ratings |
| user-service | ✅ Real | 250 lines | Profile + KYC |
| vendor-service | ✅ Real | 251 lines | CRUD + ES sync |
| chat-service | ❌ Placeholder | 5 lines | `expect(true).toBe(true)` |
| execution-service | ❌ Placeholder | 5 lines | `expect(true).toBe(true)` |
| media-service | ❌ Placeholder | 5 lines | `expect(true).toBe(true)` |
| notification-service | ❌ Placeholder | 5 lines | `expect(true).toBe(true)` |
| search-service | ❌ Placeholder | 5 lines | `expect(true).toBe(true)` |

#### 3. Type Safety — 26 `as any` Casts

| Service | Count | Locations |
|---------|-------|-----------|
| vendor-service | 6 | auth.middleware, server.ts, vendor.service (×3), search.service |
| booking-service | 4 | booking.service (eventType, statusMap, status ×2) |
| execution-service | 4 | auth.middleware, timeline.service (category ×2, status) |
| search-service | 3 | search.service (hits.total, aggregations ×2) |
| payment-service | 3 | payment.service (rzp.orders, rzp.refund), auth.middleware |
| notification-service | 2 | auth.middleware, fcm.ts |
| user-service | 2 | auth.middleware, profile.service |
| review-service | 1 | auth.ts (middleware) |
| chat-service | 1 | jwt.ts |

#### 4. Missing Route Validation

| Service | Validation Status | Notes |
|---------|------------------|-------|
| review-service | ❌ No validation | Routes access req.body directly, no Zod schemas |
| notification-service | ❌ No validation | Manual typeof checks, no structured validation |
| chat-service | ❌ No validation | Basic manual checks only |
| media-service | ⚠️ Partial | Hardcoded validTypes array, no Zod |

#### 5. Frontend — Heavy Mock Data Dependency

**apps/web (Customer Portal)**
- 19 routes implemented, but 8 pages use MOCK_DATA fallback
- Pattern: `.catch(() => setData(MOCK_DATA))` — all pages fallback to mocks
- Auth generates mock tokens: `demo_${role}_${Date.now()}`
- Missing: /chat (empty), /dashboard (empty), /profile (minimal)

**apps/admin (Admin Dashboard)**
- Only 4 pages (Login, Dashboard, Vendors, Bookings)
- 100% mock data — MOCK_STATS, MOCK_MONTHLY hardcoded
- Missing: User management, KYC approval, dispute resolution, analytics, settings

**apps/vendor-web (Vendor Portal)**
- 7 pages implemented, all with mock data
- Missing: Calendar/availability, package management, real-time notifications

**apps/mobile (Flutter)**
- Most complete frontend: 20+ screens, Riverpod state, Dio API client
- 1 TODO: vendor_analytics_provider.dart — "Replace with real API call"

#### 6. Missing Dependencies in package.json

| Service | Missing Dependency |
|---------|--------------------|
| user-service | `@wedding-os/shared-utils` |
| vendor-service | `@wedding-os/shared-utils` |
| review-service | `@wedding-os/shared-utils` |

#### 7. Infrastructure Gaps

- ❌ No database seed scripts for development
- ❌ No integration tests (E2E booking flow)
- ❌ No OpenAPI/Swagger documentation
- ❌ No health check endpoints standardized
- ❌ No centralized logging aggregation (no ELK/Loki)
- ❌ No performance monitoring (no OpenTelemetry/Prometheus)

---

### 🎯 Implementation Plan — Session 6

#### Phase 1: Real Unit Tests (5 services — HIGH PRIORITY)
Replace placeholder health.test.ts with real service-layer tests:

| Service | Test Target | Key Scenarios |
|---------|------------|---------------|
| chat-service | chat.handler.ts | Create room, send message, get messages, join room |
| execution-service | timeline.service.ts | Create timeline, add task, update task status, complete timeline |
| media-service | upload.service.ts | Upload file, validate type, generate presigned URL, delete file |
| notification-service | notification.service.ts | Send notification, mark read, get user notifications, preferences |
| search-service | search.service.ts | Search vendors, filter by category/city/price, pagination, aggregations |

#### Phase 2: Zod Route Validation (4 services)
Add structured Zod validation schemas to:
- **review-service**: CreateReviewSchema, GetReviewsQuerySchema
- **notification-service**: GetNotificationsQuerySchema, MarkReadSchema
- **chat-service**: SendMessageSchema, CreateRoomSchema
- **media-service**: UploadParamsSchema with file type validation

#### Phase 3: Fix `as any` Type Casts (26 instances)
- Replace JWT `as any` with `JwtPayload` interface across all auth middlewares
- Fix Elasticsearch response typing in vendor-service and search-service
- Fix Prisma enum casts in booking-service and execution-service
- Fix Razorpay SDK typing in payment-service

#### Phase 4: Adopt shared-errors in Service Logic (7 services)
Services that only have shared-errors in errorHandler but not in business logic:
- user-service, vendor-service, review-service, execution-service, notification-service, chat-service, media-service
- Replace `throw Object.assign(new Error(...), { statusCode })` with specific error classes

#### Phase 5: Documentation & Metrics
- Update claude.md with completion metrics and next session plan

---

### ✅ Completed Improvements (Session 6)

_(Updated as work progresses)_

---

## Session 4 — Shared Package Adoption, Type Safety & Testing

### Audit Summary

Deep audit across all 12 backend services revealed critical gaps: shared packages (shared-errors, shared-types, shared-utils) were fully designed but **0% adopted**. Services used manual error objects, duplicated utility functions, and had placeholder tests. Code quality score: **3.7/10**.

### ✅ Completed Improvements (Session 4)

#### Phase 1-3: Shared-Errors Adoption (4 critical services)

**booking-service:**
- Replaced 6 `Object.assign(new Error(...))` throws with `NotFoundError`, `ForbiddenError`, `BookingAlreadyConfirmedError`, `BookingCancellationError`
- Replaced local `AuthError` class with shared `UnauthorizedError`, `TokenExpiredError`, `TokenInvalidError`
- Error handler upgraded to detect `AppError` instances with field/details propagation

**payment-service:**
- Replaced 5 manual error throws with `PaymentVerificationError`, `NotFoundError`, `ConflictError`
- Auth middleware uses shared error classes
- Error handler upgraded with `AppError` support

**auth-service:**
- OTP service: replaced 6 plain `throw { code: ... }` objects with `AccountLockedError`, `RateLimitedError`, `OtpExpiredError`, `OtpInvalidError`
- SMS failure now throws `AppError('SYS_9001', ...)` instead of plain object

**search-service:**
- Error handler upgraded with `AppError` support

#### Phase 4: Shared-Utils Adoption
- booking-service: removed local `generateBookingNumber()`, imports from `@wedding-os/shared-utils`

#### Phase 5-6: Type Safety Fixes

**search-service routes:**
- Replaced `req.query as any` with Zod `SearchQuerySchema` validation
- Added coerce/min/max/default for all query params (query, category, city, minPrice, maxPrice, minRating, sortBy, page, limit, featured)
- Replaced inline error responses with `next(err)` pattern

**booking-service routes:**
- Replaced `req.query as any` with typed extraction
- Replaced manual 404/403 JSON responses with thrown shared errors
- Fixed JWT payload typing from `as any` to proper interface

#### Phase 7: Error Handler Standardization
- All 4 critical services (booking, payment, auth, search) now use `instanceof AppError` check
- Legacy error object support maintained for backward compatibility

#### Phase 8-9: Real Unit Tests

**booking-service** — 19 tests replacing placeholder:
| Suite | Tests |
|-------|-------|
| `calculateFees` | Fee calculation + rounding (2) |
| `createEnquiry` | Creates ENQUIRY status booking (1) |
| `sendQuote` | NotFoundError + quote update (2) |
| `acceptQuote` | NotFoundError + ADVANCE_PENDING transition (2) |
| `confirmBooking` | BookingAlreadyConfirmedError + CONFIRMED transition (2) |
| `cancel` | NotFound, Forbidden (×2), non-cancellable, customer/vendor cancel (6) |
| `getCustomerBookings` | List + status filter (2) |
| `getVendorBookings` | List ordered by date (1) |
| `getBooking` | Fetch with events (1) |

**payment-service** — 13 tests replacing placeholder:
| Suite | Tests |
|-------|-------|
| `createOrder` | Razorpay order creation + idempotency (2) |
| `verifyAndCapture` | Invalid signature, not found, already captured, success with escrow (4) |
| `releaseEscrow` | Success + skip if processed (2) |
| `refund` | Not found, not captured, full refund flow (3) |
| `handleWebhook` | payment.captured + payment.failed (2) |

#### Phase 10: Root ESLint + Prettier Configuration
- Created `.eslintrc.json` with `@typescript-eslint/recommended`
- Created `.prettierrc.json` with project-wide formatting rules
- Created `.prettierignore` excluding dist/node_modules/mobile
- ESLint + Prettier already in root `package.json` devDependencies

### 📊 Session 4 Impact

| Metric | Before | After |
|--------|--------|-------|
| Services using shared-errors | 0/11 | 4/11 |
| Manual error objects removed | 0 | 17+ |
| `as any` casts fixed | 0 | 5+ |
| Real unit tests (booking+payment) | 0 | 32 |
| Shared-utils adoption | 0/11 | 1/11 |
| Root ESLint/Prettier | ❌ | ✅ |
| Code quality (estimated) | 3.7/10 | 5.5/10 |

### 🔄 Remaining Work (Future Sessions)

#### HIGH PRIORITY
1. **shared-errors adoption** — Remaining services: user, vendor, review, execution, notification, chat, media
2. **shared-utils adoption** — Use in payment-service (calculatePlatformFee), auth-service (generateOtp, hashSha256, safeCompare)
3. **Real unit tests** — Replace placeholder health.test.ts for: chat, execution, media, notification, search
4. **Integration tests** — End-to-end booking flow (auth → booking → payment → escrow)
5. **shared-types adoption** — Use interfaces in service code (JwtPayload, BookingStatus, etc.)
6. **API documentation** — OpenAPI/Swagger specs for all endpoints

#### MEDIUM PRIORITY
7. **Database seed scripts** — Development data for all services
8. **Auth middleware centralization** — Extract duplicated JWT verification to shared package
9. **API response standardization** — Shared response builders for success/error
10. **Security hardening** — Zod validation for all query/body params across all services

#### LOW PRIORITY
11. **Performance monitoring** — OpenTelemetry/Prometheus integration
12. **Security audit** — OWASP compliance review
13. **Mobile CI/CD** — Flutter build pipeline refinements
14. **Frontend tests** — Jest for Next.js web, Vitest for admin

---

## Session 3 — Issues, Gaps & Improvements Audit (Previous)

### ✅ Completed Improvements (Session 3)

#### Phase 1: Missing tsconfig.json
- Created `tsconfig.json` for: chat-service, media-service, review-service, search-service
- Created `tsconfig.json` for all 4 shared packages (shared-errors, shared-events, shared-types, shared-utils)

#### Phase 2: Missing Jest + Test Infrastructure
- Created `jest.config.js` for: booking-service, chat-service, execution-service, media-service, notification-service, payment-service, search-service
- Created `tests/unit/health.test.ts` placeholder tests for all 7 services
- Added jest/ts-jest devDependencies where missing

#### Phase 3: Missing Error Handler Middleware
- Created `src/middleware/errorHandler.ts` for: chat-service, media-service, search-service
- Wired error handler into server.ts for: chat-service, media-service, search-service

#### Phase 4: Missing npm Scripts
- Added `test` and `lint` scripts to: chat-service, execution-service, media-service, notification-service, search-service
- Added `lint` script to: review-service

#### Phase 5: Event Bus Wiring (10 of 11 Node services now connected)
- Wired event bus into: auth-service, chat-service, execution-service
- Added `@wedding-os/shared-events` dependency to all 3
- execution-service now subscribes to `booking.confirmed` and `booking.completed`

#### Phase 6: Kong API Gateway Configuration
- Created `infrastructure/kong/kong.yml` with declarative routing for all 12 services
- Global plugins: rate-limiting, CORS, request-size-limiting

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Current Status](#2-current-status)
3. [Web App — Remaining Work](#3-web-app--remaining-work)
4. [Flutter Mobile App — Build Plan](#4-flutter-mobile-app--build-plan)
5. [Backend Services — Integration Plan](#5-backend-services--integration-plan)
6. [Database & Migrations](#6-database--migrations)
7. [Infrastructure & DevOps](#7-infrastructure--devops)
8. [Sprint Breakdown](#8-sprint-breakdown)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Pipeline](#10-deployment-pipeline)
11. [Risk Register](#11-risk-register)
12. [Decision Log](#12-decision-log)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Next.js    │  │   Flutter    │  │   React (Admin)      │   │
│  │   Web App    │  │   iOS/AND    │  │   Vendor Portal      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │              │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Kong)                           │
│         Rate Limiting · Auth · Routing · CORS                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ auth-service │ │ user-service │ │vendor-service│
│   (Express)  │ │  (Express)   │ │  (Express)   │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│booking-svc   │ │payment-svc   │ │execution-svc │
│  (Express)   │ │  (Express)   │ │  (Express)    │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│notification  │ │  chat-svc    │ │  media-svc   │
│  (Express)   │ │  (Express)   │ │  (Express)    │
└──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ review-svc   │ │ search-svc   │ │  ai-service  │
│  (Express)   │ │  (Express)   │ │  (FastAPI)   │
└──────────────┘ └──────────────┘ └──────────────┘
         │                │                │
         ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │    Redis     │ │Elasticsearch │
│     16       │ │      7       │ │      8       │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Tech Stack Summary:**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Web (Customer) | Next.js 14 (App Router) + Tailwind | User-facing booking platform |
| Web (Admin) | React + Vite | Admin dashboard |
| Web (Vendor) | React + Vite | Vendor management portal |
| Mobile | Flutter 3.19 + Riverpod | iOS + Android customer app |
| API Gateway | Kong | Routing, rate-limiting, auth |
| Services | Express.js + TypeScript | 11 microservices |
| AI Service | FastAPI + Python | Recommendations, NLP |
| Database | PostgreSQL 16 + Prisma ORM | Primary data store |
| Cache | Redis 7 | Sessions, pub/sub, queues |
| Search | Elasticsearch 8 | Full-text vendor search |
| Payments | Razorpay | Escrow, UPI, cards |
| Storage | AWS S3 / Cloudflare R2 | Media uploads |
| CI/CD | GitHub Actions | Build, test, deploy |
| Infra | Terraform + Docker | IaC, containerization |

---

## 2. Current Status

### ✅ Completed
- [x] **Monorepo structure** — Turborepo + pnpm workspaces
- [x] **All 12 microservice scaffolds** — src/, routes, controllers, Prisma schemas
- [x] **Shared packages** — shared-types, shared-events, shared-errors, shared-utils, ui-kit
- [x] **Web app (Next.js)** — Full homepage, vendor listing, vendor detail, login (OTP), dashboard
- [x] **Web top navbar** — Conditional navigation (guest vs logged-in), Bookings/Wishlist/Profile links
- [x] **Web bottom navbar** — Mobile-responsive bottom tab bar (/, /vendors, /bookings, /wishlist, /profile)
- [x] **Web category browsing** — 10 wedding categories with image cards
- [x] **Web vendor detail pages** — Multi-vendor data, packages, reviews
- [x] **Web bug fixes** — Hydration error, timer leak, OTP resend, null guards, silent catch
- [x] **Web /bookings page** — Booking list with status tabs (All/Active/Pending/Completed), stats header
- [x] **Web /bookings/[id] page** — Escrow protection timeline, payment summary, activity log, actions
- [x] **Web /checkout/[vendorId] page** — Package selector, event details form, Razorpay integration
- [x] **Web /profile page** — Edit profile, wedding countdown, logout, menu links
- [x] **Web /wishlist page** — Saved vendors with category filters, remove action
- [x] **Flutter scaffold** — 11 files: main, theme, router, api_client, app_shell, 6 screens
- [x] **README.md** — 737-line master audit document with 9 Mermaid diagrams
- [x] **Prisma schemas** — auth, booking, payment, execution, notification, review services
- [x] **Docker configs** — Dockerfiles for auth, user, ai services
- [x] **Kong API gateway config** — Route definitions
- [x] **Terraform modules** — Staging + production configurations

### 🔄 In Progress
- [ ] Backend API implementation (routes return mock/placeholder data)
- [ ] Database migrations (schemas defined, not fully migrated)
- [ ] Inter-service communication (event bus)

### ❌ Not Started
- [ ] Real payment integration (Razorpay)
- [ ] Media upload pipeline (S3/R2)
- [ ] Elasticsearch indexing
- [ ] AI recommendation engine
- [ ] Push notifications
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Production deployment
- [ ] E2E and integration tests
- [ ] App Store / Play Store submission

---

## 3. Web App — Remaining Work

### 3.1 Pages to Build / Enhance

| Page | Priority | Status | Description |
|------|----------|--------|-------------|
| `/` Homepage | P0 | ✅ Done | Category cards, hero, trending |
| `/vendors` | P0 | ✅ Done | Filter by category, search, sort |
| `/vendors/[id]` | P0 | ✅ Done | Detail + packages + reviews |
| `/login` | P0 | ✅ Done | OTP flow with timer |
| `/dashboard` | P0 | ✅ Done | Category home, tasks, budget |
| `/bookings` | P1 | ✅ Done | User's booking list with status tabs + stats |
| `/bookings/[id]` | P1 | ✅ Done | Booking detail + escrow timeline + activity log |
| `/checkout/[vendorId]` | P1 | ✅ Done | Package selection + event details + Razorpay payment |
| `/profile` | P2 | ✅ Done | User settings, wedding countdown, menu |
| `/wishlist` | P2 | ✅ Done | Saved vendors with category filters |
| `/chat` | P2 | ❌ Build | Vendor messaging |
| `/reviews/write` | P3 | ❌ Build | Post-event review form |

### 3.2 Components to Build

| Component | Priority | Description |
|-----------|----------|-------------|
| `BookingCard` | P1 | Booking row with status badge |
| `EscrowTimeline` | P1 | Visual escrow milestone tracker |
| `PackageSelector` | P1 | Radio select with price breakdown |
| `PaymentForm` | P1 | Razorpay checkout wrapper |
| `ChatBubble` | P2 | Real-time message UI |
| `ReviewForm` | P3 | Star rating + text + photo upload |
| `WishlistButton` | P2 | Heart toggle with API call |

### 3.3 API Integration Checklist

```
[ ] GET  /api/v1/vendors         — Vendor listing (replace mock data)
[ ] GET  /api/v1/vendors/:id     — Vendor detail
[ ] POST /api/v1/auth/send-otp   — Send OTP
[ ] POST /api/v1/auth/verify-otp — Verify & get JWT
[ ] GET  /api/v1/bookings        — User bookings
[ ] POST /api/v1/bookings        — Create booking
[ ] GET  /api/v1/bookings/:id    — Booking detail
[ ] POST /api/v1/payments/escrow — Initiate escrow payment
[ ] GET  /api/v1/reviews/:vendorId — Vendor reviews
[ ] POST /api/v1/reviews         — Submit review
[ ] GET  /api/v1/users/me        — Current user profile
[ ] PUT  /api/v1/users/me        — Update profile
[ ] GET  /api/v1/search?q=       — Full-text search
```

---

## 4. Flutter Mobile App — Build Plan

### 4.1 Project Structure (Completed)

```
apps/mobile/
├── pubspec.yaml                          ✅
├── lib/
│   ├── main.dart                         ✅
│   ├── core/
│   │   ├── theme.dart                    ✅  Material 3, Playfair + Inter
│   │   ├── router.dart                   ✅  GoRouter + ShellRoute
│   │   └── api_client.dart               ✅  Dio + auth interceptors
│   ├── shared/
│   │   └── widgets/
│   │       └── app_shell.dart            ✅  Bottom nav scaffold
│   └── features/
│       ├── home/
│       │   └── home_screen.dart          ✅  Category cards + trending
│       ├── vendors/
│       │   ├── vendors_screen.dart       ✅  Listing + filters + search
│       │   └── vendor_detail_screen.dart ✅  Hero + packages + reviews
│       ├── auth/
│       │   └── login_screen.dart         ✅  OTP flow + trust badges
│       ├── bookings/
│       │   └── bookings_screen.dart      ✅  Tab view + status cards
│       └── profile/
│           └── profile_screen.dart       ✅  Stats + menu + logout
```

### 4.2 Next Steps for Flutter

| Task | Priority | Description |
|------|----------|-------------|
| **State Management** | P0 | Add Riverpod providers for auth, vendors, bookings |
| **API Integration** | P0 | Connect screens to real backend via api_client.dart |
| **Secure Storage** | P0 | JWT token persist + biometric auth |
| **Offline Mode** | P1 | Hive local cache for vendors, bookings |
| **Push Notifications** | P1 | FCM setup for booking updates |
| **Image Caching** | P1 | Already configured via cached_network_image |
| **Deep Linking** | P2 | Vendor share links → app routing |
| **Analytics** | P2 | Firebase Analytics integration |
| **Crashlytics** | P2 | Firebase Crashlytics for error tracking |
| **App Icons + Splash** | P2 | Branded launch assets |
| **Localization** | P3 | Hindi, Telugu, Tamil, Kannada |
| **Dark Mode** | P3 | AppTheme.dark support |

### 4.3 Riverpod Providers to Create

```dart
// providers/auth_provider.dart
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => ...);

// providers/vendors_provider.dart
final vendorListProvider = FutureProvider.family<List<Vendor>, VendorFilter>((ref, filter) => ...);
final vendorDetailProvider = FutureProvider.family<VendorDetail, String>((ref, id) => ...);

// providers/bookings_provider.dart
final bookingsProvider = FutureProvider<List<Booking>>((ref) => ...);

// providers/user_provider.dart
final userProfileProvider = FutureProvider<UserProfile>((ref) => ...);
```

### 4.4 Build & Release

```bash
# Development
flutter pub get
flutter run -d chrome             # Web preview
flutter run -d emulator-5554      # Android emulator
flutter run -d iPhone-15          # iOS simulator

# Build APK (Android)
flutter build apk --release --split-per-abi

# Build AAB (Play Store)
flutter build appbundle --release

# Build iOS
flutter build ipa --release

# Run tests
flutter test
flutter test --coverage
```

---

## 5. Backend Services — Integration Plan

### 5.1 Service Priority Matrix

| Service | Priority | Key Endpoints | Dependencies |
|---------|----------|---------------|-------------|
| **auth-service** | P0 | POST /send-otp, POST /verify-otp, POST /refresh | Redis (OTP store) |
| **user-service** | P0 | GET /me, PUT /me, GET /:id | auth-service |
| **vendor-service** | P0 | CRUD vendors, GET /search | Elasticsearch |
| **booking-service** | P0 | CRUD bookings, status machine | payment, notification |
| **payment-service** | P0 | Escrow create/release/refund | Razorpay, booking |
| **review-service** | P1 | CRUD reviews, aggregate ratings | vendor-service |
| **notification-service** | P1 | Push, SMS, email triggers | FCM, Twilio, SES |
| **search-service** | P1 | Full-text vendor search | Elasticsearch |
| **chat-service** | P2 | WebSocket messaging | Redis pub/sub |
| **media-service** | P2 | Upload, resize, CDN URL | S3/R2 |
| **execution-service** | P2 | Wedding day timeline engine | booking, notification |
| **ai-service** | P3 | Vendor recommendations, NLP | Python ML models |

### 5.2 Inter-Service Events (Event Bus)

```
booking.created        → notification-service (SMS + push to vendor)
booking.confirmed      → payment-service (create escrow)
payment.escrowed       → booking-service (update status)
payment.released       → vendor-service (credit vendor)
review.submitted       → vendor-service (recalculate rating)
vendor.approved        → search-service (index in ES)
execution.milestone    → notification-service (remind couple)
```

### 5.3 Shared Packages

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `shared-types` | TypeScript interfaces | User, Vendor, Booking, Payment types |
| `shared-events` | Event definitions | Event names, payloads, bus helpers |
| `shared-errors` | Error classes | AppError, ValidationError, NotFoundError |
| `shared-utils` | Common utilities | Logger, validators, date helpers |
| `ui-kit` | Design system | Buttons, Cards, Inputs, Modals |

---

## 6. Database & Migrations

### 6.1 Schema Overview

```
auth_service_db
├── users (id, phone, email, role, verified_at)
├── otps (id, phone, code, expires_at, attempts)
└── refresh_tokens (id, user_id, token, expires_at)

booking_service_db
├── bookings (id, user_id, vendor_id, package_id, date, status, amount)
├── booking_items (id, booking_id, item_name, quantity, price)
└── booking_status_log (id, booking_id, from_status, to_status, changed_at)

payment_service_db
├── escrows (id, booking_id, amount, status, razorpay_order_id)
├── transactions (id, escrow_id, type, amount, status, gateway_ref)
└── refunds (id, transaction_id, amount, reason, status)

vendor_service_db
├── vendors (id, user_id, business_name, category, city, verified)
├── packages (id, vendor_id, name, description, price, includes)
└── portfolio_items (id, vendor_id, media_url, type)

review_service_db
├── reviews (id, user_id, vendor_id, booking_id, rating, text)
└── review_media (id, review_id, media_url)

notification_service_db
├── notifications (id, user_id, type, title, body, read_at)
└── notification_preferences (id, user_id, channel, enabled)
```

### 6.2 Migration Commands

```bash
# Generate Prisma client
cd services/auth-service && npx prisma generate
cd services/booking-service && npx prisma generate
cd services/payment-service && npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed data
npx prisma db seed
# OR
psql -f scripts/seed/init.sql
```

---

## 7. Infrastructure & DevOps

### 7.1 Docker Compose (Development)

```bash
# Start all infrastructure
docker compose -f docker-compose.infra.yml up -d
# → PostgreSQL 16 on :5432
# → Redis 7 on :6379
# → Elasticsearch 8 on :9200

# Start all services
docker compose -f docker-compose.dev.yml up -d
```

### 7.2 Terraform Modules

```
infrastructure/terraform/
├── modules/
│   ├── networking/     — VPC, subnets, security groups
│   ├── database/       — RDS PostgreSQL, ElastiCache Redis
│   ├── compute/        — ECS Fargate task definitions
│   ├── storage/        — S3 buckets for media
│   └── monitoring/     — CloudWatch, alerts
├── staging/
│   └── main.tf         — Staging environment
└── production/
    └── main.tf         — Production environment
```

### 7.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:        # ESLint + Prettier
  type-check:  # tsc --noEmit
  test:        # Jest unit + integration
  build:       # turbo run build
  docker:      # Build + push images
  deploy:      # Terraform apply (staging on merge to develop, prod on release tag)
```

---

## 8. Sprint Breakdown

### Sprint 1 (Current) — Core Booking + Payment Lifecycle ✅ Defined
- Booking service CRUD with status machine
- Payment service with Razorpay escrow
- Web checkout page
- E2E booking flow test

### Sprint 2 — Frontend + API Integration ✅ Done
- Connect web app to real backend APIs (next.config.js rewrites to microservices)
- Auth flow (OTP → JWT → protected routes)
- All web pages implemented: /bookings, /bookings/[id], /checkout, /profile, /wishlist
- Bottom nav updated with correct routes

### Sprint 3 — Execution Engine + Notifications
- Execution service (wedding day timeline)
- Notification service (SMS, push, email)
- Real-time booking status updates
- Admin notification dashboard

### Sprint 4 — AI + Search + KYC
- Elasticsearch vendor indexing
- Full-text search with filters
- AI recommendation engine
- Vendor KYC verification flow

### Sprint 5 — Testing + CI/CD + Infrastructure
- Unit tests (>80% coverage)
- Integration tests for each service
- E2E tests (Cypress/Playwright)
- GitHub Actions pipeline
- Docker image optimization

### Sprint 6 — Flutter Mobile App
- Connect Flutter to backend APIs
- Riverpod state management
- Push notifications (FCM)
- Offline mode (Hive)
- App Store / Play Store prep

### Sprint 7 — Docs + Security + Polish
- API documentation (OpenAPI/Swagger)
- Security audit (OWASP Top 10)
- Performance optimization
- Monitoring + alerting
- Launch checklist

---

## 9. Testing Strategy

| Type | Tool | Coverage Target | Scope |
|------|------|----------------|-------|
| Unit | Jest (TS), pytest (Python) | 80% | Service logic, utils |
| Integration | Jest + Supertest | 70% | API endpoints |
| E2E (Web) | Playwright | Critical paths | Login → Book → Pay |
| E2E (Mobile) | Flutter integration_test | Critical paths | Login → Browse → Book |
| Load | k6 | 1000 RPS | API gateway + services |
| Security | OWASP ZAP | No critical/high | All endpoints |

### Key Test Scenarios

```
1. User Registration & Login
   - Send OTP → Verify OTP → Get JWT → Access protected route
   
2. Vendor Discovery
   - Browse categories → Filter by city → Sort by rating → View detail

3. Booking Lifecycle
   - Select package → Create booking → Pay (escrow) → Vendor confirms
   → Event completes → Release escrow → Submit review

4. Payment Edge Cases
   - Payment failure → Retry → Success
   - Refund request → Admin approval → Refund processed
   - Escrow timeout → Auto-release / dispute

5. Real-time Features
   - Chat message sent → Received in real-time
   - Booking status change → Push notification delivered
```

---

## 10. Deployment Pipeline

```
Feature Branch → PR → CI Checks → Merge to develop
                                        │
                                        ▼
                                  Staging Deploy
                                  (auto on merge)
                                        │
                                   QA Validation
                                        │
                                        ▼
                                  Release Tag
                                        │
                                        ▼
                                Production Deploy
                                  (manual approval)
```

### Environment URLs

| Environment | Web | API | Admin |
|-------------|-----|-----|-------|
| Development | localhost:3000 | localhost:8000 | localhost:3001 |
| Staging | staging.weddingos.in | api-staging.weddingos.in | admin-staging.weddingos.in |
| Production | www.weddingos.in | api.weddingos.in | admin.weddingos.in |

---

## 11. Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Razorpay escrow API changes | High | Low | Abstract payment gateway behind adapter pattern |
| High vendor image volume | Medium | High | CDN + WebP auto-conversion + lazy loading |
| OTP delivery failures | High | Medium | Multi-provider fallback (Twilio + MSG91) |
| Elasticsearch cluster issues | Medium | Low | Fallback to PostgreSQL full-text search |
| Flutter build issues cross-platform | Medium | Medium | CI matrix builds + device farm testing |
| Data migration errors | High | Low | Prisma migration rollback scripts + staging validation |

---

## 12. Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| Session 1 | Use Flutter for mobile | Cross-platform (iOS + Android) from single codebase, strong UI toolkit, Dart performance | ✅ Implemented |
| Session 1 | Use Riverpod for state | Compile-safe, testable, better than Provider for complex state | ✅ Scaffolded |
| Session 1 | Use GoRouter for navigation | Declarative routing, deep link support, ShellRoute for bottom nav | ✅ Implemented |
| Session 1 | Use Dio for HTTP | Interceptors for auth, request/response logging, cancel tokens | ✅ Implemented |
| Session 1 | OTP-based auth (no passwords) | Simpler UX, common in India, reduces password storage risk | ✅ Implemented |
| Session 1 | Escrow payment model | Builds trust — couples pay only when satisfied | Designed |
| Session 1 | Turborepo for monorepo | Incremental builds, remote caching, task dependencies | ✅ Active |
| Session 1 | 12 microservices architecture | Separation of concerns, independent scaling, team ownership | ✅ Scaffolded |

---

## Quick Reference — Common Commands

```bash
# ━━━ Development ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pnpm install                      # Install all dependencies
pnpm dev                          # Start all apps (turbo)
pnpm dev --filter=web             # Start only web app
pnpm dev --filter=auth-service    # Start only auth service
pnpm build                        # Build all packages
pnpm lint                         # Lint everything
pnpm test                         # Run all tests

# ━━━ Database ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker compose -f docker-compose.infra.yml up -d   # Start DB + Redis + ES
npx prisma studio                                   # Visual DB browser
npx prisma migrate dev                              # Run pending migrations
npx prisma db seed                                  # Seed test data

# ━━━ Flutter ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd apps/mobile
flutter pub get                   # Install dependencies
flutter run                       # Run on connected device
flutter build apk --release       # Build Android release
flutter build ipa --release       # Build iOS release
flutter test                      # Run tests

# ━━━ Docker ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker compose -f docker-compose.dev.yml up --build  # Build & start all services
docker compose logs -f auth-service                   # Tail service logs

# ━━━ Infrastructure ━━━━━━━━━━━━━━━━━━━━━━━━━━
cd infrastructure/terraform/staging
terraform init
terraform plan
terraform apply
```

---

*This plan is a living document. Update it as decisions are made and work progresses.*
