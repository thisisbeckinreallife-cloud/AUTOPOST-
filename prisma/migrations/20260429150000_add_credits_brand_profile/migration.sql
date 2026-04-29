-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO_SOLO', 'PRO', 'AGENCY', 'SCALE');

-- AlterTable AdminUser: add plan + credits fields
ALTER TABLE "admin_users"
  ADD COLUMN "plan"             "PlanTier" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "planExpiresAt"    TIMESTAMP(3),
  ADD COLUMN "aiCreditsMonthly" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "aiCreditsAddon"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "aiCreditsResetAt" TIMESTAMP(3);

-- CreateTable AiGeneration
CREATE TABLE "ai_generations" (
    "id"           TEXT NOT NULL,
    "adminUserId"  TEXT NOT NULL,
    "businessId"   TEXT,
    "type"         TEXT NOT NULL,
    "creditsCost"  INTEGER NOT NULL,
    "source"       TEXT NOT NULL,
    "provider"     TEXT,
    "model"        TEXT,
    "costUsd"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resultUrl"    TEXT,
    "refunded"     BOOLEAN NOT NULL DEFAULT false,
    "refundedAt"   TIMESTAMP(3),
    "refundReason" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_generations_adminUserId_createdAt_idx" ON "ai_generations"("adminUserId", "createdAt");
CREATE INDEX "ai_generations_businessId_createdAt_idx"  ON "ai_generations"("businessId", "createdAt");

ALTER TABLE "ai_generations"
  ADD CONSTRAINT "ai_generations_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable CreditPurchase
CREATE TABLE "credit_purchases" (
    "id"              TEXT NOT NULL,
    "adminUserId"     TEXT NOT NULL,
    "pack"            TEXT NOT NULL,
    "credits"         INTEGER NOT NULL,
    "amountUsd"       DOUBLE PRECISION NOT NULL,
    "status"          TEXT NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "paidAt"          TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credit_purchases_stripeSessionId_key" ON "credit_purchases"("stripeSessionId");
CREATE INDEX "credit_purchases_adminUserId_status_createdAt_idx" ON "credit_purchases"("adminUserId", "status", "createdAt");

ALTER TABLE "credit_purchases"
  ADD CONSTRAINT "credit_purchases_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable BrandProfile
CREATE TABLE "brand_profiles" (
    "id"                   TEXT NOT NULL,
    "businessId"           TEXT NOT NULL,
    "level"                TEXT NOT NULL DEFAULT 'L1',
    "bootstrapTone"        TEXT,
    "bootstrapDescription" TEXT,
    "bootstrapExamples"    JSONB,
    "bootstrapImages"      JSONB,
    "bootstrapNiche"       TEXT,
    "bootstrapTaboos"      JSONB,
    "voiceProfile"         JSONB,
    "voiceLastTrained"     TIMESTAMP(3),
    "voicePostCount"       INTEGER NOT NULL DEFAULT 0,
    "visualLoraId"         TEXT,
    "visualLoraUrl"        TEXT,
    "visualLoraStatus"     TEXT,
    "visualLoraTrained"    TIMESTAMP(3),
    "visualLoraImageCount" INTEGER NOT NULL DEFAULT 0,
    "bestPostingTimes"     JSONB,
    "chatMemoryNamespace"  TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brand_profiles_businessId_key" ON "brand_profiles"("businessId");

ALTER TABLE "brand_profiles"
  ADD CONSTRAINT "brand_profiles_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
