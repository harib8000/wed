# WeddingOS — Deep Codebase Analysis & Fix Checklist

> Generated: 2026-05-09 | Full end-to-end analysis of Web, Mobile, Backend, Admin, Infrastructure

---

## 🔴 CRITICAL — Will Cause Runtime Errors / Broken Features

### Web App (Next.js)

- [ ] **W-01** Cancel Booking button has no `onClick` handler — button renders but does nothing
  - File: `apps/web/src/app/bookings/[id]/page.tsx:338`
  - Fix: Add onClick with confirm dialog + bookingApi.cancel() + toast
- [ ] **W-02** "Message Vendor" links to `/chat?vendorId=...` but `/chat` page doesn't exist (404)
  - File: `apps/web/src/app/bookings/[id]/page.tsx:331`
  - File: `apps/web/src/app/profile/page.tsx:28`
  - Fix: Create `/app/chat/page.tsx` with vendor messaging UI
- [ ] **W-03** Profile camera upload button has no `onClick` handler — does nothing
  - File: `apps/web/src/app/profile/page.tsx:104`
  - Fix: Add file input ref + onClick to trigger file picker + toast
- [ ] **W-04** `searchParams` declared but never used in checkout page
  - File: `apps/web/src/app/checkout/[vendorId]/page.tsx:122`
  - Fix: Use searchParams to pre-select package or show booking reference
- [ ] **W-05** Wishlist heart in FeaturedVendors only toggles local state, never notifies user
  - File: `apps/web/src/components/home/FeaturedVendors.tsx:50-55`
  - Fix: Add toast feedback on heart toggle

### Backend Services

- [ ] **B-01** review-service `requestId()` uses `crypto.randomUUID()` without importing `crypto`
  - File: `services/review-service/src/middleware/errorHandler.ts:14`
  - Fix: Add `import crypto from 'crypto';` at top
- [ ] **B-02** Six services missing `typecheck` script in package.json
  - Files: review-service, notification-service, search-service, chat-service, media-service, execution-service
  - Fix: Add `"typecheck": "tsc --noEmit"` to scripts

### Admin App

- [ ] **A-01** Admin App.tsx imports `Users` page that doesn't exist — crashes at route
  - File: `apps/admin/src/App.tsx:7` → `apps/admin/src/pages/Users.tsx` missing
  - Fix: Create Users page scaffold
- [ ] **A-02** Admin App.tsx imports `Payments` page that doesn't exist — crashes at route
  - File: `apps/admin/src/App.tsx:8` → `apps/admin/src/pages/Payments.tsx` missing
  - Fix: Create Payments page scaffold

### Flutter Mobile App

- [ ] **M-01** Incorrect Riverpod state update — `state.whenData()` used as statement not assignment
  - File: `apps/mobile/lib/providers/booking_provider.dart:31`
  - Fix: Use `state = AsyncValue.data([booking, ...(state.value ?? [])])`
- [ ] **M-02** Same incorrect state pattern in notifications markRead/markAllRead
  - File: `apps/mobile/lib/features/notifications/notifications_screen.dart:67-78`
  - Fix: Use `state.value` or `state.valueOrNull` pattern
- [ ] **M-03** FCM token registration hardcodes platform as `'android'`
  - File: `apps/mobile/lib/core/api_client.dart:72`
  - Fix: Use `Platform.isAndroid ? 'android' : 'ios'`
- [ ] **M-04** RefreshIndicator on bookings list has empty `onRefresh: () async {}`
  - File: `apps/mobile/lib/features/bookings/bookings_screen.dart:118`
  - Fix: Call `ref.read(bookingsProvider.notifier).load()`
- [ ] **M-05** Chat poll timer started but never cancelled — resource leak
  - File: `apps/mobile/lib/features/chat/chat_screen.dart:77`
  - Fix: Cancel timer in dispose/close method

---

## 🟡 MEDIUM — Dead Links / Non-functional UI Elements

### Web App

- [ ] **W-06** Footer has 16+ dead links (`href="#"`) for social media, company, vendor links
  - File: `apps/web/src/components/layout/Footer.tsx:22,34,44,54`
  - Fix: Map links to real routes or remove non-functional ones
- [ ] **W-07** Profile page "Privacy Policy" and "Terms" links use `href="#"`
  - File: `apps/web/src/app/profile/page.tsx:250`
  - Fix: Link to `/terms` and `/privacy` pages
- [ ] **W-08** Navbar links to `/pricing` page that doesn't exist
  - File: `apps/web/src/components/layout/Navbar.tsx:131`
  - Fix: Link to `/vendors` instead or create pricing page
- [ ] **W-09** Login page links to `/terms` and `/privacy` pages that don't exist
  - File: `apps/web/src/app/login/page.tsx:140-141`
  - Fix: Create basic /terms and /privacy pages
- [ ] **W-10** CTA links to `/vendor/register` page that doesn't exist
  - File: `apps/web/src/components/home/CTASection.tsx:42`
  - Fix: Link to `/login` with vendor registration mode
- [ ] **W-11** Profile menu: Notifications, Privacy & Security, My Reviews point to `#`
  - File: `apps/web/src/app/profile/page.tsx:29-31`
  - Fix: Link to real pages or show "Coming Soon" toast
- [ ] **W-12** Checkout Terms & Refund Policy links use `href="#"`
  - File: `apps/web/src/app/checkout/[vendorId]/page.tsx:421`
  - Fix: Link to /terms page

### Flutter Mobile App

- [ ] **M-06** Home screen notifications icon button has empty `onPressed: () {}`
  - File: `apps/mobile/lib/features/home/home_screen.dart:84`
  - Fix: Navigate to `/notifications`
- [ ] **M-07** Profile settings icon button has empty `onPressed: () {}`
  - File: `apps/mobile/lib/features/profile/profile_screen.dart:19`
  - Fix: Navigate to settings or show coming-soon
- [ ] **M-08** Checkout has hardcoded defaults: city='Hyderabad', guests='300'
  - File: `apps/mobile/lib/features/bookings/checkout_screen.dart:36-37`
  - Fix: Start empty, let user fill in
- [ ] **M-09** Checkout magic numbers (0.3 = 30% advance, 0.118 = 11.8% platform fee) undocumented
  - File: `apps/mobile/lib/features/bookings/checkout_screen.dart:51-52`
  - Fix: Extract to named constants with comments

---

## 🔵 INFRASTRUCTURE — Docker / Config Issues

- [ ] **D-01** Docker compose services missing shared package volume mounts
  - File: `docker-compose.dev.yml` — user-service, vendor-service, booking-service, payment-service, execution-service, notification-service
  - Fix: Add `./packages:/app/packages` volume mount to all services
- [ ] **D-02** Docker compose missing 4 services: review, search, chat, media
  - File: `docker-compose.dev.yml`
  - Fix: Add service definitions for review-service, search-service, chat-service, media-service

---

## 🟢 LOW — Code Quality

- [ ] **B-03** Shared packages exist but most services don't import them
- [ ] **B-04** Inconsistent error handling patterns across services  
- [ ] **W-13** Multiple `as any` type assertions in web pages
- [ ] **W-14** Hardcoded localhost URLs in `next.config.js`

---

## Implementation Priority

1. **Phase 1** — Critical runtime fixes: W-01–W-05, B-01–B-02, A-01–A-02, M-01–M-05
2. **Phase 2** — Dead links & navigation: W-06–W-12, M-06–M-09
3. **Phase 3** — Infrastructure: D-01–D-02
4. **Phase 4** — Code quality: B-03–B-04, W-13–W-14
