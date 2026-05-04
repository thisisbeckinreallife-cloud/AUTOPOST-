-- Fase 2 del plan funcional: añade fields para Google OAuth + perfil
-- de usuario simplificado. Hace passwordHash opcional para usuarios
-- que sólo se autentican vía OAuth.

-- Añadir columnas nuevas (NULLABLE para no romper users existentes)
ALTER TABLE "admin_users" ADD COLUMN "name" TEXT;
ALTER TABLE "admin_users" ADD COLUMN "avatar" TEXT;
ALTER TABLE "admin_users" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "admin_users" ADD COLUMN "googleId" TEXT;

-- passwordHash → opcional (los usuarios solo-OAuth no tendrán hash).
-- prisma migrate deploy aplica esta migración una sola vez (registrada
-- en _prisma_migrations), así que no necesita guard de idempotencia.
ALTER TABLE "admin_users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Unique index sobre googleId (NULLs múltiples permitidos en Postgres por defecto)
CREATE UNIQUE INDEX "admin_users_googleId_key" ON "admin_users"("googleId");
