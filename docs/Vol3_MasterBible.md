# WEDDING OS — Volume III: Zero-Gap Engineering Master Bible

> Code Architecture · Financial Model · Ops Manual · Capacity Planning · Third-Party APIs · Release Process · Growth Playbook

| Field | Value |
|-------|-------|
| **Document** | Wedding OS — Volume III: Zero-Gap Engineering Master Bible |
| **Covers** | 22 deep-dive sections filling every remaining implementation gap |
| **Series** | Read Volumes I + II + III together for complete blueprint |
| **Audience** | Senior engineers, DevOps, Finance, Growth, Operations |
| **Philosophy** | Zero ₹ infra start → Billion-dollar architecture at scale |

> **CONFIDENTIAL — DEVELOPMENT TEAM ONLY**

---

## 1. Complete Code Architecture & Folder Structure

### 1.1 Monorepo Root Structure

```
wedding-os/
├── apps/
│   ├── mobile/              # Flutter cross-platform app
│   ├── web/                 # Next.js 14 — Customer web app
│   ├── vendor-web/          # Vite+React — Vendor OS web
│   └── admin/               # Vite+React+AntDesign — Admin panel
├── services/
│   ├── api-gateway/         # Kong config + custom plugins
│   ├── auth-service/        # JWT, OTP, OAuth
│   ├── user-service/        # Profiles, preferences
│   ├── vendor-service/      # Vendor CRUD, portfolio, packages
│   ├── search-service/      # Elasticsearch + autocomplete
│   ├── booking-service/     # Bookings, enquiries, quotes
│   ├── payment-service/     # Razorpay, escrow, payouts
│   ├── execution-service/   # Tasks, timeline, event day
│   ├── notification-service/# SMS/Push/Email/WhatsApp fan-out
│   ├── ai-service/          # Python FastAPI — ML + recommendations
│   ├── chat-service/        # Socket.io in-booking chat
│   ├── review-service/      # Reviews, ratings, moderation
│   └── media-service/       # Upload presign, processing webhook
├── packages/
│   ├── shared-types/        # TypeScript interfaces shared across services
│   ├── shared-utils/        # Date, money, validation helpers
│   ├── shared-errors/       # Error classes + error codes
│   ├── shared-events/       # Domain event type definitions
│   └── ui-kit/              # Shared React components (web apps)
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/         # Reusable TF modules
│   │   ├── staging/         # Staging environment vars
│   │   └── production/      # Production environment vars
│   ├── docker/
│   │   ├── Dockerfile.node  # Base Node.js image
│   │   └── Dockerfile.python# Base Python image
│   └── kong/                # Kong declarative config (deck)
├── scripts/
│   ├── seed/                # Development seed data
│   ├── migrate/             # Migration helpers
│   └── deploy/              # Deployment helper scripts
├── docs/
│   ├── openapi/             # API specs per service
│   ├── adr/                 # Architecture Decision Records
│   └── runbooks/            # Ops runbooks
├── .github/workflows/       # CI/CD pipelines
├── pnpm-workspace.yaml      # Workspace definition
├── docker-compose.dev.yml   # Local dev stack
└── turbo.json               # Turborepo build pipeline
```

### 1.2 Node.js Service Internal Structure

Every backend service follows this identical structure:

```
auth-service/
├── src/
│   ├── app.ts               # Express app setup, middleware registration
│   ├── server.ts            # HTTP server, port binding, graceful shutdown
│   ├── config/
│   │   ├── index.ts         # Validated env vars (using Zod)
│   │   └── database.ts      # Prisma client singleton
│   ├── routes/
│   │   ├── index.ts         # Route registration
│   │   └── auth.routes.ts   # Route definitions (thin — no logic)
│   ├── controllers/
│   │   └── auth.controller.ts # Request parsing, response formatting
│   ├── services/
│   │   ├── otp.service.ts   # Business logic
│   │   ├── jwt.service.ts   # Token sign, verify, refresh
│   │   └── user.service.ts  # User lookup, creation
│   ├── middleware/
│   │   ├── auth.middleware.ts# JWT verification
│   │   ├── validate.ts      # Zod request validation
│   │   ├── rateLimit.ts     # Redis-based rate limiting
│   │   └── requestId.ts     # Inject X-Request-ID
│   ├── repositories/
│   │   ├── user.repo.ts     # All DB queries for users
│   │   └── token.repo.ts    # Refresh token DB queries
│   ├── events/
│   │   ├── producers/       # Publish domain events to queue
│   │   └── consumers/       # Consume events from other services
│   ├── jobs/
│   │   └── cleanup.job.ts   # BullMQ job definitions
│   ├── types/
│   │   └── index.ts         # Local TypeScript types
│   └── utils/
│       ├── logger.ts        # Structured JSON logger (pino)
│       └── crypto.ts        # Hashing, random generation
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── tests/
│   ├── unit/                # Jest unit tests
│   ├── integration/         # Supertest integration tests
│   └── fixtures/            # Test data factories
├── Dockerfile
├── package.json
└── tsconfig.json
```

