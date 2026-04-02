/**
 * Batch import pipeline:
 * 1. Parse ZIP
 * 2. Validate each post
 * 3. Store assets to S3
 * 4. Create PostDraft + MediaAsset records
 * 5. On confirm: create PublishJob + enqueue in BullMQ
 */
import { db } from "@/lib/db";
import { parseZip } from "@/services/parser/zip-parser";
import {
  validateParsedPost,
  computeContentHash,
} from "@/services/validator/post-validator";
import {
  uploadBuffer,
  assetStorageKey,
  getPublicUrl,
  getSignedDownloadUrl,
} from "@/lib/storage";
import { hashSHA256 } from "@/lib/crypto";
import { schedulePublishJob } from "./queue";
import { parseISO } from "date-fns";
import type { ParsedPost } from "@/types";
import type { Prisma, PostDraft } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────
// PARSE + VALIDATE BATCH
// ─────────────────────────────────────────

/** Schedule overrides sent from the client wizard */
export interface ScheduleOverride {
  /** Index-based or sourceName-based matching */
  index: number;
  publishAt: string; // ISO 8601
  caption?: string;
  postType?: "image" | "carousel" | "reel";
}

export async function processBatch(
  batchId: string,
  zipBuffer: Buffer,
  businessId: string,
  businessSlug: string,
  scheduleOverrides?: ScheduleOverride[]
): Promise<void> {
  // Mark as parsing
  await db.uploadBatch.update({
    where: { id: batchId },
    data: { status: "PARSING" },
  });

  try {
    // 1. Parse ZIP
    const parseResult = await parseZip(zipBuffer);

    if (parseResult.errors.length > 0 && parseResult.posts.length === 0) {
      await db.uploadBatch.update({
        where: { id: batchId },
        data: {
          status: "VALIDATION_FAILED",
          parseErrors: parseResult.errors as unknown as Prisma.InputJsonValue,
          parseWarnings: parseResult.warnings as unknown as Prisma.InputJsonValue,
          parsedAt: new Date(),
          totalPosts: 0,
          validPosts: 0,
          failedPosts: parseResult.errors.length,
        },
      });
      return;
    }

    // 1b. Apply schedule overrides from client wizard
    if (scheduleOverrides && scheduleOverrides.length > 0) {
      for (const override of scheduleOverrides) {
        const post = parseResult.posts[override.index];
        if (!post) continue;

        if (override.publishAt) {
          post.metaJson.publish_at = override.publishAt;
        }
        if (override.caption !== undefined) {
          post.caption = override.caption;
        }
        if (override.postType) {
          post.metaJson.type = override.postType;
        }
      }
    }

    // 2. Validate + create drafts
    let validPosts = 0;
    let failedPosts = 0;
    const allErrors = [...parseResult.errors];
    const allWarnings = [...parseResult.warnings];

    for (const parsedPost of parseResult.posts) {
      try {
        const validationResult = await validateParsedPost(parsedPost, businessId);

        if (!validationResult.valid) {
          allErrors.push(
            ...validationResult.errors.map((e) => ({
              folder: parsedPost.folderName,
              field: e.field,
              message: e.message,
              severity: "error" as const,
            }))
          );
          failedPosts++;
          continue;
        }

        allWarnings.push(
          ...validationResult.warnings.map((w) => ({
            folder: parsedPost.folderName,
            field: w.field,
            message: w.message,
            severity: "warning" as const,
          }))
        );

        // 3. Store media assets
        await createPostDraftFromParsed(
          parsedPost,
          batchId,
          businessId,
          businessSlug
        );

        validPosts++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        allErrors.push({
          folder: parsedPost.folderName,
          message: `Unexpected error processing post: ${msg}`,
          severity: "error",
        });
        failedPosts++;
      }
    }

    const finalStatus =
      validPosts === 0
        ? "VALIDATION_FAILED"
        : failedPosts > 0
        ? "PARSED"
        : "PARSED";

    await db.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        parsedAt: new Date(),
        parseErrors: allErrors as unknown as Prisma.InputJsonValue,
        parseWarnings: allWarnings as unknown as Prisma.InputJsonValue,
        totalPosts: parseResult.posts.length,
        validPosts,
        failedPosts,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: "FAILED",
        parseErrors: [{ folder: "__root__", message: msg, severity: "error" }] as unknown as Prisma.InputJsonValue,
      },
    });
    throw err;
  }
}

