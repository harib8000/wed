# WeddingOS — Deep Codebase Analysis & Fix Checklist

> Generated: 2026-05-09 | Full end-to-end analysis of Web, Mobile, Backend services

---

## 🔴 CRITICAL — Will Cause Runtime Errors / Broken Features

### Web App (Next.js)

- [ ] **W-01** Cancel Booking button has no `onClick` handler — button renders but does nothing
  - File: `apps/web/src/app/bookings/[id]/page.tsx:338`
- [ ] **W-02** "Message Vendor" links to `/chat?vendorId=...` but `/chat` page doesn't exist (404)
  - File: `apps/web/src/app/bookings/[id]/page.tsx:331`
  - File: `apps/web/src/app/profile/page.tsx:28` (menu item)
- [ ] **W-03** Profile camera upload button has no `onClick` handler — button renders but does nothing
  - File: `apps/web/src/app/profile/page.tsx:104`
- [ ] **W-04** `searchParams` declared but never used in checkout page (bookingId/amount from query ignored)
  - File: `apps/web/src/app/checkout/[vendorId]/page.tsx:122`
- [ ] **W-05** Wishlist heart button in FeaturedVendors only toggles local state, never calls API
  - File: `apps/web/src/components/home/FeaturedVendors.tsx:50-55`

### Backend Services

- [ ] **B-01** review-service uses `crypto.randomUUID()` without importing `crypto` — crashes on first request
  - File: `services/review-service/src/middleware/errorHandler.ts:14`
- [ ] **B-02** Six services missing `typecheck` script in package.json (can't validate TS in CI)
  - Files: review-service, notification-service, search-service, chat-service, media-service, execution-service

### Flutter Mobile App

- [ ] **M-01** Incorrect Riverpod state update — `state.whenData()` used as statement instead of assignment
  - File: `apps/mobile/lib/providers/booking_provider.dart:31`
- [ ] **M-02** Same incorrect state pattern in notifications
  - File: `apps/mobile/lib/features/notifications/notifications_screen.dart:67-78`
- [ ] **M-03** FCM token registration hardcodes platform as `'android'` — iOS users registered incorrectly
  - File: `apps/mobile/lib/core/api_client.dart:72`

---

## 🟡 MEDIUM — Incomplete / Dead Features

### Web App

- [ ] **W-06** Footer has 16+ dead links (`href="#"`) — social media, company, vendor links go nowhere
  - File: `apps/web/src/components/layout/Footer.tsx:22,34,44,54`
- [ ] **W-07** Profile page "Privacy Policy" and "Terms" links use `href="#"`
  - File: `apps/web/src/app/profile/page.tsx:250`
- [ ] **W-08** Navbar links to `/pricing` page that doesn't exist
  - File: `apps/web/src/components/layout/Navbar.tsx:131`
- [ ] **W-09** Login page links to `/terms` and `/privacy` pages that don't exist
  - File: `apps/web/src/app/login/page.tsx:140-141`
- [ ] **W-10** CTA links to `/vendor/register` page that doesn't exist
  - File: `apps/web/src/components/home/CTASection.tsx:42`
- [ ] **W-11** Profile menu: Notifications, Privacy & Security, My Reviews links point to `#` (non-functional)
  - File: `apps/web/src/app/profile/page.tsx:29-31`
- [ ] **W-12** Payment method selector (UPI/Card/NetBanking) is decorative — payment hardcoded to Razorpay
  - File: `apps/web/src/app/checkout/[vendorId]/page.tsx:128`

### Flutter Mobile App

- [ ] **M-04** Old `Navigator.of(context).push(MaterialPageRoute(...))` instead of GoRouter
  - File: `apps/mobile/lib/features/vendors/vendor_detail_screen.dart:56`
- [ ] **M-05** `Navigator.pop()` in wishlist AlertDialog instead of GoRouter
  - File: `apps/mobile/lib/features/wishlist/wishlist_screen.dart:54,58`
- [ ] **M-06** Checkout has hardcoded defaults: city='Hyderabad', guests='300'
  - File: `apps/mobile/lib/features/bookings/checkout_screen.dart:36-37`
- [ ] **M-07** Magic numbers in checkout (0.3 = 30% advance, 0.118 = 11.8% platform fee) — undocumented
  - File: `apps/mobile/lib/features/bookings/checkout_screen.dart:51-52`

---

## 🟢 LOW — Code Quality / Best Practices

### Backend Services

- [ ] **B-03** Shared packages (`shared-errors`, `shared-types`) exist but are NOT imported by most services — services reinvent error classes locally
- [ ] **B-04** Inconsistent database connection patterns across services (singleton vs direct instantiation)
- [ ] **B-05** Inconsistent environment variable validation (some use Zod, some don't)

### Web App

- [ ] **W-13** Multiple `as any` type assertions (login, profile, checkout pages)
- [ ] **W-14** Hardcoded localhost URLs in `next.config.js` — will break in production

---

## Implementation Priority

1. **Phase 1 (Critical Fixes):** W-01 through W-05, B-01, B-02, M-01 through M-03
2. **Phase 2 (Dead Links & UX):** W-06 through W-12, M-04 through M-07
3. **Phase 3 (Code Quality):** B-03 through B-05, W-13 through W-14