### 1.3 Flutter App Internal Structure

```
apps/mobile/lib/
├── main.dart                # App entry, ProviderScope
├── app.dart                 # MaterialApp, router, theme
├── core/
│   ├── config/
│   │   ├── app_config.dart  # Env-based config
│   │   └── theme.dart       # Material 3 theme tokens
│   ├── router/
│   │   └── router.dart      # GoRouter with guards
│   ├── network/
│   │   ├── api_client.dart  # Dio client, interceptors
│   │   └── auth_interceptor.dart
│   ├── storage/
│   │   └── secure_storage.dart
│   ├── error/
│   │   ├── app_error.dart
│   │   └── error_handler.dart
│   └── utils/
│       ├── currency.dart    # ₹ formatting (Indian system)
│       ├── date.dart
│       └── validators.dart
├── features/
│   ├── auth/
│   │   ├── data/            # API calls, local storage
│   │   ├── domain/          # Models, use cases
│   │   └── presentation/    # Screens, widgets, providers
│   ├── home/
│   ├── search/
│   ├── vendor/
│   ├── booking/
│   ├── payment/
│   ├── event/
│   ├── execution/
│   ├── guest/
│   ├── budget/
│   ├── profile/
│   ├── notifications/
│   └── support/
├── shared/
│   ├── widgets/             # Reusable UI components
│   ├── models/              # Shared data models
│   └── constants/
└── l10n/                    # Localization ARB files
```

---

## 2. Financial Model & Unit Economics

### 2.1 Revenue Streams

| Revenue Stream | Unit | Price | Margin | Start Month |
|---------------|------|-------|--------|------------|
| Booking Commission | % of GMV | 10% standard / 8% premium | ~90% | Month 3 |
| Vendor Premium Sub | Per vendor/month | ₹1,999/month | ~95% | Month 5 |
| Vendor Enterprise Sub | Per vendor/month | ₹4,999/month | ~95% | Month 8 |
| Featured Listing | Per vendor/month | ₹2,999/month | ~95% | Month 6 |
| Promoted Package | Per listing boost | ₹999/boost/7 days | ~95% | Month 6 |
| AI Premium Planning | Per customer/event | ₹499 one-time | ~85% | Month 10 |
| Coordinator Service | Per event | ₹15,000–30,000 | ~40% | Month 8 |
| Wedding Insurance | Commission | 15% of premium | ~15% | Month 18 |
| Wedding Loans | Commission | 1–2% of loan value | ~100% | Month 18 |

### 2.2 Monthly GMV & Revenue Projection

| Month | Weddings/Mo | Avg Booking | GMV | Commission Rev | SaaS Rev | Total Rev |
|-------|------------|-------------|-----|---------------|----------|-----------|
| M1 | 5 | ₹50K | ₹2.5L | ₹0 (waived) | ₹0 | ₹0 |
| M2 | 12 | ₹55K | ₹6.6L | ₹0 (waived) | ₹0 | ₹0 |
| M3 | 25 | ₹60K | ₹15L | ₹75K (5%) | ₹0 | ₹75K |
| M4 | 45 | ₹65K | ₹29L | ₹1.45L | ₹20K | ₹1.65L |
| M5 | 70 | ₹65K | ₹45L | ₹2.25L | ₹40K | ₹2.65L |
| M6 | 110 | ₹70K | ₹77L | ₹7.7L | ₹80K | ₹8.5L |
| M9 | 250 | ₹75K | ₹1.9Cr | ₹19L | ₹3L | ₹22L |
| M12 | 500 | ₹80K | ₹4Cr | ₹40L | ₹8L | ₹48L |
| M18 | 1,200 | ₹85K | ₹10.2Cr | ₹1.02Cr | ₹25L | ₹1.27Cr |
| M24 | 3,000 | ₹90K | ₹27Cr | ₹2.7Cr | ₹60L | ₹3.3Cr |

