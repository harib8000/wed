-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "body" TEXT NOT NULL,
    "quality_rating" INTEGER,
    "value_rating" INTEGER,
    "professionalism_rating" INTEGER,
    "punctuality_rating" INTEGER,
    "photos" TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "admin_note" VARCHAR(300),
    "vendor_reply" TEXT,
    "vendor_replied_at" TIMESTAMP(3),
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews"("booking_id");

-- CreateIndex
CREATE INDEX "reviews_vendor_id_is_published_idx" ON "reviews"("vendor_id", "is_published");

-- CreateIndex
CREATE INDEX "reviews_customer_id_idx" ON "reviews"("customer_id");
