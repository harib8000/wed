-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('ENQUIRY', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'ADVANCE_PENDING', 'ADVANCE_PAID', 'CONFIRMED', 'CHECKIN', 'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_VENDOR', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING_CEREMONY', 'RECEPTION', 'ENGAGEMENT', 'HALDI', 'MEHNDI', 'SANGEET', 'BACHELOR_PARTY', 'PRE_WEDDING_SHOOT', 'BIRTHDAY', 'ANNIVERSARY', 'CORPORATE', 'OTHER');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "booking_number" VARCHAR(30) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "package_id" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'ENQUIRY',
    "event_date" DATE NOT NULL,
    "event_type" "EventType" NOT NULL,
    "event_city" VARCHAR(100) NOT NULL,
    "quoted_amount_paise" INTEGER,
    "advance_amount_paise" INTEGER,
    "final_amount_paise" INTEGER,
    "platform_fee_paise" INTEGER,
    "gst_on_fee_paise" INTEGER,
    "requirements" TEXT,
    "guest_count" INTEGER,
    "special_notes" VARCHAR(1000),
    "vendor_quote_note" VARCHAR(1000),
    "cancellation_reason" VARCHAR(500),
    "quote_sent_at" TIMESTAMP(3),
    "quote_accepted_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_events" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" VARCHAR(20) NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_number_key" ON "bookings"("booking_number");

-- CreateIndex
CREATE INDEX "bookings_customer_id_status_idx" ON "bookings"("customer_id", "status");

-- CreateIndex
CREATE INDEX "bookings_vendor_id_status_idx" ON "bookings"("vendor_id", "status");

-- CreateIndex
CREATE INDEX "bookings_event_date_idx" ON "bookings"("event_date");

-- CreateIndex
CREATE INDEX "bookings_booking_number_idx" ON "bookings"("booking_number");

-- CreateIndex
CREATE INDEX "booking_events_booking_id_idx" ON "booking_events"("booking_id");

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
