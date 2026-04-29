-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "totalScheduled" INTEGER NOT NULL,
    "totalPublished" INTEGER NOT NULL,
    "totalFailed" INTEGER NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "daily" JSONB NOT NULL,
    "byType" JSONB NOT NULL,
    "topPosts" JSONB NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminUserId" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_token_key" ON "reports"("token");

-- CreateIndex
CREATE INDEX "reports_businessId_createdAt_idx" ON "reports"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "reports_token_idx" ON "reports"("token");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
