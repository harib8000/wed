-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('PHOTOGRAPHER', 'VIDEOGRAPHER', 'CATERER', 'DECORATOR', 'VENUE', 'DJ_SOUND', 'BAND_ENTERTAINMENT', 'BRIDAL_MAKEUP', 'GROOM_MAKEUP', 'MEHENDI', 'PANDIT_PRIEST', 'WEDDING_PLANNER', 'INVITATIONS', 'CHOREOGRAPHER', 'BARTENDER', 'LIGHTING', 'FIREWORKS', 'TENT_HOUSE', 'TRANSPORTATION', 'FLORIST');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'CUSTOM');

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "sub_categories" "VendorCategory"[],
    "status" "VendorStatus" NOT NULL DEFAULT 'DRAFT',
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "service_cities" VARCHAR(100)[],
    "tagline" VARCHAR(300),
    "description" TEXT,
    "years_experience" INTEGER,
    "team_size" INTEGER,
    "cover_photo" VARCHAR(500),
    "logo_url" VARCHAR(500),
    "whatsapp_number" VARCHAR(15),
    "website_url" VARCHAR(500),
    "instagram_url" VARCHAR(500),
    "gst_number" VARCHAR(20),
    "pan_number" VARCHAR(20),
    "bank_account_no" VARCHAR(30),
    "bank_ifsc" VARCHAR(15),
    "bank_account_name" VARCHAR(200),
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "booking_count" INTEGER NOT NULL DEFAULT 0,
    "response_rate_percent" INTEGER NOT NULL DEFAULT 0,
    "avg_response_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plus_member" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "admin_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_packages" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "package_type" "PackageType" NOT NULL DEFAULT 'BASIC',
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "price_from_paise" INTEGER NOT NULL,
    "price_up_to_paise" INTEGER,
    "is_custom_quote" BOOLEAN NOT NULL DEFAULT false,
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "deliverables" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "public_url" VARCHAR(500) NOT NULL,
    "thumb_url" VARCHAR(500),
    "caption" VARCHAR(300),
    "media_type" VARCHAR(10) NOT NULL DEFAULT 'image',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_blocks" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "blocked_date" DATE NOT NULL,
    "reason" VARCHAR(200),

    CONSTRAINT "availability_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_tags" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "tag" VARCHAR(50) NOT NULL,

    CONSTRAINT "vendor_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_user_id_key" ON "vendors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");

-- CreateIndex
CREATE INDEX "vendors_category_city_status_idx" ON "vendors"("category", "city", "status");

-- CreateIndex
CREATE INDEX "vendors_slug_idx" ON "vendors"("slug");

-- CreateIndex
CREATE INDEX "vendors_avg_rating_idx" ON "vendors"("avg_rating");

-- CreateIndex
CREATE INDEX "vendor_packages_vendor_id_is_active_idx" ON "vendor_packages"("vendor_id", "is_active");

-- CreateIndex
CREATE INDEX "portfolio_items_vendor_id_idx" ON "portfolio_items"("vendor_id");

-- CreateIndex
CREATE INDEX "availability_blocks_vendor_id_blocked_date_idx" ON "availability_blocks"("vendor_id", "blocked_date");

-- CreateIndex
CREATE UNIQUE INDEX "availability_blocks_vendor_id_blocked_date_key" ON "availability_blocks"("vendor_id", "blocked_date");

-- CreateIndex
CREATE INDEX "vendor_tags_tag_idx" ON "vendor_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_tags_vendor_id_tag_key" ON "vendor_tags"("vendor_id", "tag");

-- AddForeignKey
ALTER TABLE "vendor_packages" ADD CONSTRAINT "vendor_packages_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_blocks" ADD CONSTRAINT "availability_blocks_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_tags" ADD CONSTRAINT "vendor_tags_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
