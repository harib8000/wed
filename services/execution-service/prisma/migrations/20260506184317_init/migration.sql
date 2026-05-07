-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('VENDOR_BOOKING', 'VENUE', 'CATERING', 'DECORATION', 'CEREMONY', 'GUEST_MANAGEMENT', 'PHOTOGRAPHY', 'ENTERTAINMENT', 'LOGISTICS', 'LEGAL', 'OTHER');

-- CreateTable
CREATE TABLE "wedding_timelines" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "wedding_date" DATE NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT 'My Wedding',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_tasks" (
    "id" TEXT NOT NULL,
    "timeline_id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL DEFAULT 'OTHER',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "due_date" DATE,
    "due_days_before_wedding" INTEGER,
    "linked_booking_id" TEXT,
    "assigned_vendor_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_system_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL DEFAULT 'OTHER',
    "due_days_before_wedding" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wedding_timelines_customer_id_key" ON "wedding_timelines"("customer_id");

-- CreateIndex
CREATE INDEX "timeline_tasks_timeline_id_status_idx" ON "timeline_tasks"("timeline_id", "status");

-- CreateIndex
CREATE INDEX "timeline_tasks_due_date_idx" ON "timeline_tasks"("due_date");

-- AddForeignKey
ALTER TABLE "timeline_tasks" ADD CONSTRAINT "timeline_tasks_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "wedding_timelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
