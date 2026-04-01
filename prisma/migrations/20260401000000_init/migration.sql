-- CreateEnum
CREATE TYPE "MetaConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'TOKEN_EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('UPLOADED', 'PARSING', 'PARSED', 'VALIDATION_FAILED', 'READY', 'PARTIALLY_SCHEDULED', 'SCHEDULED', 'FAILED');

-- CreateEnum
CREATE TYPE "PostDraftStatus" AS ENUM ('DRAFT', 'VALIDATED', 'READY', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('IMAGE', 'CAROUSEL', 'REEL');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ENQUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_connections" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "igUsername" TEXT NOT NULL,
    "fbPageId" TEXT,
    "fbPageName" TEXT,
    "accessTokenEnc" TEXT NOT NULL,
    "accessTokenIv" TEXT NOT NULL,
    "accessTokenTag" TEXT NOT NULL,
    "pageTokenEnc" TEXT,
    "pageTokenIv" TEXT,
    "pageTokenTag" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "MetaConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCheckedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_batches" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'UPLOADED',
    "parsedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "parseErrors" JSONB,
    "parseWarnings" JSONB,
    "totalPosts" INTEGER,
    "validPosts" INTEGER,
    "failedPosts" INTEGER,
    "uploadedByIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_drafts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "postType" "PostType" NOT NULL,
    "publishAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "firstComment" TEXT,
    "locationId" TEXT,
    "caption" TEXT NOT NULL,
    "captionHash" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "PostDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "validationErrors" JSONB,
    "scheduledJobId" TEXT,
    "metaContainerId" TEXT,
    "metaPublicationId" TEXT,
    "metaPermalink" TEXT,
    "lastMetaResponse" JSONB,
    "lastError" TEXT,
    "publishedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "sourceFolderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "postDraftId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metaUploadHandle" TEXT,
    "uploadedToMeta" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_jobs" (
    "id" TEXT NOT NULL,
    "postDraftId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "bullmqJobId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "publish_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_attempts" (
    "id" TEXT NOT NULL,
    "publishJobId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "success" BOOLEAN,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metaResponse" JSONB,

    CONSTRAINT "publish_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "detail" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");
CREATE UNIQUE INDEX "meta_connections_businessId_key" ON "meta_connections"("businessId");
CREATE UNIQUE INDEX "post_drafts_idempotencyKey_key" ON "post_drafts"("idempotencyKey");
CREATE UNIQUE INDEX "post_drafts_businessId_contentHash_key" ON "post_drafts"("businessId", "contentHash");
CREATE UNIQUE INDEX "publish_jobs_bullmqJobId_key" ON "publish_jobs"("bullmqJobId");

-- Indexes for performance
CREATE INDEX "upload_batches_businessId_idx" ON "upload_batches"("businessId");
CREATE INDEX "post_drafts_businessId_idx" ON "post_drafts"("businessId");
CREATE INDEX "post_drafts_status_idx" ON "post_drafts"("status");
CREATE INDEX "post_drafts_publishAt_idx" ON "post_drafts"("publishAt");
CREATE INDEX "audit_logs_businessId_idx" ON "audit_logs"("businessId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "meta_connections" ADD CONSTRAINT "meta_connections_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_drafts" ADD CONSTRAINT "post_drafts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_drafts" ADD CONSTRAINT "post_drafts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_postDraftId_fkey" FOREIGN KEY ("postDraftId") REFERENCES "post_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "publish_jobs" ADD CONSTRAINT "publish_jobs_postDraftId_fkey" FOREIGN KEY ("postDraftId") REFERENCES "post_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "publish_attempts" ADD CONSTRAINT "publish_attempts_publishJobId_fkey" FOREIGN KEY ("publishJobId") REFERENCES "publish_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
