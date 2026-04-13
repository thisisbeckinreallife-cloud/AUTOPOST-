-- DropIndex
DROP INDEX "audit_logs_businessId_idx";

-- DropIndex
DROP INDEX "audit_logs_createdAt_idx";

-- DropIndex
DROP INDEX "post_drafts_businessId_idx";

-- DropIndex
DROP INDEX "post_drafts_publishAt_idx";

-- DropIndex
DROP INDEX "post_drafts_status_idx";

-- DropIndex
DROP INDEX "upload_batches_businessId_idx";

-- AlterTable
ALTER TABLE "post_drafts" ADD COLUMN     "collaborators" JSONB;
