-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED_TO_VENDOR', 'REFUNDED_TO_CUSTOMER', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('CANCELLATION', 'DISPUTE_RESOLVED_CUSTOMER', 'OTHER');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "razorpay_order_id" VARCHAR(100) NOT NULL,
    "razorpay_payment_id" VARCHAR(100),
    "razorpay_signature" VARCHAR(300),
    "amount_paise" INTEGER NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "description" VARCHAR(300),
    "idempotency_key" VARCHAR(100) NOT NULL,
    "webhook_verified" BOOLEAN NOT NULL DEFAULT false,
    "webhook_received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_holds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "held_amount_paise" INTEGER NOT NULL,
    "platform_fee_paise" INTEGER NOT NULL,
    "gst_on_fee_paise" INTEGER NOT NULL,
    "vendor_payout_paise" INTEGER NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "release_scheduled_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "razorpay_payout_id" TEXT,
    "admin_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "razorpay_refund_id" VARCHAR(100),
    "amount_paise" INTEGER NOT NULL,
    "reason" "RefundReason" NOT NULL DEFAULT 'OTHER',
    "note" VARCHAR(500),
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_holds_payment_id_key" ON "escrow_holds"("payment_id");

-- CreateIndex
CREATE INDEX "escrow_holds_vendor_id_status_idx" ON "escrow_holds"("vendor_id", "status");

-- CreateIndex
CREATE INDEX "escrow_holds_release_scheduled_at_idx" ON "escrow_holds"("release_scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_razorpay_refund_id_key" ON "refunds"("razorpay_refund_id");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- AddForeignKey
ALTER TABLE "escrow_holds" ADD CONSTRAINT "escrow_holds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
