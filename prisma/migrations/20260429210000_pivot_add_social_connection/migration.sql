-- Multi-plataforma: SocialConnection + SocialPublication

CREATE TYPE "SocialPlatform" AS ENUM ('TIKTOK', 'LINKEDIN', 'YOUTUBE', 'PINTEREST');
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'TOKEN_EXPIRED', 'REVOKED', 'ERROR');
CREATE TYPE "PublishStatus" AS ENUM ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED');

CREATE TABLE "social_connections" (
    "id"                  TEXT NOT NULL,
    "businessId"          TEXT NOT NULL,
    "platform"            "SocialPlatform" NOT NULL,
    "externalUserId"      TEXT NOT NULL,
    "externalUsername"    TEXT,
    "externalDisplayName" TEXT,
    "accessTokenEnc"      TEXT NOT NULL,
    "accessTokenIv"       TEXT NOT NULL,
    "accessTokenTag"      TEXT NOT NULL,
    "refreshTokenEnc"     TEXT,
    "refreshTokenIv"      TEXT,
    "refreshTokenTag"     TEXT,
    "scopes"              TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt"           TIMESTAMP(3),
    "status"              "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCheckedAt"       TIMESTAMP(3),
    "lastError"           TEXT,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "social_connections_businessId_platform_key"
  ON "social_connections"("businessId", "platform");

ALTER TABLE "social_connections"
  ADD CONSTRAINT "social_connections_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "social_publications" (
    "id"                TEXT NOT NULL,
    "postDraftId"       TEXT NOT NULL,
    "connectionId"      TEXT NOT NULL,
    "platform"          "SocialPlatform" NOT NULL,
    "externalPostId"    TEXT,
    "externalPermalink" TEXT,
    "status"            "PublishStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt"       TIMESTAMP(3),
    "failedAt"          TIMESTAMP(3),
    "errorMessage"      TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "social_publications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_publications_postDraftId_idx"
  ON "social_publications"("postDraftId");
CREATE INDEX "social_publications_status_createdAt_idx"
  ON "social_publications"("status", "createdAt");

ALTER TABLE "social_publications"
  ADD CONSTRAINT "social_publications_postDraftId_fkey"
  FOREIGN KEY ("postDraftId") REFERENCES "post_drafts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_publications"
  ADD CONSTRAINT "social_publications_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "social_connections"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