async function createPostDraftFromParsed(
  post: ParsedPost,
  batchId: string,
  businessId: string,
  businessSlug: string
): Promise<void> {
  const captionHash = hashSHA256(post.caption);
  const assetHashes = post.mediaFiles.map((f) => f.fileHash);
  const contentHash = computeContentHash(post.caption, assetHashes);

  // Check for exact duplicates (same business + content)
  const existing = await db.postDraft.findFirst({
    where: {
      businessId,
      contentHash,
      status: { notIn: ["CANCELLED"] },
    },
  });

  if (existing) {
    // Skip silently — warning already recorded in validation
    return;
  }

  const publishAt = parseISO(post.metaJson.publish_at);
  const postDraftId = uuidv4();

  // Upload media to storage first
  const mediaAssets: Prisma.MediaAssetCreateManyPostDraftInput[] = [];

  for (let i = 0; i < post.mediaFiles.length; i++) {
    const mediaFile = post.mediaFiles[i];
    const storageKey = assetStorageKey(
      businessSlug,
      batchId,
      post.folderName,
      mediaFile.filename
    );

    await uploadBuffer(storageKey, mediaFile.buffer, mediaFile.mimeType);

    mediaAssets.push({
      originalFilename: mediaFile.filename,
      storagePath: storageKey,
      storageUrl: getPublicUrl(storageKey),
      mimeType: mediaFile.mimeType,
      fileSize: mediaFile.buffer.length,
      fileHash: mediaFile.fileHash,
      sortOrder: i,
    });
  }

  const postTypeMap = {
    image: "IMAGE",
    carousel: "CAROUSEL",
    reel: "REEL",
  } as const;

  await db.postDraft.create({
    data: {
      id: postDraftId,
      businessId,
      batchId,
      postType: postTypeMap[post.metaJson.type],
      publishAt,
      timezone: post.metaJson.publish_at.match(/([+-]\d{2}:\d{2}|Z)$/)?.[0] ?? "UTC",
      firstComment: post.metaJson.first_comment ?? null,
      locationId: post.metaJson.location_id ?? null,
      caption: post.caption,
      captionHash,
      contentHash,
      idempotencyKey: uuidv4(),
      status: "VALIDATED",
      sourceFolderName: post.folderName,
      mediaAssets: {
        createMany: { data: mediaAssets },
      },
    },
  });
}

// ─────────────────────────────────────────
// CONFIRM BATCH — schedule jobs
// ─────────────────────────────────────────

export async function confirmBatch(batchId: string): Promise<{
  scheduled: number;
  failed: number;
}> {
  const batch = await db.uploadBatch.findUnique({
    where: { id: batchId },
    include: {
      postDrafts: {
        where: { status: { in: ["VALIDATED", "READY"] } },
      },
    },
  });

  if (!batch) throw new Error(`Batch ${batchId} not found`);
  if (!["PARSED", "VALIDATION_FAILED"].includes(batch.status)) {
    throw new Error(`Batch is not in a parseable state: ${batch.status}`);
  }

  let scheduled = 0;
  let failed = 0;

  for (const draft of batch.postDrafts) {
    try {
      // Create PublishJob record
      const publishJob = await db.publishJob.create({
        data: {
          postDraftId: draft.id,
          businessId: draft.businessId,
          scheduledFor: draft.publishAt,
          status: "PENDING",
        },
      });

      // Schedule in BullMQ
      const bullmqJobId = await schedulePublishJob(
        draft.id,
        publishJob.id,
        draft.businessId,
        draft.publishAt
      );

      // Update records
      await db.$transaction([
        db.publishJob.update({
          where: { id: publishJob.id },
          data: { bullmqJobId, status: "ENQUEUED" },
        }),
        db.postDraft.update({
          where: { id: draft.id },
          data: { status: "SCHEDULED", scheduledJobId: publishJob.id },
        }),
      ]);

      scheduled++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db.postDraft.update({
        where: { id: draft.id },
        data: { status: "FAILED", lastError: msg },
      });
      failed++;
    }
  }

  const finalStatus =
    scheduled === 0
      ? "FAILED"
      : failed > 0
      ? "PARTIALLY_SCHEDULED"
      : "SCHEDULED";

  await db.$transaction([
    db.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        confirmedAt: new Date(),
        scheduledAt: new Date(),
      },
    }),
    db.auditLog.create({
      data: {
        businessId: batch.businessId,
        action: "BATCH_CONFIRMED",
        entityType: "UploadBatch",
        entityId: batchId,
        detail: { scheduled, failed },
      },
    }),
  ]);

  return { scheduled, failed };
}
