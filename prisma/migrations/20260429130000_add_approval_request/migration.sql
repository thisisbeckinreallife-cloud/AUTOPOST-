-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "postDraftId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "decision" "ApprovalDecision",
    "feedback" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminUserId" TEXT,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_requests_token_key" ON "approval_requests"("token");

-- CreateIndex
CREATE INDEX "approval_requests_postDraftId_createdAt_idx" ON "approval_requests"("postDraftId", "createdAt");

-- CreateIndex
CREATE INDEX "approval_requests_token_idx" ON "approval_requests"("token");

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_postDraftId_fkey" FOREIGN KEY ("postDraftId") REFERENCES "post_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
