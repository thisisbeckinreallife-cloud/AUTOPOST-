-- Fase 2 del plan funcional: añade fields para Google OAuth + perfil
-- de usuario simplificado. Hace passwordHash opcional para usuarios
-- que sólo se autentican vía OAuth.
--
-- Idempotente: usa IF NOT EXISTS donde aplica.

-- Añadir columnas nuevas (NULLABLE para no romper users existentes)
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- passwordHash → opcional (los usuarios solo-Google no tendrán hash)
-- Si la columna ya es nullable, este DDL es no-op.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_users'
      AND column_name = 'passwordHash'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "admin_users" ALTER COLUMN "passwordHash" DROP NOT NULL;
  END IF;
END $$;

-- Unique index sobre googleId (NULLs permitidos pero múltiples NULLs OK en Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_googleId_key"
  ON "admin_users"("googleId");
