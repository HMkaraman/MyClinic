-- Multi-Tenant Improvements Migration
-- Phase 1: Add nullable tenant_id columns to all tables

-- ==================================
-- Step 1: Add tenant_id columns (nullable initially)
-- ==================================

-- Add tenant_id to appointments
ALTER TABLE "appointments" ADD COLUMN "tenant_id" TEXT;

-- Add tenant_id to visits
ALTER TABLE "visits" ADD COLUMN "tenant_id" TEXT;

-- Add tenant_id to invoices
ALTER TABLE "invoices" ADD COLUMN "tenant_id" TEXT;

-- Add tenant_id to expenses
ALTER TABLE "expenses" ADD COLUMN "tenant_id" TEXT;

-- Add tenant_id to activity_events
ALTER TABLE "activity_events" ADD COLUMN "tenant_id" TEXT;

-- Add tenant_id to attachments
ALTER TABLE "attachments" ADD COLUMN "tenant_id" TEXT;

-- ==================================
-- Step 2: Backfill tenant_id from existing relations
-- ==================================

-- Appointments: get tenant_id from branch
UPDATE "appointments" a
SET "tenant_id" = b."tenant_id"
FROM "branches" b
WHERE a."branch_id" = b."id";

-- Visits: get tenant_id from branch
UPDATE "visits" v
SET "tenant_id" = b."tenant_id"
FROM "branches" b
WHERE v."branch_id" = b."id";

-- Invoices: get tenant_id from branch
UPDATE "invoices" i
SET "tenant_id" = b."tenant_id"
FROM "branches" b
WHERE i."branch_id" = b."id";

-- Expenses: get tenant_id from branch
UPDATE "expenses" e
SET "tenant_id" = b."tenant_id"
FROM "branches" b
WHERE e."branch_id" = b."id";

-- Activity events: get tenant_id from actor (user)
UPDATE "activity_events" ae
SET "tenant_id" = u."tenant_id"
FROM "users" u
WHERE ae."actor_id" = u."id";

-- Attachments: get tenant_id from uploader (user)
UPDATE "attachments" a
SET "tenant_id" = u."tenant_id"
FROM "users" u
WHERE a."uploaded_by" = u."id";

-- ==================================
-- Step 3: Make tenant_id NOT NULL and add foreign keys
-- ==================================

-- Appointments
ALTER TABLE "appointments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Visits
ALTER TABLE "visits" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "visits" ADD CONSTRAINT "visits_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invoices
ALTER TABLE "invoices" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Expenses
ALTER TABLE "expenses" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Activity Events
ALTER TABLE "activity_events" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Attachments
ALTER TABLE "attachments" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================================
-- Step 4: Update indexes for better query performance
-- ==================================

-- Drop old indexes
DROP INDEX IF EXISTS "appointments_branch_id_scheduled_at_idx";
DROP INDEX IF EXISTS "appointments_doctor_id_scheduled_at_idx";
DROP INDEX IF EXISTS "appointments_patient_id_idx";
DROP INDEX IF EXISTS "visits_patient_id_idx";
DROP INDEX IF EXISTS "visits_doctor_id_idx";
DROP INDEX IF EXISTS "invoices_branch_id_created_at_idx";
DROP INDEX IF EXISTS "invoices_patient_id_idx";
DROP INDEX IF EXISTS "expenses_branch_id_date_idx";
DROP INDEX IF EXISTS "attachments_entity_type_entity_id_idx";
DROP INDEX IF EXISTS "activity_events_entity_type_entity_id_idx";
DROP INDEX IF EXISTS "activity_events_actor_id_idx";

-- Create new tenant-scoped indexes
CREATE INDEX "appointments_tenant_id_branch_id_scheduled_at_idx" ON "appointments"("tenant_id", "branch_id", "scheduled_at");
CREATE INDEX "appointments_tenant_id_doctor_id_scheduled_at_idx" ON "appointments"("tenant_id", "doctor_id", "scheduled_at");
CREATE INDEX "appointments_tenant_id_patient_id_idx" ON "appointments"("tenant_id", "patient_id");

CREATE INDEX "visits_tenant_id_patient_id_idx" ON "visits"("tenant_id", "patient_id");
CREATE INDEX "visits_tenant_id_doctor_id_idx" ON "visits"("tenant_id", "doctor_id");
CREATE INDEX "visits_tenant_id_branch_id_idx" ON "visits"("tenant_id", "branch_id");

CREATE INDEX "invoices_tenant_id_branch_id_created_at_idx" ON "invoices"("tenant_id", "branch_id", "created_at");
CREATE INDEX "invoices_tenant_id_patient_id_idx" ON "invoices"("tenant_id", "patient_id");

CREATE INDEX "expenses_tenant_id_branch_id_date_idx" ON "expenses"("tenant_id", "branch_id", "date");

CREATE INDEX "attachments_tenant_id_entity_type_entity_id_idx" ON "attachments"("tenant_id", "entity_type", "entity_id");

CREATE INDEX "activity_events_tenant_id_entity_type_entity_id_idx" ON "activity_events"("tenant_id", "entity_type", "entity_id");
CREATE INDEX "activity_events_tenant_id_actor_id_idx" ON "activity_events"("tenant_id", "actor_id");

-- ==================================
-- Step 5: Update invoice unique constraint to be tenant-scoped
-- ==================================

-- Drop old unique constraint on invoice_number
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_invoice_number_key";

-- Add new tenant-scoped unique constraint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_invoice_number_key" UNIQUE ("tenant_id", "invoice_number");

-- ==================================
-- Step 6: Create TenantSequence table
-- ==================================

-- Create SequenceType enum
CREATE TYPE "SequenceType" AS ENUM ('PATIENT_FILE_NUMBER', 'INVOICE_NUMBER');

-- Create tenant_sequences table
CREATE TABLE "tenant_sequences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "SequenceType" NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_sequences_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint
ALTER TABLE "tenant_sequences" ADD CONSTRAINT "tenant_sequences_tenant_id_type_year_month_key" UNIQUE ("tenant_id", "type", "year", "month");

-- Add foreign key
ALTER TABLE "tenant_sequences" ADD CONSTRAINT "tenant_sequences_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================================
-- Step 7: Initialize sequences from existing data
-- ==================================

-- Initialize patient file number sequences for each tenant
INSERT INTO "tenant_sequences" ("id", "tenant_id", "type", "year", "month", "value", "updated_at")
SELECT
    gen_random_uuid()::text,
    t.id,
    'PATIENT_FILE_NUMBER'::"SequenceType",
    NULL,
    NULL,
    COALESCE((SELECT COUNT(*) FROM "patients" WHERE "tenant_id" = t.id), 0),
    NOW()
FROM "tenants" t;

-- Initialize invoice number sequences for each tenant (current month)
INSERT INTO "tenant_sequences" ("id", "tenant_id", "type", "year", "month", "value", "updated_at")
SELECT
    gen_random_uuid()::text,
    t.id,
    'INVOICE_NUMBER'::"SequenceType",
    EXTRACT(YEAR FROM NOW())::int,
    EXTRACT(MONTH FROM NOW())::int,
    COALESCE((
        SELECT COUNT(*)
        FROM "invoices"
        WHERE "tenant_id" = t.id
        AND "created_at" >= date_trunc('month', NOW())
        AND "created_at" < date_trunc('month', NOW()) + interval '1 month'
    ), 0),
    NOW()
FROM "tenants" t;