### 2.3 Cost Structure

| Category | Month 1–3 | Month 6 | Month 12 | Month 24 |
|----------|----------|---------|---------|---------|
| Infrastructure (AWS) | ₹0 | ₹8K | ₹40K | ₹2L |
| SMS / WhatsApp | ₹2K | ₹8K | ₹25K | ₹80K |
| Payment Gateway (2%) | ₹0 | ₹1.5L | ₹8L | ₹54L |
| Team (Engineering) | ₹3L | ₹6L | ₹15L | ₹40L |
| Team (Ops/Support) | ₹0 | ₹1.5L | ₹4L | ₹10L |
| Marketing (Paid) | ₹0 | ₹1L | ₹5L | ₹20L |
| Legal & Compliance | ₹20K | ₹20K | ₹30K | ₹50K |
| **Total OpEx** | **₹3.3L** | **₹10.4L** | **₹32.35L** | **₹1.27Cr** |

### 2.4 Key Unit Economics

| Metric | Month 6 Target | Month 12 Target |
|--------|---------------|----------------|
| Customer LTV | ₹3,500 | ₹7,000 |
| Blended CAC | ₹250 | ₹180 |
| LTV:CAC Ratio | 14:1 | 38:1 |
| Payback Period | 2.1 months | 1.4 months |
| Vendor LTV | ₹48K/year | ₹60K/year |
| Vendor CAC | ₹800 | ₹500 |
| Gross Margin | 72% | 78% |

### 2.5 Fundraising Milestones

| Stage | Raise | Valuation | Key Metrics | Use of Funds |
|-------|-------|-----------|------------|-------------|
| Pre-Seed (Bootstrap) | ₹0 | — | 50 vendors, 10 bookings | Product build |
| Friends & Family | ₹25–50L | ₹2–3Cr | 100 weddings, ₹50L GMV/mo | Team + marketing |
| Seed | ₹1–2Cr | ₹8–15Cr | ₹2Cr GMV/mo, PMF | City expansion |
| Series A | ₹10–25Cr | ₹75–150Cr | ₹20Cr GMV/mo, 3 cities | Multi-city scale |

---

## 3. Third-Party API Integration Playbook

### 3.1 Razorpay — Complete Integration

```javascript
// Step 1: Create order
const order = await rzp.orders.create({
  amount: amountInPaise,          // ALWAYS in paise (₹500 = 50000)
  currency: 'INR',
  receipt: `booking_${bookingId}`,
  notes: { booking_id: bookingId, customer_id: customerId },
  payment_capture: 1
});

// Step 4: Webhook verification (CRITICAL)
const crypto = require('crypto');
const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(body).digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(req.headers['x-razorpay-signature'])))
  return res.status(400).json({ error: 'Invalid signature' });
```

**Razorpay Events to Handle:**

| Event | When | Our Action |
|-------|------|-----------|
| payment.captured | Payment successful | Create escrow_hold, update booking, notify |
| payment.failed | Payment declined | Update status, notify customer |
| refund.processed | Refund completed | Confirm to customer, close dispute |
| subscription.charged | Vendor billing | Extend subscription, issue invoice |
| subscription.halted | Failed charge | Downgrade vendor, notify |
| payout.processed | Vendor payout done | Update escrow to released |
| payout.failed | Payout failed | Alert ops, retry |

### 3.2 MSG91 — OTP & SMS

```javascript
// Send OTP
await axios.post('https://api.msg91.com/api/v5/otp', {
  template_id: process.env.MSG91_OTP_TEMPLATE_ID,
  mobile: phoneInE164format,    // 919876543210 (no + prefix)
  authkey: process.env.MSG91_AUTH_KEY,
  otp_length: 6,
  otp_expiry: 10
});

// Verify OTP
const verifyRes = await axios.post('.../otp/verify', {
  mobile: phone, otp: userEnteredOtp, authkey: process.env.MSG91_AUTH_KEY
});
```

