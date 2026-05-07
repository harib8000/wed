# Sprint 4: AI Service, Search Enhancement & Vendor KYC

> **Duration:** 2 days | **Priority:** P1
> **Goal:** Working AI budget planner, proper Elasticsearch search, and vendor verification pipeline

---

## 4.1 AI Service — Budget Optimizer & Recommender

### Current State
- FastAPI main.py exists with placeholder routes
- No actual algorithm implementation

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 4.1.1 | **Budget optimizer endpoint** | `services/ai-service/src/budget_optimizer.py` — POST /ai/budget-plan. Input: city, budget_inr, guest_count, event_type, wedding_date. Algorithm: (1) base allocation weights per category (venue:35%, catering:28%, decor:15%, photo:10%, makeup:5%, music:4%, transport:2%, invitations:1%), (2) city multiplier (HYD:1.0, MUM:1.35, DEL:1.25, BLR:1.20), (3) guest scaling (non-linear), (4) seasonal adjustment (+15% Nov-Feb, +10% Oct, -10% Jun-Aug). Output: 3 tiers (budget/standard/premium) + insights | 4h |
| 4.1.2 | **Vendor recommender** | `src/recommender.py` — GET /ai/recommend-vendors. Score = Rating×0.30 + Relevance×0.25 + Availability×0.20 + PriceMatch×0.15 + ResponseRate×0.10. Query vendor-service for candidates, rank, return top 5 per category | 3h |
| 4.1.3 | **Smart insights generator** | Part of budget-plan response. Compare user's allocation to platform average: "Your catering budget is 15% below market rate for 500 guests in Hyderabad" | 1h |
| 4.1.4 | **AI chatbot endpoint** | `src/chatbot.py` — POST /ai/chat. System prompt with wedding planning context + user's event details. Use OpenAI/Claude API. Conversation history management | 2h |
| 4.1.5 | **Price predictor** | `src/price_predictor.py` — GET /ai/price-estimate. Given vendor category, city, date, guest count → estimated price range. Rule-based initially, ML when data available | 2h |
| 4.1.6 | **Unit tests** | `tests/test_budget_optimizer.py` — Test allocation math, city multipliers, seasonal adjustments, edge cases (zero budget, 10K guests) | 1h |

### Acceptance Criteria
- [ ] Budget plan returns 3 tiers with correct allocation percentages
- [ ] City multiplier correctly adjusts prices
- [ ] Seasonal adjustment applies for peak months
- [ ] Vendor recommendations score and rank correctly
- [ ] AI chatbot returns contextual wedding planning advice

---

## 4.2 Search Service — Elasticsearch Enhancement

### Current State
- Elasticsearch client configured
- Basic text search + city filter
- Missing: geo-search, autocomplete, real-time sync, ranking

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 4.2.1 | **Proper ES index mapping** | `src/services/search.service.ts` — Index mapping with: text fields (business_name, description) with analyzers, keyword fields (category, cities_served, verification_status), numeric (rating, base_price, total_reviews), geo_point (location), nested (packages with name/price) | 2h |
| 4.2.2 | **Multi-filter query builder** | Support: category (term), city (term), price range (range), rating min (range), verified only (term), availability date (must not match booked dates) | 2h |
| 4.2.3 | **Custom ranking** | Boost: verified vendors ×1.5, featured ×2.0, response_rate>80% ×1.2. Penalize: low rating, no portfolio photos | 1h |
| 4.2.4 | **Autocomplete endpoint** | GET /search/autocomplete?q=pho — Completion suggester on business_name + category. Return top 5 suggestions with type indicator | 1h |
| 4.2.5 | **Geo search** | GET /search/vendors?lat=X&lng=X&radius=20km — geo_distance filter. Requires vendors indexed with lat/lng | 1h |
| 4.2.6 | **Real-time sync** | `src/consumers/vendor-sync.consumer.ts` — On `VENDOR_UPDATED` event from vendor-service, update/remove from ES index. On new vendor creation, index. On vendor deletion, remove | 2h |
| 4.2.7 | **Bulk reindex script** | `scripts/reindex-vendors.ts` — One-time script to pull all vendors from PostgreSQL and bulk index to Elasticsearch | 1h |

### Acceptance Criteria
- [ ] Search returns relevant results with proper ranking
- [ ] Autocomplete returns suggestions within 100ms
- [ ] Filters (category, city, price, rating) work correctly
- [ ] New/updated vendors appear in search within 5 seconds

---

## 4.3 Vendor KYC Pipeline

### Current State
- user-service has KycDocument model
- vendor-service has kyc_status field
- No actual verification flow

### Tasks

| # | Task | Files | Est |
|---|------|-------|-----|
| 4.3.1 | **Document upload API** | `services/user-service` — POST /users/me/kyc: Upload PAN card image, Aadhaar (optional), business registration proof. Use media-service presign for S3 upload | 2h |
| 4.3.2 | **PAN verification** | `services/user-service/src/services/kyc.service.ts` — Integrate Surepass/AuthBridge API for PAN verification: POST with PAN number → response with name, DOB, validity. Match name against vendor business_name | 2h |
| 4.3.3 | **GST verification** | Same file — Verify GST number via gstincheck.co.in API or Surepass. Validate GSTIN belongs to vendor | 1h |
| 4.3.4 | **Bank account penny drop** | Same file — Via Razorpay Fund Account API: create contact → create fund account → validate with ₹1 penny drop. Store verified bank details | 2h |
| 4.3.5 | **Admin KYC review API** | `services/user-service` — GET /admin/kyc-queue (pending documents), PUT /admin/kyc/:id/approve, PUT /admin/kyc/:id/reject (with reason). Update vendor verification_status | 2h |
| 4.3.6 | **KYC status webhook** | On KYC approval: update vendor.verification_status → 'verified', emit VENDOR_VERIFIED event, send notification | 1h |

### Acceptance Criteria
- [ ] Vendor can submit PAN, GST, bank details for verification
- [ ] PAN number validated against external API
- [ ] GST number validated
- [ ] Bank account verified via penny drop
- [ ] Admin can review, approve, or reject KYC with reason
- [ ] Vendor gets verified badge on approval
