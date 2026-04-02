/**
 * Server-side post draft validation.
 * Validates business existence, timing, content, and duplicates.
 */
import { db } from "@/lib/db";
import { hashSHA256 } from "@/lib/crypto";
import { parseISO, isBefore, addMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { ParsedPost, ValidationError, ValidationResult } from "@/types";

const VALID_TIMEZONES = new Set([...Intl.supportedValuesOf("timeZone"), "UTC", "GMT"]);

// Min minutes in the future for scheduling
const MIN_FUTURE_MINUTES = 5;

// Max caption length (Instagram limit)
const MAX_CAPTION_LENGTH = 2200;

// Max media sizes (bytes) - these are guideline limits
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;  // 8MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function validateParsedPost(
  post: ParsedPost,
  businessId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // ─── Business slug validation ───
  const business = await db.business.findFirst({
    where: { id: businessId, isActive: true },
  });
  if (!business) {
    errors.push({
      field: "business_slug",
      message: `Business not found or inactive`,
    });
    return { valid: false, errors, warnings };
  }

  if (
    post.metaJson.business_slug &&
    post.metaJson.business_slug !== business.slug
  ) {
    errors.push({
      field: "business_slug",
      message: `meta.json business_slug "${post.metaJson.business_slug}" does not match business "${business.slug}"`,
    });
  }

  // ─── Timezone validation ───
  const timezone = business.timezone;
  if (!VALID_TIMEZONES.has(timezone)) {
    warnings.push({
      field: "timezone",
      message: `Business timezone "${timezone}" is not recognized; using UTC`,
    });
  }

  // ─── Date/time validation ───
  let publishAt: Date;
  try {
    publishAt = parseISO(post.metaJson.publish_at);
    if (isNaN(publishAt.getTime())) throw new Error("Invalid date");
  } catch {
    errors.push({
      field: "publish_at",
      message: `Invalid publish_at date: ${post.metaJson.publish_at}`,
    });
    return { valid: errors.length === 0, errors, warnings };
  }

  const minPublishTime = addMinutes(new Date(), MIN_FUTURE_MINUTES);
  if (isBefore(publishAt, minPublishTime)) {
    errors.push({
      field: "publish_at",
      message: `Scheduled time ${post.metaJson.publish_at} is in the past or too soon (minimum ${MIN_FUTURE_MINUTES} minutes from now)`,
    });
  }

  // ─── Caption validation ───
  if (!post.caption || post.caption.trim().length === 0) {
    warnings.push({ field: "caption", message: "Caption is empty — you can add one before confirming" });
  }
  if (post.caption.length > MAX_CAPTION_LENGTH) {
    errors.push({
      field: "caption",
      message: `Caption exceeds Instagram limit of ${MAX_CAPTION_LENGTH} characters (${post.caption.length})`,
    });
  }

  // ─── Type-specific media validation ───
  switch (post.metaJson.type) {
    case "image": {
      const asset = post.mediaFiles[0];
      if (!asset) {
        errors.push({ field: "media", message: "Image post requires exactly 1 image" });
      } else {
        if (!asset.mimeType.startsWith("image/")) {
          errors.push({ field: "media", message: "Image post media must be an image" });
        }
        if (asset.buffer.length > MAX_IMAGE_SIZE) {
          warnings.push({
            field: "media",
            message: `Image size ${(asset.buffer.length / 1024 / 1024).toFixed(1)}MB may exceed Meta limits`,
          });
        }
      }
      break;
    }

    case "carousel": {
      if (post.mediaFiles.length < 2) {
        errors.push({
          field: "media",
          message: "Carousel requires at least 2 media files",
        });
      }
      if (post.mediaFiles.length > 10) {
        errors.push({
          field: "media",
          message: "Carousel cannot have more than 10 items (Meta API limit)",
        });
      }
      for (const asset of post.mediaFiles) {
        if (asset.buffer.length > MAX_IMAGE_SIZE && asset.mimeType.startsWith("image/")) {
          warnings.push({
            field: "media",
            message: `Image ${asset.filename}: ${(asset.buffer.length / 1024 / 1024).toFixed(1)}MB may exceed Meta limits`,
          });
        }
      }
      break;
    }

    case "reel": {
      const asset = post.mediaFiles[0];
      if (!asset) {
        errors.push({ field: "media", message: "Reel requires exactly 1 video" });
      } else {
        if (!asset.mimeType.startsWith("video/")) {
          errors.push({
            field: "media",
            message: "Reel media must be a video file (.mp4, .mov)",
          });
        }
        if (asset.buffer.length > MAX_VIDEO_SIZE) {
          warnings.push({
            field: "media",
            message: `Video size ${(asset.buffer.length / 1024 / 1024).toFixed(0)}MB may exceed Meta limits`,
          });
        }
      }
      break;
    }
  }

  // ─── Duplicate detection ───
  if (errors.length === 0) {
    const captionHash = hashSHA256(post.caption);
    const assetHashes = post.mediaFiles
      .map((f) => f.fileHash)
      .sort()
      .join("|");
    const contentHash = hashSHA256(captionHash + assetHashes);

    const existing = await db.postDraft.findFirst({
      where: {
        businessId,
        contentHash,
        status: { notIn: ["CANCELLED", "FAILED"] },
      },
    });

    if (existing) {
      warnings.push({
        field: "duplicate",
        message: `A post with identical content and caption already exists (ID: ${existing.id}, status: ${existing.status})`,
      });
    }
  }

  // ─── Meta connection check ───
  const connection = await db.metaConnection.findUnique({
    where: { businessId },
  });
  if (!connection) {
    warnings.push({
      field: "meta_connection",
      message: "No Meta connection found for this business. Posts can be imported but will fail to publish.",
    });
  } else if (connection.status !== "ACTIVE") {
    warnings.push({
      field: "meta_connection",
      message: `Meta connection status is "${connection.status}". Token may need renewal before publishing.`,
    });
  } else if (
    connection.tokenExpiresAt &&
    isBefore(new Date(connection.tokenExpiresAt), publishAt)
  ) {
    warnings.push({
      field: "meta_connection",
      message: `Meta token expires before scheduled publish time. Please renew before then.`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** Compute content hash for deduplication */
export function computeContentHash(caption: string, fileHashes: string[]): string {
  const captionHash = hashSHA256(caption);
  const assetHash = fileHashes.sort().join("|");
  return hashSHA256(captionHash + assetHash);
}
