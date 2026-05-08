-- Settings de cuenta (Bloque D del rediseño).
-- · hideWatermark: pero el server-side solo lo respeta si plan ≥ PRO.
-- · language: preferencia para emails y UI futuros (ES/EN).
-- · emailNotifications: opt-out de emails transaccionales.

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hideWatermark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'es';