### 3.3 Bank Account Penny Drop (Razorpay)

```javascript
const fundAccount = await rzp.fundAccount.create({
  contact_id: razorpayContactId,
  account_type: 'bank_account',
  bank_account: { name: vendorName, ifsc: ifscCode, account_number: accNumber }
});
const validation = await rzp.fundAccount.validate({
  fund_account: { id: fundAccount.id },
  amount: 100, // ₹1 in paise
  currency: 'INR'
});
// validation.status === 'completed' → valid bank account
```

### 3.4 Firebase Cloud Messaging

```javascript
async function sendPush(fcmToken, title, body, data = {}) {
  await admin.messaging().send({
    token: fcmToken,
    notification: { title, body },
    data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
    android: { priority: 'high', notification: { sound: 'default', channelId: 'bookings' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } }
  });
}
```

### 3.5 WhatsApp Business API (360dialog)

```javascript
await axios.post('https://waba.360dialog.io/v1/messages', {
  to: phoneInE164,
  type: 'template',
  template: {
    namespace: 'your_namespace',
    name: 'booking_confirmed',
    language: { policy: 'deterministic', code: 'en' },
    components: [{ type: 'body', parameters: [
      { type: 'text', text: customerName },
      { type: 'text', text: vendorName },
      { type: 'text', text: eventDate }
    ]}]
  }
}, { headers: { 'D360-API-KEY': process.env.WHATSAPP_API_TOKEN } });
```

### 3.6 Google Maps / Places API

| Usage | API | Cost |
|-------|-----|------|
| Vendor location input | Places Autocomplete | $17/1000 req |
| Vendor map view (search) | Maps JavaScript | $7/1000 loads |
| GPS check-in (event day) | Geolocation (device) | Free |
| Distance calculation | Distance Matrix | $10/1000 elem |
| City centroid for search | Geocoding | $5/1000 req |

---

## 4. Capacity Planning & Scaling Playbook

### 4.1 Traffic Volume Assumptions

| Phase | MAU | Peak RPS | Concurrent WS | DB Connections |
|-------|-----|----------|---------------|----------------|
| MVP (Month 3) | 500 | 10 | 50 | 20 |
| Traction (Month 6) | 5,000 | 100 | 500 | 100 |
| Growth (Month 12) | 25,000 | 500 | 2,500 | 400 |
| Scale (Month 18) | 1,00,000 | 2,000 | 10,000 | 1,200 |
| Regional (Month 24) | 5,00,000 | 10,000 | 50,000 | 4,000 |

### 4.2 Infrastructure Scaling Roadmap

| Phase | Database | Cache | API Servers | Search | Cost |
|-------|---------|-------|-------------|--------|------|
| MVP | Supabase free | Upstash free | 1 ECS/service | ES free | ₹0 |
| Month 5 | RDS t3.small | ElastiCache micro | 2/service | ES small 1 node | ~₹8K/mo |
| Month 9 | RDS medium + replica | ElastiCache small | 3-5 auto | ES medium 3 nodes | ~₹35K/mo |
| Month 14 | RDS r6g.large multi-AZ | ElastiCache large | 5-15 auto | ES r6g.large 3 nodes | ~₹1.2L/mo |
| Month 18 | RDS xlarge + 2 replicas | Cluster mode | 10-50/service | ES 5-node cluster | ~₹4L/mo |
| Month 24 | Aurora global | Global + regional | Multi-region | ES 10-node multi-AZ | ~₹12L/mo |

### 4.3 S3 Media Cost (at 10K vendors)

| Content Type | Per Vendor | 10K Vendors | Monthly Cost |
|-------------|-----------|-------------|-------------|
| Portfolio photos | ~50MB | 500GB | ₹850 |
| Portfolio videos | ~500MB | 5TB | ₹8,500 |
| KYC documents | ~2MB | 20GB | ₹34 |
| **Total** | — | **~5.5TB** | **~₹9,500** |

---

## 5. Mobile App Release Process

### 5.1 Version Numbering

- Format: `MAJOR.MINOR.PATCH` (semantic versioning)
- OTA updates: Shorebird for Dart-only changes

### 5.2 Release Cadence

