# Sprint 7: Documentation, OpenAPI, ADRs, Security Hardening & Polish

> **Duration:** 2 days | **Priority:** P1
> **Goal:** Production readiness — API docs, architecture decisions, security audit, performance, monitoring

---

## 7.1 OpenAPI Specifications

### Current State
- `docs/openapi/` is completely empty
- No Swagger/Redoc documentation for any service

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 7.1.1 | **Auth service OpenAPI** | `docs/openapi/auth-service.yaml` — All endpoints: send-otp, verify-otp, refresh, logout, google-oauth, me. Request/response schemas, error codes, examples | 1h |
| 7.1.2 | **Vendor service OpenAPI** | `docs/openapi/vendor-service.yaml` — CRUD, search, packages, portfolio, availability | 1h |
| 7.1.3 | **Booking service OpenAPI** | `docs/openapi/booking-service.yaml` — Full lifecycle: enquire, quote, confirm, pay, complete, cancel, dispute | 1h |
| 7.1.4 | **Payment service OpenAPI** | `docs/openapi/payment-service.yaml` — Create order, verify, webhooks, escrow, payouts | 1h |
| 7.1.5 | **All remaining services** | OpenAPI specs for user, execution, notification, review, chat, search, media, AI services | 3h |
| 7.1.6 | **Swagger UI integration** | Each service serves Swagger UI at `/docs` endpoint using swagger-ui-express | 1h |

---

## 7.2 Architecture Decision Records

### Current State
- `docs/adr/` is empty
- Master Bible defines 10 ADRs that should be documented

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 7.2.1 | **ADR-001: Database per service vs shared** | `docs/adr/001-database-per-service.md` | 15m |
| 7.2.2 | **ADR-002: Modular monolith → microservices** | `docs/adr/002-modular-first.md` | 15m |
| 7.2.3 | **ADR-003: Flutter for mobile** | `docs/adr/003-flutter-mobile.md` | 15m |
| 7.2.4 | **ADR-004: JWT RS256** | `docs/adr/004-jwt-rs256.md` | 15m |
| 7.2.5 | **ADR-005: REST primary** | `docs/adr/005-rest-primary.md` | 15m |
| 7.2.6 | **ADR-006: BullMQ for job queues** | `docs/adr/006-bullmq.md` | 15m |
| 7.2.7 | **ADR-007: Elasticsearch for search** | `docs/adr/007-elasticsearch.md` | 15m |
| 7.2.8 | **ADR-008: Razorpay for payments** | `docs/adr/008-razorpay.md` | 15m |
| 7.2.9 | **ADR-009: Managed databases** | `docs/adr/009-managed-databases.md` | 15m |
| 7.2.10 | **ADR-010: pnpm + Turborepo** | `docs/adr/010-pnpm-turborepo.md` | 15m |

---

## 7.3 Security Hardening

### Current State
- JWT RS256 ✅, OTP hashing ✅, rate limiting ✅, helmet ✅
- Missing: CSRF, PII encryption, security scanning, WAF

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 7.3.1 | **CSRF protection** | Add `csurf` middleware for state-changing requests on web routes (not API). SameSite=Strict cookies | 1h |
| 7.3.2 | **PII field encryption** | `packages/shared-utils/src/encryption.ts` — AES-256-GCM encrypt/decrypt for phone, PAN, bank account numbers at rest. Apply to user-service + payment-service | 2h |
| 7.3.3 | **Input sanitization** | Add DOMPurify/xss for any user-generated text fields (review text, vendor description, chat messages) | 1h |
| 7.3.4 | **Security headers** | Verify all services: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy | 30m |
| 7.3.5 | **Dependency audit** | Run `pnpm audit` and fix all high/critical vulnerabilities. Add to CI pipeline | 1h |
| 7.3.6 | **Rate limit per endpoint** | Fine-tune: auth 5/min, OTP 3/10min, search 200/min, payment 20/min (currently global only) | 1h |
| 7.3.7 | **RBAC middleware audit** | Verify every route checks correct role: customer-only, vendor-only, admin-only, owner-only | 1h |

---

## 7.4 Monitoring & Observability

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 7.4.1 | **Structured logging** | Verify all services use pino with JSON format. Add request_id, user_id, service_name to every log | 1h |
| 7.4.2 | **Health check standardization** | Every service: GET /health returns { status, service, version, uptime, db_connected, dependencies } | 1h |
| 7.4.3 | **Error tracking** | Add Sentry SDK to all services + frontend apps. Source maps for frontend | 2h |
| 7.4.4 | **Request tracing** | Add OpenTelemetry spans to cross-service HTTP calls. Propagate trace_id via headers | 2h |
| 7.4.5 | **Metrics endpoint** | Each service: GET /metrics — request count, error rate, response time histogram (Prometheus format) | 1h |

---

## 7.5 Performance Optimization

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 7.5.1 | **Redis caching layer** | Cache vendor profiles (30min TTL), search results (5min TTL), user sessions (15min TTL). Cache invalidation on write | 2h |
| 7.5.2 | **Database connection pooling** | Configure Prisma connection pool: min 5, max 20 per service. Add PgBouncer to docker-compose | 1h |
| 7.5.3 | **Query optimization** | Add database indices per PRD Section 3.4: vendors(category, cities_served), bookings(customer_id, status), bookings(vendor_id, event_date), payments(booking_id, status) | 1h |
| 7.5.4 | **Image optimization** | Configure sharp in media-service: auto-convert to WebP, generate 3 sizes (thumb 200px, medium 600px, large 1200px) | 2h |
| 7.5.5 | **Frontend bundle optimization** | Next.js: analyzer, code splitting. Vite: chunk splitting. Target <350KB initial JS | 1h |

---

## 7.6 Privacy & Compliance

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 7.6.1 | **Cookie consent banner** | `apps/web` — Accept All / Manage / Reject. Store consent in localStorage + DB | 1h |
| 7.6.2 | **Data export endpoint** | GET /users/me/data-export — Generate ZIP: profile.json, bookings.json, payments.json, reviews.json, messages.json | 2h |
| 7.6.3 | **Account deletion** | DELETE /users/me — Anonymize PII (hash phone, remove name), soft-delete, 7-day grace period | 1h |
| 7.6.4 | **Privacy policy page** | `apps/web/src/app/privacy/page.tsx` + `apps/web/src/app/terms/page.tsx` | 1h |
| 7.6.5 | **Consent tracking** | Log all consent events with timestamp + IP in audit_log table | 1h |

---

## 7.7 Operational Runbooks

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 7.7.1 | **Service restart runbook** | `docs/runbooks/service-restart.md` — How to restart each service, check health, rollback | 30m |
| 7.7.2 | **Database recovery** | `docs/runbooks/database-recovery.md` — Backup, restore, point-in-time recovery | 30m |
| 7.7.3 | **Payment incident** | `docs/runbooks/payment-incident.md` — Stuck payment, failed webhook, manual escrow release | 30m |
| 7.7.4 | **Scaling runbook** | `docs/runbooks/scaling.md` — When and how to scale each service | 30m |

### Acceptance Criteria
- [ ] All API endpoints documented in OpenAPI with examples
- [ ] Swagger UI accessible at /docs for each service
- [ ] 10 ADRs documented
- [ ] All security headers present and correct
- [ ] PII encrypted at rest
- [ ] Sentry tracking errors in all services
- [ ] Redis caching reduces vendor search latency by 50%+
- [ ] Cookie consent + data export + account deletion working
- [ ] 4 operational runbooks written
