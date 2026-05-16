-- =============================================================================
-- WeddingOS Development Seed Data
-- =============================================================================
-- This script populates development databases with sample data.
-- Run AFTER Prisma migrations have been applied.
-- Usage: psql -U weddingos -f scripts/seed/seed-data.sql
-- =============================================================================

-- ── Auth Service Database ────────────────────────────────────────────────────

\c weddingos_auth;

-- Sample users (phone-based auth)
INSERT INTO "User" (id, phone, role, "isVerified", "createdAt", "updatedAt") VALUES
  ('usr_customer_001', '+919876543210', 'customer', true, NOW(), NOW()),
  ('usr_customer_002', '+919876543211', 'customer', true, NOW(), NOW()),
  ('usr_customer_003', '+919876543212', 'customer', true, NOW(), NOW()),
  ('usr_vendor_001', '+919876543220', 'vendor', true, NOW(), NOW()),
  ('usr_vendor_002', '+919876543221', 'vendor', true, NOW(), NOW()),
  ('usr_vendor_003', '+919876543222', 'vendor', true, NOW(), NOW()),
  ('usr_admin_001', '+919876543230', 'admin', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── User Service Database ────────────────────────────────────────────────────

\c weddingos_users;

INSERT INTO "UserProfile" (id, "userId", "displayName", email, city, state, "weddingDate", "createdAt", "updatedAt") VALUES
  ('prof_001', 'usr_customer_001', 'Priya Sharma', 'priya@example.com', 'Mumbai', 'Maharashtra', '2026-12-15', NOW(), NOW()),
  ('prof_002', 'usr_customer_002', 'Rahul Patel', 'rahul@example.com', 'Bangalore', 'Karnataka', '2026-11-20', NOW(), NOW()),
  ('prof_003', 'usr_customer_003', 'Ananya Reddy', 'ananya@example.com', 'Hyderabad', 'Telangana', '2027-01-10', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Vendor Service Database ──────────────────────────────────────────────────

\c weddingos_vendors;

INSERT INTO "Vendor" (id, "userId", "businessName", slug, category, city, state, pincode, status, "avgRating", "reviewCount", "bookingCount", "plusMember", "isFeatured", "createdAt", "updatedAt") VALUES
  ('vnd_001', 'usr_vendor_001', 'Royal Lens Photography', 'royal-lens-photography-mumbai-abc12', 'PHOTOGRAPHY', 'Mumbai', 'Maharashtra', '400001', 'ACTIVE', 4.8, 127, 89, true, true, NOW(), NOW()),
  ('vnd_002', 'usr_vendor_002', 'Spice Route Catering', 'spice-route-catering-bangalore-def34', 'CATERING', 'Bangalore', 'Karnataka', '560001', 'ACTIVE', 4.6, 95, 67, true, false, NOW(), NOW()),
  ('vnd_003', 'usr_vendor_003', 'Blooming Petals Decor', 'blooming-petals-decor-hyderabad-ghi56', 'DECORATION', 'Hyderabad', 'Telangana', '500001', 'ACTIVE', 4.9, 82, 54, false, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "VendorPackage" (id, "vendorId", name, "packageType", "priceFromPaise", description, inclusions, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  ('pkg_001', 'vnd_001', 'Essential', 'BASIC', 5000000, 'Pre-wedding + wedding day coverage', '{"2 photographers","500 edited photos","Online gallery"}', true, 1, NOW(), NOW()),
  ('pkg_002', 'vnd_001', 'Premium', 'PREMIUM', 12000000, 'Full day + drone + album', '{"3 photographers","Drone coverage","1000 edited photos","Premium album","Online gallery"}', true, 2, NOW(), NOW()),
  ('pkg_003', 'vnd_002', 'Silver', 'BASIC', 8000000, 'Up to 200 guests', '{"Veg & Non-Veg menu","Welcome drinks","Dessert counter"}', true, 1, NOW(), NOW()),
  ('pkg_004', 'vnd_002', 'Gold', 'PREMIUM', 15000000, 'Up to 500 guests', '{"Multi-cuisine buffet","Live counters","Bar service","Dessert counter"}', true, 2, NOW(), NOW()),
  ('pkg_005', 'vnd_003', 'Classic Floral', 'BASIC', 3000000, 'Stage + mandap decoration', '{"Stage decoration","Mandap setup","Entrance arch","50 table centerpieces"}', true, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Booking Service Database ─────────────────────────────────────────────────

\c weddingos_bookings;

INSERT INTO "Booking" (id, "customerId", "vendorId", "packageId", status, "eventType", "eventDate", "guestCount", "totalPaise", "advancePaise", "createdAt", "updatedAt") VALUES
  ('bk_001', 'usr_customer_001', 'vnd_001', 'pkg_002', 'CONFIRMED', 'WEDDING', '2026-12-15', 300, 12000000, 3600000, NOW(), NOW()),
  ('bk_002', 'usr_customer_001', 'vnd_003', 'pkg_005', 'ADVANCE_PENDING', 'WEDDING', '2026-12-15', 300, 3000000, 900000, NOW(), NOW()),
  ('bk_003', 'usr_customer_002', 'vnd_002', 'pkg_004', 'ENQUIRY', 'RECEPTION', '2026-11-20', 500, 15000000, 4500000, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Payment Service Database ─────────────────────────────────────────────────

\c weddingos_payments;

INSERT INTO "EscrowHold" (id, "bookingId", "customerId", "vendorId", "amountPaise", status, "razorpayOrderId", "createdAt", "updatedAt") VALUES
  ('esc_001', 'bk_001', 'usr_customer_001', 'vnd_001', 3600000, 'CAPTURED', 'order_test_001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Review Service Database ──────────────────────────────────────────────────

\c weddingos_reviews;

INSERT INTO "Review" (id, "bookingId", "customerId", "vendorId", rating, title, body, "isPublished", "createdAt", "updatedAt") VALUES
  ('rev_001', 'bk_001', 'usr_customer_001', 'vnd_001', 5, 'Absolutely stunning photography!', 'Royal Lens captured every moment beautifully. The team was professional, creative, and delivered our photos within 2 weeks. Highly recommend!', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Seed complete. Sample data loaded for development.
-- =============================================================================