| Type | Frequency | Rollout Strategy |
|------|----------|-----------------|
| Bug Fix Patch | As needed | 100% immediate |
| Feature Minor | Every 2 weeks | 10% → 50% → 100% staged |
| Major Release | Quarterly | 5% → 25% → 100% over 1 week |
| OTA (Shorebird) | As needed (hours) | 100% — no store review |

### 5.3 Required Screenshots

| Screen | Why Required |
|--------|-------------|
| Home Dashboard | Core value |
| Vendor Search & Results | Discovery feature |
| Vendor Profile | Portfolio + rating |
| AI Budget Planner | Unique value prop |
| Event Timeline | Execution Engine |
| Event Day Dashboard | Differentiator |
| Booking Confirmation | Trust + payment |

---

## 6. Operations Manual

### 6.1 Daily Operations Checklist

**Every Morning (9 AM):**
- Check dashboard: GMV, signups, vendor applications
- Review Sentry: crash patterns
- Dispute queue: assign reviewers
- Payment alerts: stuck escrows, failed payouts
- Vendor verification queue (SLA: 24h)

**Every Evening (6 PM):**
- Review day's metrics vs targets
- Check tomorrow's events: coordinate with vendors
- Vendor payout batch: verify releases
- Team standup notes

### 6.2 Vendor Acquisition Workflow

**Outreach Script:**
> "We give you FREE digital presence, a booking calendar, and guaranteed leads — completely free for the first 3 months. We've already onboarded [X] vendors this week."

| Day | Action | Channel |
|-----|--------|---------|
| Day 0 | In-person pitch + app demo | In-person |
| Day 1 | Send registration link + video | WhatsApp |
| Day 3 | Call if not registered | Phone |
| Day 7 | 'You have 2 enquiries waiting!' | WhatsApp |
| Day 14 | Check-in, show analytics | WhatsApp/Visit |
| Day 30 | Subscription pitch | In-person |

### 6.3 First 100 Weddings Protocol

> Every wedding is managed personally. 1 coordinator per 5 active events.

- Personal call within 2 hours of signup
- WhatsApp group: Customer + family + coordinator
- Weekly Sunday check-in
- Event day: coordinator on-call 6 AM to midnight
- Post-event: morning call + prompt review

---

## 7. Growth & Marketing Automation

### 7.1 Customer Drip Emails

| Day | Subject | Goal |
|-----|---------|------|
| D+0 | Welcome! Your wedding journey starts | Onboarding |
| D+1 | Your AI Wedding Plan is waiting | Complete plan |
| D+3 | 5 most-booked venues in Hyderabad | Discovery |
| D+7 | Your wedding checklist for {X} months | Personalized tasks |
| D+14 | 2 photographers match your budget | Urgency |
| D+21 | How {Couple} planned their perfect wedding | Social proof |
| D+60 | Still planning? Our coordinators can help | Re-engagement |

### 7.2 Vendor Onboarding Drip

| Day | Medium | Goal |
|-----|--------|------|
| D+0 | In-app + Email | Profile completion |
| D+1 | Push | Photo upload |
| D+2 | WhatsApp | Package creation |
| D+7 | Push | Calendar activation |
| D+30 | Email | Premium upgrade |

---

## 8. Data Pipeline & Analytics

### Architecture

```
PostgreSQL (operational) → CDC (Debezium) → Kafka/Kinesis → ClickHouse (analytics) + S3 (data lake)
Orchestration: Airflow/Prefect | Transformation: dbt | BI: Metabase (free, self-hosted)
```

### Key Reports

| Report | Frequency | Audience | Key Metrics |
|--------|----------|---------|------------|
| Daily Dashboard | Daily 8 AM | Founder | GMV, bookings, signups, disputes |
| Weekly Vendor Health | Monday | Ops | Activity, churn risk, top performers |
| Weekly Growth | Monday | Marketing | CAC, conversions, attribution |
| Monthly P&L | 1st of month | Finance | Revenue, costs, EBITDA |
| Quarterly Investor | Quarterly | Investors | GMV trend, unit economics |

---

## 9. Partnership Integrations

### Venue Partnership Tiers

| Tier | Benefit to Venue | Commission | Requirements |
|------|-----------------|-----------|-------------|
| Preferred Partner | 'Preferred' badge, lead flow | 8% | 12 bookings/year |
| Featured Venue | Top position, homepage | 10% + ₹2,999/mo | 4.0+ rating |
| Standard | Free listing | 10% | KYC verified |

