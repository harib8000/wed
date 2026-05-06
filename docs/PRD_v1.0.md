# WEDDING OS — Product Requirement Document v1.0

> **India's First End-to-End Wedding Operating System**
> Full-Stack Implementation Blueprint — Version 1.0

| Field | Value |
|-------|-------|
| **Document Type** | Product Requirement Document (PRD) |
| **Product Name** | Wedding OS — India's Wedding Operating System |
| **Version** | 1.0 — Initial Release |
| **Target Market** | India — Starting Hyderabad, Tier-1 Expansion |
| **Platform** | Mobile (Flutter) + Web (Next.js/React) |
| **Backend** | Node.js Microservices + PostgreSQL + Redis |
| **Cloud** | AWS Free Tier → Auto-Scaling Architecture |
| **Revenue Model** | Commission + SaaS + Escrow + AI Packages |
| **TAM** | ₹2,00,000 Crore — India Wedding Industry |
| **Launch City** | Hyderabad, Telangana |

> **CONFIDENTIAL — FOR DEVELOPMENT TEAM USE ONLY**
> Zero ₹ Infrastructure | Billion-Dollar Architecture | Production-Grade Security

---

## 1. Executive Summary & Vision

### 1.1 The Problem We Are Solving

India's wedding industry is worth ₹2,00,000 Crore annually — the second-largest wedding market in the world. Yet, every single wedding is planned through WhatsApp groups, Excel sheets, phone calls, and local referrals. This results in:

- **Vendor no-shows** causing wedding-day disasters with zero accountability
- **No price transparency** — couples overpay by 30–40% due to information asymmetry
- **Zero coordination** between 15–20 vendors working the same event
- **Advance payments lost** with no escrow protection or dispute resolution
- **Planning takes 200+ hours** spread over 12–18 months with no central system
- **Vendor quality is unpredictable** — no verified portfolio or ratings system

### 1.2 Our Solution — The Wedding OS

Wedding OS is not another listing site. It is the **complete operating system** for the Indian wedding industry — from first click to final applause.

We are building the infrastructure layer of India's wedding industry:

| Analogy | Function |
|---------|----------|
| **Amazon** | Discovering and booking verified wedding vendors |
| **Zoho CRM** | Vendor lead and booking management |
| **Uber** | Real-time coordination on event day |
| **Jira** | Milestone-based task tracking and execution |
| **Stripe/Escrow** | Trusted payment protection |

### 1.3 Vision Statement

> "Build the infrastructure layer of India's wedding industry — where every wedding runs through our platform."

### 1.4 Mission

To eliminate the chaos, trust deficit, and execution failures from every wedding in India by creating a unified, technology-powered platform that connects couples, vendors, and coordinators in one seamless system.

### 1.5 Strategic Positioning

| Dimension | Others (WedMeGood, WeddingWire) | Wedding OS |
|-----------|----------------------------------|------------|
| Core Value | Discovery & Leads | End-to-End Execution |
| Revenue | Vendor Subscriptions & Ads | Commission + SaaS + Escrow |
| Vendor Tool | Basic Profile Page | Full Booking OS / CRM |
| Execution | None — WhatsApp after | Built-in Coordination Engine |
| Payment | Off-platform | Escrow-Protected On-Platform |
| Trust Layer | Self-reported reviews | Verified + Milestone Payments |
| AI | None | Budget Optimizer + Matching |
| Day-of Tracking | None | Real-Time Vendor Check-ins |

### 1.6 Market Opportunity

- India conducts ~10 million weddings annually
- Average urban wedding spend: ₹15–25 Lakhs
- Serviceable market (digital-ready): ₹40,000 Crore in Year 1 target cities
- 10% platform commission on ₹1000 Crore GMV = **₹100 Crore Year-3 revenue target**
- SaaS revenue from 50,000 vendors at ₹1999/month = **₹120 Crore ARR potential**

---

## 2. Product Architecture

### 2.1 The Three-Core System

| System | Users | Core Purpose | Key Differentiator |
|--------|-------|--------------|-------------------|
| **Customer App (B2C)** | Couples & Families | Plan, Book, Coordinate | AI Wedding Planner + Execution Dashboard |
| **Vendor OS (B2B SaaS)** | Wedding Vendors | Manage Business | Full CRM + Booking Calendar + Payments |
| **Execution Engine** | All Stakeholders | Event Day Coordination | Real-Time Tracking + Task Management |

### 2.2 High-Level System Architecture

> **ARCHITECTURE PRINCIPLE:** Event-driven microservices with domain-separated services, unified API gateway, multi-layer caching, and zero single point of failure.

#### 2.2.1 Frontend Layer

- **Mobile App:** Flutter (iOS + Android) — Target: 60fps, <3s cold start
- **Web App:** React.js + Next.js (SSR for SEO)
- **Admin Panel:** React.js + Ant Design
- **State Management:** Zustand (React) / Riverpod (Flutter)
- **API Communication:** REST + WebSocket (real-time) + GraphQL (complex queries)

