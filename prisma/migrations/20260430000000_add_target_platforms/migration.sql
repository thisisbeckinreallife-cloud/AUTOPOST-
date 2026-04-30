-- Multi-plataforma: PostDraft puede publicarse a plataformas no-Meta
-- adicionalmente a (o en lugar de) Instagram + Facebook.

ALTER TABLE "post_drafts"
  ADD COLUMN "targetPlatforms" "SocialPlatform"[] DEFAULT ARRAY[]::"SocialPlatform"[],
  ADD COLUMN "publishToMeta" BOOLEAN NOT NULL DEFAULT true;
