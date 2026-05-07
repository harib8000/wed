# Sprint 6: Flutter Mobile App — Core Screens

> **Duration:** 3 days | **Priority:** P1
> **Goal:** Build iOS + Android app with core screens: Auth, Home, Search, Vendor Detail, Booking, Dashboard

---

## 6.1 Flutter App Foundation

### Current State
- `apps/mobile/lib/` has empty `core/`, `features/`, `shared/` directories
- `pubspec.yaml` exists with basic dependencies
- Zero implemented screens

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.1.1 | **App entry + theme** | `lib/main.dart` — ProviderScope (Riverpod), `lib/app.dart` — MaterialApp with Material 3 theme, Wedding OS brand colors (#c026d3 primary), GoRouter setup | 1h |
| 6.1.2 | **Core config** | `lib/core/config/app_config.dart` — API base URL (env-based), `lib/core/config/theme.dart` — Complete theme tokens | 1h |
| 6.1.3 | **Network client** | `lib/core/network/api_client.dart` — Dio with interceptors: auth token injection, refresh on 401, request/response logging. `lib/core/network/auth_interceptor.dart` | 2h |
| 6.1.4 | **Secure storage** | `lib/core/storage/secure_storage.dart` — flutter_secure_storage wrapper for JWT tokens, user preferences | 30m |
| 6.1.5 | **Error handling** | `lib/core/error/app_error.dart` — Typed error classes, `lib/core/error/error_handler.dart` — Global error to user-friendly message | 1h |
| 6.1.6 | **Router** | `lib/core/router/router.dart` — GoRouter with guards: unauthenticated → /login, first-time → /onboarding, authenticated → /home. Deep link support | 1h |
| 6.1.7 | **Utilities** | `lib/core/utils/currency.dart` — ₹ formatting (Indian numbering: 1,50,000), `lib/core/utils/validators.dart` — Phone, email validation | 30m |

---

## 6.2 Auth Feature

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.2.1 | **Auth data layer** | `lib/features/auth/data/auth_api.dart` — send-otp, verify-otp, refresh, logout API calls | 1h |
| 6.2.2 | **Auth domain** | `lib/features/auth/domain/auth_model.dart` — User, AuthToken models | 30m |
| 6.2.3 | **Auth state** | `lib/features/auth/presentation/auth_provider.dart` — Riverpod AsyncNotifier for auth state | 1h |
| 6.2.4 | **Login screen** | `lib/features/auth/presentation/login_screen.dart` — Phone input with +91, Send OTP button, OTP input (6 digit auto-focus), verify. SMS auto-read (Android) | 2h |
| 6.2.5 | **Onboarding wizard** | `lib/features/auth/presentation/onboarding_screen.dart` — PageView: wedding type → date → city → guest count → budget. Smooth animations | 2h |

---

## 6.3 Home Feature

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.3.1 | **Home screen** | `lib/features/home/presentation/home_screen.dart` — AI plan card, active bookings widget, category chips (8 categories), featured vendors carousel, budget tracker mini, upcoming tasks | 3h |
| 6.3.2 | **Category chips** | `lib/features/home/presentation/widgets/category_grid.dart` — 8 chips with icons: Venue, Catering, Photography, Decor, Makeup, Music, Transport, Invitations | 1h |
| 6.3.3 | **Home API** | `lib/features/home/data/home_api.dart` — Fetch dashboard data: events, bookings, featured vendors | 1h |

---

## 6.4 Vendor Search Feature

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.4.1 | **Search screen** | `lib/features/search/presentation/search_screen.dart` — Search bar with debounce (300ms), filter chips, vendor list/grid toggle, sort dropdown | 3h |
| 6.4.2 | **Filter bottom sheet** | `lib/features/search/presentation/widgets/filter_sheet.dart` — Category chips, price range slider, rating stars, city picker, date picker for availability, verified-only toggle | 2h |
| 6.4.3 | **Vendor card** | `lib/features/search/presentation/widgets/vendor_card.dart` — Photo, name, rating, price, availability badge, heart (save) button | 1h |
| 6.4.4 | **Search state** | `lib/features/search/presentation/search_provider.dart` — AsyncNotifier with search query, filters, pagination (cursor-based) | 1h |
| 6.4.5 | **Vendor detail screen** | `lib/features/vendor/presentation/vendor_detail_screen.dart` — Cover photo, portfolio gallery, packages, reviews, availability calendar, Enquire Now CTA | 3h |
| 6.4.6 | **Map view** | `lib/features/search/presentation/map_view_screen.dart` — Google Maps with vendor markers, clustering, tap to see card | 2h |

---

## 6.5 Booking Feature

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.5.1 | **Booking flow** | `lib/features/booking/presentation/booking_flow_screen.dart` — Select package → pick date (availability calendar) → add requirements → send enquiry | 2h |
| 6.5.2 | **Booking detail** | `lib/features/booking/presentation/booking_detail_screen.dart` — Status timeline, vendor info, package details, payment status, actions (confirm/cancel) | 2h |
| 6.5.3 | **Payment screen** | `lib/features/payment/presentation/payment_screen.dart` — Razorpay Flutter SDK integration, UPI/cards/NetBanking | 2h |
| 6.5.4 | **My bookings list** | `lib/features/booking/presentation/bookings_list_screen.dart` — Tabs: Active / Completed / Cancelled | 1h |

---

## 6.6 Event Dashboard Feature

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.6.1 | **Event dashboard** | `lib/features/event/presentation/event_dashboard_screen.dart` — Timeline view, booked vendors, budget gauge, task list, countdown widget | 3h |
| 6.6.2 | **Day-of screen** | `lib/features/execution/presentation/dayof_screen.dart` — Live vendor check-in status (green/red), timeline of events, one-tap call, issue reporting | 2h |
| 6.6.3 | **Budget tracker** | `lib/features/budget/presentation/budget_screen.dart` — Pie chart, category breakdown, commitment register, overspend alerts | 2h |

---

## 6.7 Profile & Notifications

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.7.1 | **Profile screen** | `lib/features/profile/presentation/profile_screen.dart` — Photo, name, phone, email, wedding details. Edit fields | 1h |
| 6.7.2 | **Notification inbox** | `lib/features/notifications/presentation/notifications_screen.dart` — List with unread indicator, tap to navigate | 1h |
| 6.7.3 | **Push notification setup** | Firebase Messaging initialization, token registration, background handler | 1h |

---

## 6.8 Shared Widgets

| # | Task | Files | Est |
|---|------|-------|-----|
| 6.8.1 | **Loading skeleton** | `lib/shared/widgets/skeleton_loading.dart` — Shimmer effect for cards, list items | 1h |
| 6.8.2 | **Error widget** | `lib/shared/widgets/error_retry.dart` — Error icon + message + retry button | 30m |
| 6.8.3 | **Rating stars** | `lib/shared/widgets/rating_stars.dart` — Filled/empty stars display | 30m |
| 6.8.4 | **Price display** | `lib/shared/widgets/price_tag.dart` — ₹ formatted with Indian numbering | 30m |
| 6.8.5 | **Vendor mini card** | `lib/shared/widgets/vendor_mini_card.dart` — Compact card for lists | 30m |

### Acceptance Criteria
- [ ] App launches in <3s cold start
- [ ] OTP login works with auto-read on Android
- [ ] Vendor search with filters returns real API data
- [ ] Vendor detail shows portfolio, packages, reviews
- [ ] Booking enquiry flow works end-to-end
- [ ] Razorpay payment opens and processes
- [ ] Push notifications received for booking events
- [ ] 60fps smooth scrolling throughout