#### 2.2.2 API Gateway Layer

- Kong API Gateway — Rate limiting, auth, routing, load balancing
- JWT + Refresh Token authentication
- Request/Response validation with Zod schemas
- API versioning: `/api/v1/`, `/api/v2/`

#### 2.2.3 Microservices Layer

| Service | Responsibility | Tech Stack | DB |
|---------|---------------|------------|-----|
| Auth Service | Authentication, JWT, OAuth | Node.js + Express | PostgreSQL + Redis |
| User Service | Profiles, preferences, KYC | Node.js + Express | PostgreSQL |
| Vendor Service | Vendor profiles, portfolio | Node.js + Express | PostgreSQL + S3 |
| Search Service | Discovery, filtering, ranking | Node.js + Elasticsearch | Elasticsearch |
| Booking Service | Reservations, scheduling | Node.js + Express | PostgreSQL |
| Payment Service | Escrow, payouts, refunds | Node.js + Express | PostgreSQL |
| Execution Service | Tasks, timelines, events | Node.js + Express | PostgreSQL + Redis |
| Notification Service | Push, SMS, Email, WhatsApp | Node.js + BullMQ | Redis |
| AI Service | Recommendations, budgeting | Python + FastAPI | PostgreSQL + Pinecone |
| Analytics Service | Metrics, dashboards | Node.js + ClickHouse | ClickHouse |
| Review Service | Ratings, feedback | Node.js + Express | PostgreSQL |
| Chat Service | In-platform messaging | Node.js + Socket.io | MongoDB + Redis |

#### 2.2.4 Data Layer

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary relational database (ACID compliance) |
| Redis 7 | Session store, caching, pub/sub, rate limiting |
| Elasticsearch 8 | Vendor search, full-text search, geo-search |
| MongoDB | Chat messages, activity logs (document store) |
| ClickHouse | Analytics, event tracking, time-series data |
| AWS S3 | Media storage (photos, videos, documents) |
| Pinecone | Vector database for AI recommendations |

#### 2.2.5 Infrastructure Layer

- AWS ECS (Fargate) — Container orchestration, zero idle cost
- AWS RDS — Managed PostgreSQL with Multi-AZ for production
- AWS ElastiCache — Managed Redis
- AWS CloudFront — CDN for media, <50ms global latency
- AWS Application Load Balancer — Traffic distribution
- AWS Lambda — Serverless functions for event triggers
- Terraform — Infrastructure as Code (IaC)
- GitHub Actions — CI/CD pipeline

### 2.3 System Interaction Flow

All system interactions follow this event-driven pattern:

1. Client action triggers API request → Kong Gateway validates + routes
2. Service processes request → publishes domain event to message queue (RabbitMQ/SQS)
3. Downstream services consume events → update their state independently
4. WebSocket server pushes real-time update to connected clients
5. Analytics service records event for reporting and ML training

---

## 3. Database Design

### 3.1 Database Philosophy

> **Principle:** Read-optimized design with write separation. 80% of traffic is reads. Use denormalization where performance demands it. Every critical table has soft deletes, audit columns, and proper indexing.

### 3.2 Core Entity Relationships

```
USERS → has one PROFILE → has many BOOKINGS → has many PAYMENTS
VENDORS → has one VENDOR_PROFILE → has many PACKAGES → has many BOOKINGS
BOOKINGS → belongs to USER + VENDOR → has many MILESTONES → has many TASKS
EVENTS → has many VENDORS → has many TASKS → has one TIMELINE
PAYMENTS → belongs to BOOKING → has ESCROW_HOLD → releases to VENDOR_WALLET
```

### 3.3 Complete Database Schema