### Financial Partnerships (Month 18+)

- **Wedding Loans:** Axis Bank / HDFC / LoanTap — 1-2% commission on disbursement
- **Wedding Insurance:** Acko / ICICI Lombard — 15% of premium

---

## 10. Load Testing (k6)

### Acceptance Criteria

| Scenario | Users | Duration | P95 Latency | Error Rate |
|----------|-------|----------|------------|-----------|
| Baseline | 100 | 5 min | <150ms | <0.1% |
| Normal load | 500 | 10 min | <200ms | <0.5% |
| Peak load | 2,000 | 5 min | <400ms | <1% |
| Stress test | 5,000 | 3 min | <800ms | <2% |
| Soak test | 500 | 2 hours | <200ms | <0.5% |

---

## 11. Privacy & Cookie Consent

- **Essential cookies:** Cannot disable (session, CSRF, auth)
- **Analytics/Marketing:** User can disable (PostHog, Meta Pixel)
- **Consent banner:** No dark patterns — Accept/Reject same visual prominence
- **Data export:** ZIP within 48h (profile, bookings, payments, messages)
- **Account deletion:** Anonymise PII within 7 days

---

## 12. Architecture Decision Records (ADRs)

| ADR # | Title | Decision | Key Consequence |
|-------|-------|----------|----------------|
| 001 | DB Per Service vs Shared | Shared PostgreSQL, schema-per-service | Simpler ops; mitigate via ownership rules |
| 002 | Monolith vs Microservices | Modular monolith → extract at Month 5 | Faster MVP |
| 003 | Flutter vs React Native | Flutter | Better perf, Dart type system |
| 004 | JWT RS256 vs HS256 | RS256 (asymmetric) | Services verify without shared secret |
| 005 | REST vs GraphQL | REST primary, GraphQL later | Simpler, easier to cache |
| 006 | BullMQ vs SQS vs RabbitMQ | BullMQ (Redis-based) | Zero infra cost, great TypeScript DX |
| 007 | ES vs PostgreSQL FTS | Elasticsearch | Superior geo-search, faceting |
| 008 | Razorpay vs PayU vs Stripe | Razorpay | Best India coverage, UPI native |
| 009 | Self-hosted vs Managed DB | AWS RDS (managed) | No DB ops burden |
| 010 | pnpm vs Lerna vs Nx | pnpm Workspaces + Turborepo | Best balance for our scale |

---

## 13. Multi-City Expansion

### City Data Model

```sql
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  state VARCHAR(100),
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN DEFAULT FALSE,
  launch_date DATE,
  cost_multiplier DECIMAL(4,2) DEFAULT 1.00,
  metadata JSONB DEFAULT '{}'
);
```

### Expansion Playbook

| Timeline | Action |
|----------|--------|
| T-60 days | Vendor acquisition: visit 200+ vendors |
| T-45 days | Onboard 50+ verified vendors |
| T-30 days | City landing page, SEO content |
| T-14 days | Local influencer tie-ups |
| T-7 days | Full load test with city data |
| T-0 | Enable city (`is_active = true`) |
| T+30 days | Review: GMV, vendor activity, satisfaction |

---

## 14. Performance Budget

### API Response Time

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Auth (OTP, verify) | 50ms | 150ms | 300ms |
| Vendor search | 100ms | 300ms | 500ms |
| Vendor profile | 80ms | 200ms | 400ms |
| Booking create | 100ms | 300ms | 600ms |
| Payment create | 150ms | 400ms | 800ms |
| Payment webhook | 50ms | 100ms | 200ms |
| Event day check-in | 50ms | 150ms | 300ms |

### Mobile App Budget

| Metric | Target |
|--------|--------|
| Cold start (iOS) | <3 seconds |
| Cold start (Android) | <4 seconds |
| API call to display | <800ms on 4G |
| App bundle (iOS) | <80MB |
| App bundle (Android) | <60MB |
| Memory (idle) | <120MB RAM |
| Battery drain | <3% per hour active |

### Web Core Vitals

| Metric | Target |
|--------|--------|
| LCP | <2.5s |
| FID | <100ms |
| CLS | <0.1 |
| JS bundle (initial) | <350KB gzipped |
| Lighthouse Mobile | >90 |

