# Sprint 3: Execution Engine, Notifications & Event System

> **Duration:** 2 days | **Priority:** P0 — The Moat Feature
> **Goal:** Auto-generated task timelines, event-day coordination, multi-channel notifications

---

## 3.1 Execution Service — Task & Timeline Engine

### Current State
- Prisma: `WeddingTimeline`, `TimelineTask`, `TaskTemplate` models exist
- Server runs on port 4006
- No business logic implemented

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 3.1.1 | **Seed task templates** | `prisma/seed.ts` — Create 25+ task templates for wedding event type: venue booking (D-90), catering menu (D-60), save-the-dates (D-60), photography briefing (D-30), final headcount (D-14), vendor runsheet (D-7), venue walkthrough (D-3), vendor briefing (D-1), check-in (D+0), escrow release (D+1) | 2h |
| 3.1.2 | **Auto-generate tasks on booking confirmation** | `src/services/task-generator.service.ts` — On `BOOKING_CONFIRMED` event: fetch templates for event type, calculate absolute dates from wedding date, create timeline + tasks. Skip tasks for already-booked categories | 3h |
| 3.1.3 | **Task management API** | `src/routes/execution.routes.ts` — GET /events/:id/tasks (list by status), PUT /tasks/:id/status (update: pending→in_progress→completed), POST /events/:id/tasks (add custom task), DELETE /tasks/:id | 2h |
| 3.1.4 | **Timeline visualization API** | GET /events/:id/timeline — Return ordered tasks grouped by phase (T-180, T-90, T-60, T-30, T-14, T-7, T-1, T+0, T+1) with completion percentage per phase | 1h |
| 3.1.5 | **Due date alert job** | `src/jobs/task-due-alert.job.ts` — BullMQ cron: every morning 9 AM, find tasks due in next 3 days, emit notification events | 1h |
| 3.1.6 | **Event day check-in** | POST /events/:id/check-in — Vendor taps "I have arrived", store GPS coordinates + timestamp, broadcast to event room via Socket.io | 2h |
| 3.1.7 | **Runsheet generation** | GET /events/:id/runsheet — Aggregate all booked vendors for event, their arrival times, tasks, contacts. Return as JSON (frontend renders) + generate PDF | 2h |
| 3.1.8 | **Real-time event room** | `src/handlers/event-room.handler.ts` — Socket.io: join event_:id room, broadcast check-ins, task updates, issue reports. Redis adapter for horizontal scaling | 2h |

### Acceptance Criteria
- [ ] When booking is confirmed, timeline with 10+ tasks auto-created
- [ ] Tasks have correct absolute dates based on wedding date
- [ ] Vendors can check in with GPS on event day
- [ ] All connected clients see real-time check-in status
- [ ] Overdue tasks trigger notification alerts

---

## 3.2 Notification Service — Multi-Channel Fan-Out

### Current State
- Prisma: `NotificationLog` model exists
- Server runs on port 4008
- No actual sending logic (SMS/Push/Email/WhatsApp all missing)

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 3.2.1 | **Event consumer** | `src/consumers/notification.consumer.ts` — Listen for domain events (booking_confirmed, payment_captured, task_due, vendor_checked_in, etc.), determine channel (push/SMS/email/WhatsApp), enqueue to BullMQ | 2h |
| 3.2.2 | **SMS sender (MSG91)** | `src/channels/sms.channel.ts` — Send SMS via MSG91 API. Template-based messages. Dev mode: log to console. Prod mode: actual API call. Handle delivery status | 2h |
| 3.2.3 | **Push notification (FCM)** | `src/channels/push.channel.ts` — Send via Firebase Admin SDK. Store FCM tokens from user-service. Handle token refresh. Android + iOS config | 2h |
| 3.2.4 | **Email sender (SendGrid/Resend)** | `src/channels/email.channel.ts` — Transactional emails: booking confirmation, payment receipt, review prompt. HTML templates | 2h |
| 3.2.5 | **WhatsApp (360dialog)** | `src/channels/whatsapp.channel.ts` — Template messages: booking confirmed, runsheet D-1, payment receipt. Requires pre-approved templates | 1h |
| 3.2.6 | **In-app notifications** | `src/channels/inapp.channel.ts` — Store in DB (NotificationLog), expose via GET /notifications (paginated, unread count), mark-read endpoint | 1h |
| 3.2.7 | **Notification preferences** | Check user's notification_preferences before sending (user may disable email or WhatsApp) | 1h |
| 3.2.8 | **Notification templates** | `src/templates/` — Parameterized templates for each event type: `booking_enquiry`, `booking_confirmed`, `payment_received`, `task_due`, `vendor_checked_in`, `escrow_released` | 2h |

### Acceptance Criteria
- [ ] Booking confirmation triggers: in-app + SMS + email to both parties
- [ ] Payment captured triggers: in-app + SMS + email
- [ ] Task due triggers: push notification
- [ ] Vendor check-in triggers: push to customer + coordinator
- [ ] User can opt out of specific channels
- [ ] All notifications logged in NotificationLog with delivery status

---

## 3.3 Event Service — Wedding Event Management

### Current State
- Events are referenced in booking-service schema but no dedicated event management
- No standalone event CRUD API

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 3.3.1 | **Add Events schema to booking-service** | Update Prisma: `Event` model with customer_id, event_name, event_type, wedding_date, venue_city, total_budget, guest_count, status | 1h |
| 3.3.2 | **Event CRUD API** | POST /events (create), GET /events/:id (detail + timeline), GET /events (list user's events), PUT /events/:id (update) | 2h |
| 3.3.3 | **Event vendors aggregate** | GET /events/:id/vendors — List all confirmed bookings for this event with vendor details | 1h |
| 3.3.4 | **Budget tracking** | GET /events/:id/budget — Total budget vs committed (sum of confirmed booking amounts) vs paid (sum of payments). Per-category breakdown | 1h |
| 3.3.5 | **Event status machine** | planning → confirmed → in_progress → completed → cancelled. Auto-transitions based on wedding date | 1h |

### Acceptance Criteria
- [ ] Customer can create wedding event with date, city, budget, guest count
- [ ] Event aggregates all bookings, payments, and tasks
- [ ] Budget tracker shows real-time spent vs remaining