#### 3.3.1 Users & Authentication

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  role ENUM('customer','vendor','admin','coordinator') NOT NULL,
  status ENUM('active','suspended','deleted') DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  language_preference VARCHAR(20) DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  device_id VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3.2 Vendor Schema

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  category ENUM('venue','catering','photography','videography','decor',
    'makeup','mehendi','music','transport','invitation','priest','other'),
  sub_categories TEXT[],
  description TEXT,
  verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
  kyc_status ENUM('not_submitted','submitted','approved','rejected') DEFAULT 'not_submitted',
  gst_number VARCHAR(20),
  pan_number VARCHAR(15),
  cities_served TEXT[],
  years_experience INTEGER,
  team_size INTEGER,
  base_price DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'INR',
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  subscription_tier ENUM('free','premium','enterprise') DEFAULT 'free',
  subscription_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  price_type ENUM('fixed','per_plate','per_hour','per_day','custom'),
  inclusions TEXT[],
  exclusions TEXT[],
  min_guests INTEGER,
  max_guests INTEGER,
  advance_percentage DECIMAL(5,2) DEFAULT 30.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3.3 Booking & Event Schema

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  event_id UUID REFERENCES events(id),
  package_id UUID REFERENCES vendor_packages(id),
  status ENUM('enquiry','quoted','confirmed','advance_paid',
    'in_progress','completed','cancelled','disputed') DEFAULT 'enquiry',
  event_date DATE NOT NULL,
  event_time TIME,
  event_location TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  advance_amount DECIMAL(12,2),
  advance_paid BOOLEAN DEFAULT FALSE,
  final_amount DECIMAL(12,2),
  special_requirements TEXT,
  internal_notes TEXT,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  event_name VARCHAR(255) NOT NULL,
  event_type ENUM('wedding','engagement','reception','sangeet',
    'mehendi','haldi','birthday','corporate','other'),
  wedding_date DATE,
  venue_city VARCHAR(100),
  total_budget DECIMAL(12,2),
  allocated_budget DECIMAL(12,2) DEFAULT 0,
  guest_count INTEGER,
  status ENUM('planning','confirmed','in_progress','completed','cancelled'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3.4 Payment & Escrow Schema

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  payer_id UUID REFERENCES users(id),
  payee_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_type ENUM('advance','milestone','final','refund','platform_fee'),
  status ENUM('initiated','processing','success','failed','refunded') DEFAULT 'initiated',
  gateway ENUM('razorpay','stripe','manual'),
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  gateway_signature VARCHAR(500),
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  booking_id UUID REFERENCES bookings(id),
  vendor_id UUID REFERENCES vendors(id),
  held_amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL,
  vendor_payout DECIMAL(12,2) NOT NULL,
  status ENUM('holding','partial_released','fully_released','refunded','disputed'),
  hold_expiry TIMESTAMPTZ,
  release_trigger ENUM('manual','auto_7day','customer_confirm','milestone'),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Database Indexing Strategy

| Table | Index Type | Columns | Purpose |
|-------|-----------|---------|---------|
| vendors | B-tree | category, cities_served | Filtered search |
| vendors | B-tree | rating DESC | Sort by rating |
| vendors | GIN | sub_categories | Array search |
| bookings | B-tree | customer_id, status | User booking list |
| bookings | B-tree | vendor_id, event_date | Vendor calendar |
| events | B-tree | customer_id, wedding_date | Event lookup |
| payments | B-tree | booking_id, status | Payment tracking |
| users | B-tree | phone, email | Auth lookup (unique) |

---

## 4. API Design Specification

### 4.1 API Architecture Principles

- RESTful conventions: nouns for resources, HTTP verbs for actions
- Versioned endpoints: `/api/v1/` (never break existing consumers)
- Consistent response envelope: `{ success, data, error, meta }`
- Pagination: cursor-based for all list endpoints (not offset)
- Rate limiting: 100 req/min (free), 1000 req/min (premium), 10,000 req/min (vendor)
- Authentication: Bearer JWT for all protected routes
- Idempotency keys: required for all payment and booking mutations

### 4.2 Standard Response Format

```json
// Success Response
{
  "success": true,
  "data": { },
  "meta": {
    "request_id": "req_01J9X...",
    "timestamp": "2024-01-15T10:30:00Z",
    "pagination": {
      "cursor": "eyJpZCI6...",
      "has_next": true,
      "total_count": 1250
    }
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VENDOR_NOT_AVAILABLE",
    "message": "This vendor is not available on the selected date",
    "field": "event_date"
  },
  "meta": { "request_id": "req_01J9X..." }
}
```

### 4.3 Authentication API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/send-otp` | Send OTP to phone | Public |
| POST | `/api/v1/auth/verify-otp` | Verify OTP, return JWT | Public |
| POST | `/api/v1/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/api/v1/auth/logout` | Invalidate refresh token | Bearer JWT |
| POST | `/api/v1/auth/google` | Google OAuth login | Public |
| POST | `/api/v1/auth/register-vendor` | Vendor registration | Public |
| GET | `/api/v1/auth/me` | Get current user | Bearer JWT |
| PUT | `/api/v1/auth/change-password` | Change password | Bearer JWT |

### 4.4 Vendor API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/vendors` | Search/list vendors with filters | Public |
| GET | `/api/v1/vendors/:id` | Get vendor profile | Public |
| GET | `/api/v1/vendors/:id/packages` | Get vendor packages | Public |
| GET | `/api/v1/vendors/:id/reviews` | Get vendor reviews | Public |
| GET | `/api/v1/vendors/:id/availability` | Check date availability | Public |
| GET | `/api/v1/vendors/:id/portfolio` | Get portfolio media | Public |
| PUT | `/api/v1/vendors/me` | Update own vendor profile | Vendor JWT |
| POST | `/api/v1/vendors/me/packages` | Create package | Vendor JWT |
| PUT | `/api/v1/vendors/me/packages/:id` | Update package | Vendor JWT |
| POST | `/api/v1/vendors/me/availability/block` | Block dates | Vendor JWT |
| GET | `/api/v1/vendors/me/bookings` | Get own bookings | Vendor JWT |
| GET | `/api/v1/vendors/me/analytics` | Revenue & booking stats | Vendor JWT |

### 4.5 Booking API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/bookings/enquire` | Send booking enquiry | Customer JWT |
| GET | `/api/v1/bookings/:id` | Get booking details | JWT (owner) |
| GET | `/api/v1/bookings` | List user bookings | JWT |
| PUT | `/api/v1/bookings/:id/accept` | Vendor accepts booking | Vendor JWT |
| PUT | `/api/v1/bookings/:id/quote` | Vendor sends quote | Vendor JWT |
| PUT | `/api/v1/bookings/:id/confirm` | Customer confirms booking | Customer JWT |
| POST | `/api/v1/bookings/:id/pay-advance` | Pay booking advance | Customer JWT |
| PUT | `/api/v1/bookings/:id/cancel` | Cancel booking | JWT |
| PUT | `/api/v1/bookings/:id/complete` | Mark booking complete | Customer JWT |
| POST | `/api/v1/bookings/:id/dispute` | Raise a dispute | JWT |

### 4.6 Event & Execution API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/events` | Create wedding event | Customer JWT |
| GET | `/api/v1/events/:id` | Get event details + timeline | JWT |
| GET | `/api/v1/events/:id/vendors` | All booked vendors for event | JWT |
| GET | `/api/v1/events/:id/tasks` | All tasks for event | JWT |
| PUT | `/api/v1/tasks/:id/status` | Update task status | JWT |
| POST | `/api/v1/events/:id/check-in` | Vendor check-in on event day | Vendor JWT |
| GET | `/api/v1/events/:id/live-status` | Real-time event status | JWT |
| POST | `/api/v1/events/:id/issue` | Report an issue | JWT |

### 4.7 Payment API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/payments/create-order` | Create Razorpay order | Customer JWT |
| POST | `/api/v1/payments/verify` | Verify payment signature | Customer JWT |
| GET | `/api/v1/payments/:id` | Get payment details | JWT |
| GET | `/api/v1/payments/booking/:bookingId` | All payments for booking | JWT |
| POST | `/api/v1/payments/refund` | Initiate refund | Admin JWT |
| POST | `/api/v1/payments/release-escrow` | Release escrow to vendor | Admin/Auto |
| GET | `/api/v1/vendors/me/wallet` | Vendor wallet balance | Vendor JWT |
| POST | `/api/v1/vendors/me/withdraw` | Request payout to bank | Vendor JWT |

---

## 5. Security Architecture

> **SECURITY PHILOSOPHY:** Zero-trust architecture. Every request is authenticated, every action is authorized, every piece of data is encrypted, every input is validated.

### 5.1 Authentication & Authorization

#### JWT Token Strategy

- **Access Token:** Short-lived (15 minutes), RS256 signed (asymmetric key)
- **Refresh Token:** Long-lived (30 days), stored as httpOnly cookie + DB hash
- **Token Rotation:** Each refresh generates new access + refresh pair
- **Token Revocation:** Blacklist in Redis with TTL matching token expiry
- **Device binding:** Refresh tokens bound to device_id fingerprint

#### Role-Based Access Control (RBAC)

| Role | Permissions | Scope |
|------|------------|-------|
| customer | Read vendors, create bookings, manage own events | Own resources only |
| vendor | Manage own profile, view/manage own bookings, access Vendor OS | Own business only |
| coordinator | View all bookings, manage tasks, coordinate events | Assigned events only |
| admin | Full system access, approve vendors, manage disputes | System-wide |
| super_admin | All admin + billing, user deletion, system config | Unrestricted |

#### OTP Security

- OTP: 6-digit, cryptographically random, 10-minute expiry
- Rate limiting: 3 OTP requests per phone per 10 minutes
- Lockout: After 5 failed attempts, 30-minute lockout
- OTP never stored in plaintext — SHA-256 hash only

### 5.2 Data Security

- **Data in transit:** TLS 1.3 enforced everywhere, HSTS headers
- **Data at rest:** AES-256 encryption for all S3 objects and DB backups
- **PII fields:** phone, PAN, bank accounts encrypted with field-level encryption (AES-256-GCM)
- **Passwords:** bcrypt with cost factor 12
- **Payment data:** Tokenized via Razorpay — never stored on our servers
- **DPDP Act (India 2023):** Compliance built-in from day one

### 5.3 API Security

| Endpoint Type | Rate Limit | Window | Action on Breach |
|--------------|-----------|--------|-----------------|
| Public endpoints | 100 req | 1 minute | 429 + Retry-After header |
| Auth endpoints | 5 req | 1 minute | 429 + temporary IP block |
| OTP endpoint | 3 req | 10 minutes | 429 + lockout |
| Search endpoint | 200 req | 1 minute | 429 |
| Payment endpoints | 20 req | 1 minute | 429 + alert |
| Vendor OS API | 1000 req | 1 minute | Throttle gracefully |

### 5.4 Infrastructure Security

- VPC: All services in private subnets; only ALB exposed publicly
- Security Groups: Least-privilege network rules
- WAF: AWS WAF rules for OWASP Top 10 protection
- Secrets: AWS Secrets Manager (never .env files in production)
- Container security: Read-only file systems, non-root user
- Dependency scanning: Snyk + GitHub Dependabot in CI/CD

---

## 6. Customer App — Feature Specification

### 6.1 Onboarding & Authentication

**Welcome/Splash:** App logo + tagline animation (Lottie), 2.5s max, auto-login check

**Phone OTP Login:**
- Phone input with country code picker (default +91)
- OTP sent via SMS + resend after 60s
- Auto-read OTP from SMS (Android: SMS User Consent API)
- Google Sign-In as alternative
- Skip for browse-only mode

**Onboarding Wizard (First-time):**
1. Wedding type selection (own / relative / corporate)
2. Approx wedding date picker
3. City selection (searchable dropdown)
4. Guest count slider (50 / 100 / 200 / 300 / 500 / 500+)
5. Budget range selector (₹5L / ₹10L / ₹20L / ₹30L / custom)
6. → Auto-generates AI Wedding Plan

### 6.2 Home Dashboard

- AI Wedding Plan Card — budget breakdown, days to wedding, completion %
- Active Bookings Widget — vendor count, next milestone
- Vendor Categories Quick Access — 8 category chips
- Featured Vendors Carousel — curated, location-based
- Budget Tracker Mini — spent vs remaining gauge chart
- Upcoming Tasks — next 3 tasks with due dates
- Recently Viewed Vendors

### 6.3 AI Wedding Planner Engine

> This is the **HOOK FEATURE**. First thing user sees after signup. Must feel magical and personalized.

**Plan Generation:** Input (city + budget + guest count + event type + date) → AI generates 3 plan variants (Budget / Standard / Premium) with category budgets + recommended vendors.

**Default Budget Allocation (500 guests, ₹15L):**

| Category | Budget % | Amount (₹15L) |
|----------|---------|---------------|
| Venue | 35% | ₹5,25,000 |
| Catering | 28% | ₹4,20,000 |
| Decor | 15% | ₹2,25,000 |
| Photography + Video | 10% | ₹1,50,000 |
| Makeup + Mehendi | 5% | ₹75,000 |
| Music / DJ | 4% | ₹60,000 |
| Transport | 2% | ₹30,000 |
| Invitations | 1% | ₹15,000 |

### 6.4 Vendor Discovery

- Search with autocomplete (vendor name, category, service)
- Filters: Category, City, Price range, Rating, Availability date, Verified only
- Sort: Relevance / Price / Rating / Newest / Most Booked
- Map view with Google Maps cluster pins
- Vendor Profile: Cover photo, verification badge, portfolio, packages, reviews, availability calendar

### 6.5 Booking Flow

1. Select Package → review inclusions, price
2. Select Date → calendar with real-time availability
3. Add Requirements → special requests
4. Send Enquiry → vendor notified (in-app + SMS + push)
5. Vendor responds with quote
6. Customer reviews → Accept/Negotiate/Reject
7. Customer confirms → Advance payment trigger
8. Advance Payment → Razorpay checkout → Escrow hold
9. Booking confirmed → Both parties notified
10. Timeline tasks auto-generated

### 6.6 Event Execution Dashboard

**Timeline View:** T-180 → T-90 → T-60 → T-30 → T-14 → T-7 → T-1 → Event Day → T+1

**Day-Of Dashboard:**
- Live vendor check-in tracker (Green/Red)
- Timeline of events (ceremony, reception, dinner)
- One-tap vendor call / WhatsApp
- Issue reporting with photo + description
- Guest arrival counter
- Weather widget for outdoor events

### 6.7 Guest Management

- Import: Excel upload / Google Contacts sync
- RSVP tracking: Online RSVP link + manual
- Groups: Family groups, bride/groom sides
- Meal preferences (veg/non-veg/Jain)
- Table assignment
- WhatsApp bulk invite sender

### 6.8 Budget Tracker

- Real-time: Total budget vs committed vs paid
- Category breakdown pie chart
- Overspend alerts (push at 90%)
- AI savings suggestions
- PDF export

---

## 7. Vendor OS — B2B SaaS Specification

### 7.1 Vendor Onboarding

**Step 1 - Registration:** Business name, category, city, phone (OTP), GST/PAN, bank account (penny drop verified), subscription plan selection

**Step 2 - Profile Setup:** Portfolio upload (50 photos, 5 videos), package creation, service area, availability, team info

**Step 3 - Verification:** Document upload (PAN, Aadhar, business proof), admin review (24-48h SLA), verification badge

### 7.2 Lead Management (CRM)

- Kanban board: New Enquiry → Quoted → Negotiating → Confirmed → Completed
- Quick response with templates
- AI-powered lead scoring
- Auto follow-up reminders (24h)

### 7.3 Booking Calendar

- Monthly/weekly/daily view
- Colour-coded: Advance Paid / Confirmed / Enquiry / Blocked
- Conflict prevention (double-booking protection)

### 7.4 Financial Dashboard

- Revenue tracker: Monthly/quarterly/yearly
- Pending escrow with expected release dates
- Invoice generation (GST compliant)
- TDS reports
- Milestone-based payment tracking

### 7.5 Vendor Subscription Tiers

| Feature | Free | Premium (₹1999/mo) | Enterprise (₹4999/mo) |
|---------|------|-------------------|---------------------|
| Portfolio Photos | 20 | Unlimited | Unlimited + Video |
| Packages | 3 | Unlimited | Unlimited |
| Lead Access | 5/month | Unlimited | Unlimited + Priority |
| Analytics | Basic | Full Dashboard | Full + Export |
| CRM / Pipeline | No | Yes | Yes + AI Insights |
| Commission Rate | 12% | 10% | 8% |

---

## 8. Execution Engine — The Secret Weapon

> The Execution Engine is what no competitor has built. This is the moat.

### 8.1 Task & Timeline Engine

Auto-generated task templates on booking confirmation based on event type, days until event, booked vendors, and budget allocation.

### 8.2 Event Day Coordination

1. D-1: Runsheet sent to all vendors (WhatsApp + in-app)
2. Event day 8 AM: Auto-reminder push to all vendors
3. Vendor check-in: 'I have arrived' button with GPS verification
4. Alert: Vendor not checked in 30 min before → escalation
5. Real-time issue reporting → coordinator notified
6. Event completion → Escrow auto-release after 7-day window

### 8.3 Dispute Resolution

- Dispute within 48h → Escrow frozen
- Evidence collection from both parties
- Coordinator review within 72h
- Resolution: Full release / Partial release / Full refund
- One appeal within 7 days

---

## 9. AI/ML Layer

| AI Feature | Input | Output | Model |
|-----------|-------|--------|-------|
| Budget Optimizer | City, guests, budget, event type | Category-wise breakdown (3 tiers) | Custom regression |
| Vendor Recommender | User preferences, bookings, rating | Ranked vendor list | Collaborative filtering |
| Price Predictor | Vendor, date, guests, city | Price estimate range | XGBoost |
| Review Analyzer | Review text | Sentiment, authenticity score | Fine-tuned BERT |
| Fraud Detector | User behavior patterns | Risk score 0–100 | Isolation Forest |
| Smart Scheduling | Vendor availability, timeline | Optimal task schedule | Constraint optimization |
| Chatbot | User questions | Wedding planning guidance | Claude API / GPT-4o |

**Vendor Recommendation Score:**
```
Score = (Rating × 0.30) + (Relevance × 0.25) + (Availability × 0.20) + (Price Match × 0.15) + (Response Rate × 0.10)
```

---

## 10. Payment & Escrow System

### 10.1 Payment Flow

1. Customer initiates → Server creates Razorpay order
2. Client opens Razorpay checkout (UPI, cards, NetBanking, wallets)
3. Payment completes → Razorpay webhook
4. Server verifies HMAC-SHA256 signature
5. Payment recorded → Escrow hold created
6. Platform fee deducted (10%) → Vendor payout calculated
7. Escrow hold until event + 7-day review window
8. Vendor payout via Razorpay

### 10.2 Escrow States

| State | Description | Trigger |
|-------|-------------|---------|
| HOLDING | Money received, waiting for event | Payment verified |
| PARTIAL_RELEASED | Some milestones released | Milestone confirmed |
| RELEASE_PENDING | Event complete, 7-day window | Event completion |
| FULLY_RELEASED | Full vendor payout sent | 7-day window passed |
| DISPUTED | Dispute raised, frozen | Dispute filed within 48h |
| REFUNDED | Customer refund processed | Dispute resolved for customer |

### 10.3 Platform Fee Structure

| Transaction Type | Platform Fee | GST on Fee | Net to Platform |
|-----------------|-------------|-----------|----------------|
| Standard booking | 10% | 18% on fee | 8.2% net |
| Premium vendor | 8% | 18% on fee | 6.56% net |
| Featured vendor | 10% + ₹500 premium | 18% | Higher margin |

---

## 11. Performance Architecture

> **TARGET BENCHMARKS:** API P99 < 200ms | App startup < 3s | Search results < 500ms | Image load < 1s | 99.9% uptime

### 11.1 Caching Strategy

| Layer | Technology | What is Cached | TTL |
|-------|-----------|---------------|-----|
| CDN | CloudFront | Static assets, images, videos | 1 year |
| Application | Redis | Vendor search results | 5 min |
| Application | Redis | User session data | 15 min |
| Application | Redis | Vendor profiles (hot) | 30 min |
| Application | Redis | AI recommendations | 1 hour |
| Mobile | SQLite (Flutter) | User bookings, events | Offline-capable |

### 11.2 Horizontal Scaling

| Service | Scale Trigger | Max Instances |
|---------|--------------|--------------|
| API Gateway | CPU >70% or RPS >5000 | 20 |
| Auth Service | CPU >60% | 10 |
| Search Service | P99 >300ms | 8 |
| Notification Service | Queue depth >10,000 | 15 |
| AI Service | CPU >80% | 5 |
| WebSocket Service | Connections >10,000/pod | 10 |

---

## 12. DevOps, CI/CD & Infrastructure

### 12.1 CI/CD Pipeline

1. PR Created → lint + type-check + unit tests
2. Tests pass → SAST (SonarQube) + dependency scan (Snyk)
3. Security gate passed → Build Docker image
4. Merge to develop → Deploy to staging (auto)
5. Manual approval → Deploy to production
6. Post-deploy → Smoke tests + health check

### 12.2 Environments

| Environment | Branch | Purpose | Deploy Trigger |
|------------|--------|---------|---------------|
| Local | feature/* | Developer testing | Manual |
| Staging | develop | QA + integration testing | Auto on merge |
| Pre-prod | release/* | Final validation, load test | Auto on release branch |
| Production | main | Live users | Manual approval required |

### 12.3 Monitoring & Observability

- **Metrics:** CloudWatch + Grafana
- **Logs:** Structured JSON → CloudWatch Logs → Loki
- **Traces:** OpenTelemetry → Jaeger

### 12.4 Disaster Recovery

- **RTO:** 1 hour | **RPO:** 15 minutes
- Automated daily snapshots + point-in-time recovery
- Multi-AZ: Primary DB + hot standby
- Monthly DR drills

---

## 13. Phase-Wise Implementation Plan

| Phase | Duration | Goal | Revenue Target |
|-------|---------|------|---------------|
| **Phase 1: Validation** | Month 0–2 | Prove demand (no-code) | ₹0 (invest mode) |
| **Phase 2: MVP** | Month 2–5 | Live bookable platform | ₹1–5L GMV/month |
| **Phase 3: Traction** | Month 5–10 | Product-market fit | ₹50L+ GMV/month |
| **Phase 4: Differentiation** | Month 10–18 | Execution Engine live | ₹2Cr+ GMV/month |
| **Phase 5: Scale** | Month 18+ | Multi-city, AI-powered | ₹20Cr+ GMV/month |

### Phase 1: Validation (Month 0–2)

> **RULE:** Do NOT write complex code. Validate demand with no-code tools.

- Landing page (Next.js or Webflow)
- Google Form: Vendor onboarding
- Airtable: Vendor database
- WhatsApp Business: Customer support
- Instagram: Organic content

**Go/No-Go for Phase 2:** 500+ visitors, 50+ vendor apps, 10+ couples use budget planner, 3+ willing to pay

### Phase 2: MVP (Month 2–5)

**Tech:** Node.js + Express (monolith first), PostgreSQL on Supabase, Next.js + Flutter, Razorpay

| Feature | Priority | Effort | Week Target |
|---------|----------|--------|------------|
| OTP Auth (Phone) | P0 | 3 days | Week 1 |
| Vendor Profile CRUD | P0 | 5 days | Week 1–2 |
| Vendor Search (basic) | P0 | 4 days | Week 2 |
| Enquiry System | P0 | 3 days | Week 2–3 |
| Booking Confirmation | P0 | 4 days | Week 3 |
| Razorpay Integration | P0 | 5 days | Week 3–4 |
| Basic Escrow Hold | P0 | 4 days | Week 4 |
| Push Notifications | P1 | 3 days | Week 5 |
| Vendor Dashboard | P1 | 6 days | Week 5–6 |
| AI Budget Planner (v1) | P1 | 8 days | Week 7–8 |
| Review System | P1 | 4 days | Week 8 |
| Customer Dashboard | P1 | 5 days | Week 8–10 |

### Phase 3: Traction (Month 5–10)

- Elasticsearch for advanced search
- Full Vendor OS (CRM, analytics, subscription)
- Guest management
- Budget tracker
- SMS + WhatsApp notifications
- Admin panel
- Referral system

### Phase 4: Differentiation (Month 10–18)

- Execution Engine: Task system, timeline, day-of dashboard
- Escrow 2.0: Milestone-based release
- AI Planner 2.0: Personalized recommendations, chatbot
- Coordinator Portal
- ClickHouse analytics

### Phase 5: Scale (Month 18+)

- Multi-city: Mumbai, Delhi, Bangalore, Chennai, Pune
- Vernacular language support
- Wedding loans (NBFC partnership)
- Wedding insurance
- Corporate events expansion

---

## 14. Infrastructure Cost Trajectory

| Phase | Monthly Cost | Strategy |
|-------|-------------|---------|
| Validation (0–2 months) | ₹0 | AWS Free Tier, Vercel free, Supabase free |
| MVP (2–5 months) | ₹5,000–15,000 | t3.small RDS, ECS Fargate minimal |
| Traction (5–10 months) | ₹30,000–60,000 | Auto-scaling with revenue |
| Growth (10–18 months) | ₹1–3L/month | Multi-AZ, Read replicas |
| Scale (18+ months) | ₹5–15L/month | Multi-region, CDN, dedicated |

---

## 15. Go-to-Market Strategy

### Launch City: Hyderabad

- ₹15,000–40,000 Crore local wedding market
- Tech-savvy, high smartphone penetration
- Strong Telugu diaspora (referral-friendly)
- Lower competition, 2,000+ wedding vendors
- Founder's location advantage

### Pricing Strategy

| Stage | Commission | Vendor Subscription | Customer |
|-------|-----------|-------------------|----------|
| Month 0–3 (Launch) | 0% (waived) | Free for all | Free planning tools |
| Month 3–6 (Build) | 5% (intro) | Free / ₹999 premium | Free planning tools |
| Month 6+ (Normal) | 10% standard | Free / ₹1999 / ₹4999 | Free planning tools |

---

## 16. Testing Strategy

- **Test Pyramid:** 70% unit, 20% integration, 10% E2E
- **Auth + Payment:** 100% coverage
- **Everything else:** 80% minimum
- **Load Testing:** k6 — 1,000 concurrent users, P99 <200ms
- **E2E Critical Paths:** Register → Search → Enquire → Quote → Pay → Complete → Payout

---

## 17. UI/UX Design System

### Color System

| Token | Hex | Usage |
|-------|-----|-------|
| --color-primary | #7B2D8B | Brand purple — CTAs, links |
| --color-secondary | #E91E8C | Pink accent — love, emotion |
| --color-gold | #C9A82C | Gold — premium, milestone |
| --color-success | #2E7D32 | Green — confirmed, verified |
| --color-error | #C62828 | Red — errors, alerts |
| --color-warning | #F57F17 | Amber — warnings, pending |
| --color-neutral-900 | #1A0A2E | Near-black for body text |

### Accessibility

- WCAG 2.1 Level AA compliance
- Color contrast: 4.5:1 for text, 3:1 for large text
- Full keyboard navigation, screen reader support
- Font scaling up to 200%

---

## 18. Business Rules & Edge Cases

### Booking Rules

- Max 3 bookings per vendor per date (multi-team)
- Minimum advance booking: 7 days
- Maximum advance booking: 24 months
- Vendor response window: 48h (auto-expire)
- Quote validity: 72 hours
- Advance payment: within 24h of quote acceptance

### Cancellation Policy

| Days Before Event | Refund % | Platform Fee Refunded |
|------------------|---------|---------------------|
| 90+ days | 100% | Yes |
| 60–89 days | 75% | No |
| 30–59 days | 50% | No |
| 14–29 days | 25% | No |
| <14 days | 0% | No |
| Vendor cancels (any time) | 100% + penalty | Yes |
| Force majeure | 100%, waive penalty | Yes |

### Compliance

- RBI payment aggregator compliance
- GST registration (>₹20L/year)
- TDS on vendor payouts (1% if >₹30,000/year)
- DPDP Act 2023 (data localization — AWS ap-south-1)
- Consumer Protection Act (refund SLA: 5-7 business days)

---

## 19. Technology Stack Reference

| Technology | Version | Purpose | License |
|-----------|---------|---------|---------|
| Flutter | 3.19+ | Cross-platform mobile | BSD |
| React.js | 18+ | Web frontend | MIT |
| Next.js | 14+ | Web SSR + SEO | MIT |
| Node.js | 20 LTS | Backend services | MIT |
| PostgreSQL | 16+ | Primary database | PostgreSQL |
| Redis | 7+ | Cache + session + queue | BSD |
| Elasticsearch | 8+ | Full-text + geo search | SSPL |
| Kong | 3.5+ | API Gateway | Apache 2.0 |
| BullMQ | 5+ | Job queue (Redis-based) | MIT |
| Socket.io | 4+ | WebSocket real-time | MIT |
| Prisma | 5+ | PostgreSQL ORM | Apache 2.0 |
| Zod | 3+ | Runtime type validation | MIT |
| Razorpay | Latest SDK | Payment processing | Commercial |
| Terraform | 1.6+ | Infrastructure as Code | MPL 2.0 |

---

*END OF DOCUMENT — Wedding OS PRD v1.0*