---

## 15. Technical Debt Register

| Debt Item | Reason | Risk if Not Fixed | Fix By | Effort |
|-----------|--------|-------------------|--------|--------|
| Monolith architecture | Faster MVP | Coupling at >10 engineers | Month 5 | High |
| Single PostgreSQL instance | Free tier | SPOF, no read scaling | Month 6 | Medium |
| No circuit breaker | MVP speed | Cascade failures | Month 4 | Low |
| Sync ES index | Simplicity | ES failures block updates | Month 5 | Low |
| No GraphQL | Simpler to build | Over-fetching | Month 10 | Medium |
| Manual dispute resolution | No automation | Doesn't scale >50/month | Month 8 | High |
| No i18n | English first | Blocks Tier-2 expansion | Month 8 | Medium |

---

## 16. Webhook Handler Architecture

### Design Principles

1. All webhooks → `POST /webhooks/{source}`
2. Immediately stored to `webhook_events` table
3. Return `200 OK` instantly (never block)
4. Process asynchronously via BullMQ
5. Idempotency: check unique ID before processing

### Signature Verification

| Source | Method | Header |
|--------|--------|--------|
| Razorpay | HMAC-SHA256 | x-razorpay-signature |
| MSG91 | Static token | x-msg91-token |
| Freshdesk | HMAC-SHA256 | x-freshdesk-signature |
| 360dialog | SHA-256 | x-hub-signature-256 |

---

## 17. Vendor Payout Reconciliation

### Daily Flow

1. Pull all Razorpay payments captured yesterday
2. Cross-check with Razorpay settlement report
3. Verify amounts match (our DB vs Razorpay)
4. Verify fee deduction (2% of amount)
5. Verify escrow_hold exists for each payment
6. Any mismatch → alert ops team

### Payout Math Example (₹1,00,000 booking, 30% advance)

| Line Item | Amount |
|-----------|--------|
| Customer pays (advance) | ₹30,000 |
| Razorpay fee (2%) | -₹600 |
| Net received | ₹29,400 |
| Platform commission (10%) | -₹3,000 |
| GST on commission (18%) | -₹540 |
| TDS (1% if applicable) | -₹300 |
| **Vendor payout** | **₹25,560** |

---

## 18. Pre-Launch Checklist

### Infrastructure ✅

- [ ] AWS billing alerts (₹5K/₹20K/₹50K)
- [ ] VPC with public/private subnets
- [ ] RDS PostgreSQL in private subnet
- [ ] Redis ElastiCache in private subnet
- [ ] S3 with versioning + encryption
- [ ] CloudFront CDN
- [ ] SSL certificates + auto-renewal
- [ ] Secrets Manager (no .env in prod)
- [ ] CloudWatch alarms
- [ ] PagerDuty on-call schedule

### Application ✅

- [ ] All Prisma migrations run
- [ ] Health check endpoints working
- [ ] JWT RS256 key pair in Secrets Manager
- [ ] Razorpay production keys + webhook
- [ ] MSG91 sender ID + OTP template
- [ ] Firebase FCM configured
- [ ] WhatsApp templates approved
- [ ] All E2E critical paths pass
- [ ] Load test: 2,000 users, P99 <400ms
- [ ] OWASP ZAP scan: no high-severity
- [ ] Snyk: no critical vulnerabilities

### Legal & Compliance ✅

- [ ] Privacy Policy live
- [ ] Terms of Service live
- [ ] Vendor agreements signed
- [ ] Cookie consent banner
- [ ] DPDP Act compliance reviewed
- [ ] Company incorporated (Pvt Ltd)
- [ ] Bank account in company name
- [ ] Razorpay KYC complete

### Product & Content ✅

- [ ] Minimum 50 verified vendors
- [ ] All profiles have 5+ portfolio photos
- [ ] App Store listings approved
- [ ] Test accounts for app reviewers
- [ ] FAQ page + Help Center (20 articles)
- [ ] Email support active (support@weddingos.in)

---

*THIS COMPLETES THE WEDDING OS MASTER BLUEPRINT*
*Volume I + Volume II + Volume III = Zero Gaps. Build Everything. Miss Nothing.*

> "Build the infrastructure layer of India's wedding industry."
