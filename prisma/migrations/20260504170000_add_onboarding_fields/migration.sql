-- Fase 3: onboarding wizard 5 pasos. Añade campos para track progreso
-- del wizard, datos del negocio y modo asistente.

ALTER TABLE "admin_users" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "admin_users" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "admin_users" ADD COLUMN "businessName" TEXT;
ALTER TABLE "admin_users" ADD COLUMN "businessType" TEXT;
ALTER TABLE "admin_users" ADD COLUMN "assistantMode" BOOLEAN NOT NULL DEFAULT true;

-- Marcar usuarios existentes como ya onboarded (ya están usando el producto,
-- no queremos forzarles el wizard).
UPDATE "admin_users" SET "onboardingCompleted" = true, "onboardingStep" = 5;
