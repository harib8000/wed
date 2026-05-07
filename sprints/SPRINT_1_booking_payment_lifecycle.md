# Sprint 1: Backend API Completion — Booking & Payment Lifecycle

> **Duration:** 3 days | **Priority:** P0 BLOCKER
> **Goal:** Complete the booking enquiry→quote→confirm→pay lifecycle with Razorpay integration

---

## 1.1 Booking Service — Full Lifecycle API

### Current State
- Prisma schema: `Booking` + `BookingEvent` models exist
- Server runs on port 4004
- Basic CRUD routes exist but incomplete lifecycle

### Tasks

| # | Task | Files to Create/Edit | Est |
|---|------|---------------------|-----|
| 1.1.1 | **Implement Enquiry endpoint** | `services/booking-service/src/routes/booking.routes.ts` — POST /bookings/enquire: validate vendor exists, check availability, create booking with status=`enquiry`, emit `BOOKING_ENQUIRY_CREATED` event | 2h |
| 1.1.2 | **Implement Quote endpoint** | POST /bookings/:id/quote — Vendor sends quote (package or custom price), status→`quoted`, notify customer | 1h |
| 1.1.3 | **Implement Confirm endpoint** | POST /bookings/:id/confirm — Customer confirms booking, status→`confirmed`, trigger advance payment | 1h |
| 1.1.4 | **Implement Pay Advance endpoint** | POST /bookings/:id/pay-advance — Create Razorpay order, return order_id to frontend | 1h |
| 1.1.5 | **Implement Cancel endpoint** | PUT /bookings/:id/cancel — Either party cancels, apply cancellation policy, status→`cancelled` | 1h |
| 1.1.6 | **Implement Complete endpoint** | PUT /bookings/:id/complete — Customer marks complete, trigger escrow release countdown | 1h |
| 1.1.7 | **Implement Dispute endpoint** | POST /bookings/:id/dispute — Either party raises dispute, freeze escrow, status→`disputed` | 1h |
| 1.1.8 | **Add booking number generator** | Use `shared-utils` `generateBookingNumber()` for unique `WOS-XXXXXX-XX` format | 30m |
| 1.1.9 | **Add vendor availability check** | Before booking creation, check `vendor-service` availability via HTTP call | 1h |

### Acceptance Criteria
- [ ] Full booking status flow: `enquiry → quoted → confirmed → advance_paid → in_progress → completed`
- [ ] Alternative flows: `enquiry → cancelled`, `confirmed → disputed`
- [ ] Every status transition logged in `BookingEvent` audit table
- [ ] Notifications emitted for every transition (event bus)

---

## 1.2 Payment Service — Razorpay Integration

### Current State
- Prisma schema: `Payment` + `EscrowHold` models exist
- Server runs on port 4005
- Zero Razorpay code

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 1.2.1 | **Install Razorpay SDK** | `package.json` — add `razorpay` npm package | 10m |
| 1.2.2 | **Create Razorpay config** | `src/config/razorpay.ts` — Initialize Razorpay instance with key_id/key_secret from env | 30m |
| 1.2.3 | **POST /payments/create-order** | `src/routes/payment.routes.ts` — Create Razorpay order, store in Payment table with idempotency key, return order_id | 2h |
| 1.2.4 | **POST /payments/verify** | Verify HMAC-SHA256 webhook signature, update payment status, create escrow_hold, update booking status via HTTP to booking-service | 3h |
| 1.2.5 | **Webhook handler** | `src/routes/webhook.routes.ts` — POST /webhooks/razorpay: Raw body parsing, signature verification, idempotent processing (check external_id), handle `payment.captured`, `payment.failed`, `refund.created`, `refund.processed` | 3h |
| 1.2.6 | **Escrow state machine** | `src/services/escrow.service.ts` — States: HOLDING → PARTIAL_RELEASED → RELEASE_PENDING → FULLY_RELEASED / DISPUTED / REFUNDED. Calculate platform fee (10%), GST (18% on fee), vendor payout | 3h |
| 1.2.7 | **Auto-release job** | `src/jobs/escrow-release.job.ts` — BullMQ job: Check escrows where event_date + 7 days < now AND status=HOLDING, auto-release to vendor | 2h |
| 1.2.8 | **Vendor payout initiation** | `src/services/payout.service.ts` — Use Razorpay Payouts API to send money to vendor bank account. Track TDS deduction | 2h |
| 1.2.9 | **Webhook events table** | Add `webhook_events` model to Prisma schema for raw webhook storage + idempotency | 1h |

### Acceptance Criteria
- [ ] Customer can pay advance via Razorpay → escrow created
- [ ] Webhook signature verification passes (HMAC-SHA256)
- [ ] Duplicate webhooks do not double-process
- [ ] Escrow auto-releases 7 days post-event if no dispute
- [ ] Platform fee correctly calculated: 10% commission + 18% GST on commission
- [ ] All amounts handled in paise internally, rupees for display

---

## 1.3 Vendor Service — Availability & Packages

### Current State
- Full Prisma schema with 6 models
- CRUD routes exist for vendor profile and packages
- Missing: Availability check, calendar blocking

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 1.3.1 | **GET /vendors/:id/availability** | Check `AvailabilityBlock` + confirmed `Booking` dates, return available/booked for given month | 1h |
| 1.3.2 | **POST /vendors/me/availability/block** | Block specific dates (personal leave), store in `AvailabilityBlock` | 1h |
| 1.3.3 | **Conflict prevention** | Before booking confirmation, double-check vendor not already booked on that date | 30m |
| 1.3.4 | **GET /vendors/:id/packages** | Return active packages with pricing, inclusions, exclusions | 30m |

---

## Environment Variables Required
```env
# Payment Service .env additions
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
REDIS_URL=redis://localhost:6379
```

## Dependencies Between Tasks
```
1.1.4 (Pay Advance) → depends on → 1.2.3 (Create Order)
1.1.6 (Complete) → triggers → 1.2.7 (Auto-release job)
1.1.7 (Dispute) → triggers → 1.2.6 (Escrow freeze)
1.1.9 (Availability check) → depends on → 1.3.1 (Availability API)
```
