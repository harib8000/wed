# Sprint 2: Frontend API Integration — Kill All Mock Data

> **Duration:** 3 days | **Priority:** P0 BLOCKER
> **Goal:** Connect all 3 frontend apps to real backend APIs. Zero hardcoded/mock data.

---

## 2.1 Customer Web (apps/web) — Next.js

### Current State
- 5 pages exist: /, /login, /vendors, /vendors/[id], /dashboard
- `src/lib/api.ts` has Axios client with auth interceptor (good foundation)
- ALL data is hardcoded mock arrays (vendors, stats, testimonials)

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 2.1.1 | **Login page — real OTP flow** | `src/app/login/page.tsx` — Wire send-otp → verify-otp → store JWT → redirect. Currently has UI but verify step may not store token correctly | 1h |
| 2.1.2 | **Vendor listing — real API** | `src/app/vendors/page.tsx` — Replace mock array with `GET /vendors/search?city=X&category=X`. Add React Query hook. Loading skeletons. Filters wired to query params | 3h |
| 2.1.3 | **Vendor detail — real API** | `src/app/vendors/[id]/page.tsx` — `GET /vendors/:slug` for profile, `GET /vendors/:id/packages` for packages, `GET /vendors/:id/reviews` for reviews. Wire "Enquire Now" to `POST /bookings/enquire` | 3h |
| 2.1.4 | **Dashboard — real data** | `src/app/dashboard/page.tsx` — `GET /bookings` for user's bookings, `GET /events/:id` for event details, budget from event data, not hardcoded | 2h |
| 2.1.5 | **Homepage — real featured vendors** | `src/components/home/FeaturedVendors.tsx` — Fetch from `GET /vendors/search?featured=true&limit=8` instead of mock array | 1h |
| 2.1.6 | **Add booking flow page** | `src/app/bookings/new/page.tsx` — Select package → pick date → check availability → submit enquiry → payment via Razorpay checkout | 4h |
| 2.1.7 | **Add onboarding wizard** | `src/app/onboarding/page.tsx` — First-time user: event type → date → city → guest count → budget → AI plan. Stores to user profile | 3h |
| 2.1.8 | **Add event detail page** | `src/app/events/[id]/page.tsx` — Timeline view, booked vendors, budget tracker, task list | 2h |
| 2.1.9 | **Global error handling** | Axios interceptor: 401 → redirect to /login, network error → toast, rate limit → toast with retry-after | 1h |

### Acceptance Criteria
- [ ] Zero hardcoded vendor/booking/stats data — everything from API
- [ ] Loading states (skeletons) on every data-fetching page
- [ ] Error states with retry buttons
- [ ] Auth-protected routes redirect to /login when no token
- [ ] Razorpay checkout opens for booking advance payment

---

## 2.2 Vendor Dashboard (apps/vendor-web) — Vite+React

### Current State
- 5 pages: /login, /, /bookings, /analytics, /profile
- DashboardHome has hardcoded ₹2.4L revenue, 156 bookings, etc.
- Recharts with static data

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 2.2.1 | **Login — vendor role check** | `src/pages/LoginPage.tsx` — OTP login with role=vendor check. Reject customer accounts | 1h |
| 2.2.2 | **Dashboard — real stats** | `src/pages/DashboardHome.tsx` — `GET /vendors/me/analytics` for revenue, bookings, response rate. Real Recharts data | 2h |
| 2.2.3 | **Bookings — real bookings list** | `src/pages/BookingsPage.tsx` — `GET /vendors/me/bookings` with status filters (enquiry/quoted/confirmed/completed). Add quote/accept/reject actions | 3h |
| 2.2.4 | **Analytics — real data** | `src/pages/AnalyticsPage.tsx` — Monthly revenue from `GET /vendors/me/analytics`, booking conversion rates | 2h |
| 2.2.5 | **Profile — real CRUD** | `src/pages/ProfilePage.tsx` — Load from `GET /vendors/me/profile`, update via `PUT /vendors/me`. Package management: create/edit/delete via API | 3h |
| 2.2.6 | **Portfolio upload** | `src/pages/ProfilePage.tsx` (Portfolio tab) — `POST /media/presign` → upload to S3 → `POST /vendors/me/portfolio/confirm` | 2h |
| 2.2.7 | **Add enquiry management** | `src/pages/EnquiriesPage.tsx` — Kanban view: New → Quoted → Negotiating → Confirmed. Quick-reply with templates | 3h |
| 2.2.8 | **Add calendar view** | `src/pages/CalendarPage.tsx` — Monthly calendar showing booked dates (green), blocked dates (gray), available (white). Block date action | 2h |

### Acceptance Criteria
- [ ] All dashboard numbers come from real API data
- [ ] Vendor can view, accept, and quote on enquiries
- [ ] Vendor can upload portfolio images
- [ ] Calendar shows real availability from booking data

---

## 2.3 Admin Panel (apps/admin) — Vite+Ant Design

### Current State
- 4 pages: /login, /, /vendors, /bookings
- All tables use hardcoded arrays
- No dispute management

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 2.3.1 | **Dashboard — real KPIs** | `src/pages/Dashboard.tsx` — GMV from payments, active bookings count, new signups, pending disputes, failed payments, vendors awaiting KYC. Auto-refresh 60s | 2h |
| 2.3.2 | **Vendors — real table** | `src/pages/Vendors.tsx` — `GET /admin/vendors` with filters (status, KYC). KYC approve/reject buttons hitting `PUT /admin/vendors/:id/kyc` | 2h |
| 2.3.3 | **Bookings — real table** | `src/pages/Bookings.tsx` — `GET /admin/bookings` with status filters. Click to see full booking detail modal | 1h |
| 2.3.4 | **Users — real table** | `src/pages/Users.tsx` — `GET /admin/users` with search, role filter, status actions (suspend/activate) | 1h |
| 2.3.5 | **Add disputes page** | `src/pages/Disputes.tsx` — List open disputes, evidence from both parties, resolve with action (refund/release/partial), escrow management | 3h |
| 2.3.6 | **Add payments page** | `src/pages/Payments.tsx` — Payment list with status, escrow status, manual release/refund actions | 2h |
| 2.3.7 | **Add live activity feed** | `src/components/ActivityFeed.tsx` — WebSocket connection for real-time events: new bookings, payments, disputes, vendor KYC | 2h |
| 2.3.8 | **Admin auth middleware** | Backend: `PUT /admin/*` routes — verify role=admin. Add admin-specific routes to auth-service, user-service, booking-service, payment-service | 2h |

### Acceptance Criteria
- [ ] Dashboard KPIs reflect actual database state
- [ ] Admin can approve/reject vendor KYC with one click
- [ ] Admin can manage disputes and control escrow
- [ ] Live activity feed shows real-time platform events
