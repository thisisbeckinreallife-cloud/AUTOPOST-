-- ═════════════════════════════════════════════════════════════
-- PIVOT: drop credits system + simplify BrandProfile + add chat
-- ═════════════════════════════════════════════════════════════
-- ⚠ DESTRUCTIVE — backup obligatorio antes de aplicar.
-- Datos perdidos: AiUsage, AiGeneration, CreditPurchase.
-- ═════════════════════════════════════════════════════════════

-- 1. Drop tablas de créditos
DROP TABLE IF EXISTS "ai_generations" CASCADE;
DROP TABLE IF EXISTS "credit_purchases" CASCADE;
DROP TABLE IF EXISTS "ai_usage" CASCADE;

-- 2. Drop enum PlanTier (lo reemplazamos por String simple)
ALTER TABLE "admin_users" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "admin_users" ALTER COLUMN "plan" TYPE TEXT USING "plan"::TEXT;
ALTER TABLE "admin_users" ALTER COLUMN "plan" SET DEFAULT 'FREE';
DROP TYPE IF EXISTS "PlanTier";

-- 3. Drop columnas de créditos en admin_users
ALTER TABLE "admin_users"
  DROP COLUMN IF EXISTS "aiCreditsMonthly",
  DROP COLUMN IF EXISTS "aiCreditsAddon",
  DROP COLUMN IF EXISTS "aiCreditsResetAt";

-- 4. Añadir columnas Stripe a admin_users
ALTER TABLE "admin_users"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_stripeCustomerId_key"
  ON "admin_users"("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_stripeSubscriptionId_key"
  ON "admin_users"("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL;

-- 5. Simplificar BrandProfile — drop columnas complejas, añadir simples
ALTER TABLE "brand_profiles"
  DROP COLUMN IF EXISTS "level",
  DROP COLUMN IF EXISTS "bootstrapTone",
  DROP COLUMN IF EXISTS "bootstrapDescription",
  DROP COLUMN IF EXISTS "bootstrapExamples",
  DROP COLUMN IF EXISTS "bootstrapImages",
  DROP COLUMN IF EXISTS "bootstrapNiche",
  DROP COLUMN IF EXISTS "bootstrapTaboos",
  DROP COLUMN IF EXISTS "voiceProfile",
  DROP COLUMN IF EXISTS "voiceLastTrained",
  DROP COLUMN IF EXISTS "voicePostCount",
  DROP COLUMN IF EXISTS "visualLoraId",
  DROP COLUMN IF EXISTS "visualLoraUrl",
  DROP COLUMN IF EXISTS "visualLoraStatus",
  DROP COLUMN IF EXISTS "visualLoraTrained",
  DROP COLUMN IF EXISTS "visualLoraImageCount",
  DROP COLUMN IF EXISTS "bestPostingTimes",
  DROP COLUMN IF EXISTS "chatMemoryNamespace";

ALTER TABLE "brand_profiles"
  ADD COLUMN IF NOT EXISTS "niche" TEXT,
  ADD COLUMN IF NOT EXISTS "tone" TEXT,
  ADD COLUMN IF NOT EXISTS "targetAudience" TEXT,
  ADD COLUMN IF NOT EXISTS "taboos" JSONB,
  ADD COLUMN IF NOT EXISTS "preferredPostingDays" JSONB,
  ADD COLUMN IF NOT EXISTS "preferredPlatforms" JSONB,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- 6. AiChat + AiChatMessage tables
CREATE TABLE IF NOT EXISTS "ai_chats" (
    "id"           TEXT NOT NULL,
    "adminUserId"  TEXT NOT NULL,
    "businessId"   TEXT,
    "batchId"      TEXT,
    "title"        TEXT,
    "totalTokens"  INTEGER NOT NULL DEFAULT 0,
    "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_chats_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_chats_adminUserId_createdAt_idx"
  ON "ai_chats"("adminUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_chats_businessId_createdAt_idx"
  ON "ai_chats"("businessId", "createdAt");

ALTER TABLE "ai_chats"
  ADD CONSTRAINT "ai_chats_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ai_chat_messages" (
    "id"          TEXT NOT NULL,
    "chatId"      TEXT NOT NULL,
    "role"        TEXT NOT NULL,
    "content"     TEXT NOT NULL,
    "toolCalls"   JSONB,
    "attachments" JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_chat_messages_chatId_createdAt_idx"
  ON "ai_chat_messages"("chatId", "createdAt");

ALTER TABLE "ai_chat_messages"
  ADD CONSTRAINT "ai_chat_messages_chatId_fkey"
  FOREIGN KEY ("chatId") REFERENCES "ai_chats"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
