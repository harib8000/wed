-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'GSTIN', 'BANK_STATEMENT');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "avatar" VARCHAR(500),
    "email" VARCHAR(255),
    "date_of_birth" DATE,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(10),
    "partner_name" VARCHAR(100),
    "wedding_date" DATE,
    "estimated_budget_paise" INTEGER,
    "guest_count" INTEGER,
    "venue_city" VARCHAR(100),
    "business_name" VARCHAR(200),
    "business_city" VARCHAR(100),
    "whatsapp_notif" BOOLEAN NOT NULL DEFAULT true,
    "email_notif" BOOLEAN NOT NULL DEFAULT true,
    "push_notif" BOOLEAN NOT NULL DEFAULT true,
    "sms_notif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "device_id" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" VARCHAR(500),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_profile_id_idx" ON "push_tokens"("profile_id");

-- CreateIndex
CREATE INDEX "kyc_documents_profile_id_idx" ON "kyc_documents"("profile_id");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents"("status");

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
