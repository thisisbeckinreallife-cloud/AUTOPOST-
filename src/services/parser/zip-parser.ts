/**
 * ZIP import parser.
 * Reads a ZIP buffer, extracts posts from various folder structures,
 * validates media, and returns parsed posts with their media, captions, and metadata.
 *
 * Supported layouts:
 *   1. Structured folders (YYYY-MM-DD_name/ with optional meta.json & caption.txt)
 *   2. Named folders containing media (one folder = one post)
 *   3. Flat images at root (each image = one post)
 *   4. Mixed (some folders + some loose files)
 */
import JSZip from "jszip";
import { hashSHA256 } from "@/lib/crypto";
import type { MetaJson, ParsedPost, ParsedMediaFile, ParseResult, ParseError } from "@/types";

// ─── Media helpers ───────────────────────────────────────────────────────────

const ALLOWED_IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const ALLOWED_VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
};

const ALL_ALLOWED_MIME = { ...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME };

/** System / junk files to ignore everywhere. */
const IGNORED_FILES = new Set([".ds_store", "thumbs.db"]);
const IGNORED_PREFIXES = ["__macosx/"];

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function getMimeType(filename: string): string | null {
  const ext = getExtension(filename);
  return ALL_ALLOWED_MIME[ext] ?? null;
}

function isImageFile(filename: string): boolean {
  const ext = getExtension(filename);
  return ext in ALLOWED_IMAGE_MIME;
}

function isVideoFile(filename: string): boolean {
  const ext = getExtension(filename);
  return ext in ALLOWED_VIDEO_MIME;
}

function isMediaFile(filename: string): boolean {
  return isImageFile(filename) || isVideoFile(filename);
}

function isIgnored(relativePath: string): boolean {
  const lower = relativePath.toLowerCase();
  if (IGNORED_PREFIXES.some((p) => lower.startsWith(p))) return true;
  const basename = lower.split("/").pop() ?? "";
  return IGNORED_FILES.has(basename) || basename.startsWith(".");
}

// ─── Date helpers ────────────────────────────────────────────────────────────

const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})_/;

/** Try to extract a YYYY-MM-DD date from the start of a folder name. */
function extractDateFromName(name: string): Date | null {
  const m = DATE_PREFIX_RE.exec(name);
  if (!m) return null;
  const d = new Date(`${m[1]}T10:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Auto-detect the post type from the list of media files.
 *   - 1 image  → "image"
 *   - 1 video  → "reel"
 *   - 2-10 images (or mix) → "carousel"
 */
function detectPostType(
  mediaFiles: ParsedMediaFile[]
): "image" | "carousel" | "reel" {
  if (mediaFiles.length === 1) {
    return isVideoFile(mediaFiles[0].filename) ? "reel" : "image";
  }
  return "carousel";
}

/**
 * Sanitize a folder name to prevent path traversal.
 * Returns null if the name is unsafe.
 */
function sanitizeFolderName(name: string): string | null {
  if (/\.\./.test(name)) return null;
  const safeOriginal = /^[a-zA-Z0-9_\-]+$/.test(name);
  return safeOriginal ? name : null;
}

// ─── Core types ──────────────────────────────────────────────────────────────

interface FolderParseResult {
  post?: ParsedPost;
  error?: string;
  warnings?: string[];
}

/** Intermediate bucket before we build ParsedPost objects. */
interface PostBucket {
  /** Display name / sort key for this post. */
  folderName: string;
  /** Files keyed by lower-cased basename → JSZip entry. */
  files: Map<string, JSZip.JSZipObject>;
  /** Date extracted from the folder name, if any. */
  extractedDate: Date | null;
}

// ─── Schedule options (passed from upload form) ─────────────────────────────

export interface ScheduleOptions {
  /** Start date in YYYY-MM-DD format */
  startDate?: string;
  /** Start time in HH:mm format */
  startTime?: string;
  /** "daily" or "custom" */
  frequency?: "daily" | "custom";
  /** Hours between posts (when frequency is "custom") */
  customHours?: number;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function parseZip(
  zipBuffer: Buffer,
  scheduleOpts?: ScheduleOptions
): Promise<ParseResult> {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];
  const posts: ParsedPost[] = [];

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBuffer);
  } catch {
    return {
      posts: [],
      errors: [
        {
          folder: "__root__",
          message: "Invalid or corrupt ZIP file",
          severity: "error",
        },
      ],
      warnings: [],
    };
  }

  // ── 1. Discover post buckets ────────────────────────────────────────────

  const buckets = discoverBuckets(zip);

  if (buckets.length === 0) {
    errors.push({
      folder: "__root__",
      message: "No media files found in the ZIP",
      severity: "error",
    });
    return { posts, errors, warnings };
  }

  // ── 2. Sort buckets: date-prefixed first (by date), then alphabetical ──

  buckets.sort((a, b) => {
    // Both have dates → compare dates
    if (a.extractedDate && b.extractedDate) {
      return a.extractedDate.getTime() - b.extractedDate.getTime();
    }
    // Only one has a date → it goes first
    if (a.extractedDate) return -1;
    if (b.extractedDate) return 1;
    // Neither has a date → alphabetical
    return a.folderName.localeCompare(b.folderName);
  });

  // ── 2.5. Read __schedule__.json if present (from image-drop uploads) ──
  let inlineSchedule: ScheduleOptions | undefined;
  const schedFile = zip.file("__schedule__.json");
  if (schedFile) {
    try {
      inlineSchedule = JSON.parse(await schedFile.async("string"));
    } catch { /* ignore bad JSON */ }
  }
  const sched = scheduleOpts ?? inlineSchedule;

  // ── 3. Parse each bucket into a ParsedPost ─────────────────────────────

  // Build start date from schedule options or default to tomorrow 10:00
  let nextAutoDate = new Date();
  if (sched?.startDate) {
    const [y, m, d] = sched.startDate.split("-").map(Number);
    nextAutoDate = new Date(y, m - 1, d);
  } else {
    nextAutoDate.setDate(nextAutoDate.getDate() + 1);
  }
  const [startH, startM] = (sched?.startTime ?? "10:00").split(":").map(Number);
  nextAutoDate.setHours(startH || 10, startM || 0, 0, 0);

  // Interval between posts
  const intervalMs =
    sched?.frequency === "custom" && sched.customHours
      ? sched.customHours * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000; // default: 1 day

  for (const bucket of buckets) {
    const result = await parseBucket(bucket, nextAutoDate);

    if (result.error) {
      errors.push({
        folder: bucket.folderName,
        message: result.error,
        severity: "error",
      });
      continue;
    }

    if (result.warnings) {
      for (const w of result.warnings) {
        warnings.push({
          folder: bucket.folderName,
          message: w,
          severity: "warning",
        });
      }
    }

    if (result.post) {
      posts.push(result.post);
      // Advance auto-schedule clock for the next post
      nextAutoDate = new Date(nextAutoDate.getTime() + intervalMs);
    }
  }

  return { posts, errors, warnings };
}

// ─── Bucket discovery ────────────────────────────────────────────────────────

/**
 * Walk every entry in the ZIP and group them into PostBuckets.
 *
 * Rules:
 *  - Files inside a top-level folder are grouped by that folder.
 *  - Files at the root (no folder) become individual single-file buckets.
 *  - We skip nested sub-sub-folders (only one level of grouping).
 *  - Junk / system files are silently ignored.
 */
function discoverBuckets(zip: JSZip): PostBucket[] {
  const folderBuckets = new Map<string, PostBucket>();
  const rootFiles: Array<{ basename: string; entry: JSZip.JSZipObject }> = [];

  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    if (isIgnored(relativePath)) return;

    const parts = relativePath.split("/").filter(Boolean);

    if (parts.length === 1) {
      // Root-level file
      rootFiles.push({ basename: parts[0], entry: file });
    } else if (parts.length >= 2) {
      // File inside a folder – group by the first path component
      const topFolder = parts[0];
      const basename = parts[parts.length - 1];

      // Skip if basename is junk
      if (isIgnored(basename)) return;

      if (!folderBuckets.has(topFolder)) {
        folderBuckets.set(topFolder, {
          folderName: topFolder,
          files: new Map(),
          extractedDate: extractDateFromName(topFolder),
        });
      }
      const bucket = folderBuckets.get(topFolder)!;
      bucket.files.set(basename.toLowerCase(), file);
    }
  });

  const buckets: PostBucket[] = [];

  // Folder-based buckets (only keep those that actually contain media)
  for (const bucket of folderBuckets.values()) {
    const hasMedia = Array.from(bucket.files.keys()).some((name) =>
      isMediaFile(name)
    );
    if (hasMedia) {
      buckets.push(bucket);
    }
  }

  // Root-level loose media files → each becomes its own bucket
  for (const { basename, entry } of rootFiles) {
    if (!isMediaFile(basename)) continue;
    const bucket: PostBucket = {
      folderName: basename,
      files: new Map([[basename.toLowerCase(), entry]]),
      extractedDate: null,
    };
    buckets.push(bucket);
  }

  return buckets;
}

// ─── Bucket → ParsedPost ────────────────────────────────────────────────────

async function parseBucket(
  bucket: PostBucket,
  fallbackDate: Date
): Promise<FolderParseResult> {
  const warnings: string[] = [];
  const { folderName, files } = bucket;

  // Safety-check folder name (skip for root-level single files)
  if (files.size > 1 || !isMediaFile(folderName)) {
    const safeName = sanitizeFolderName(folderName);
    if (!safeName) {
      return { error: `Unsafe folder name: "${folderName}"` };
    }
  }

  // ── Collect media files ──────────────────────────────────────────────────

  const mediaEntries = Array.from(files.entries())
    .filter(([name]) => isMediaFile(name))
    .sort(([a], [b]) => a.localeCompare(b));

  if (mediaEntries.length === 0) {
    return { error: "No media files found (expected .jpg, .png, .mp4, .mov, etc.)" };
  }

  const mediaFiles: ParsedMediaFile[] = [];
  for (const [filename, zipEntry] of mediaEntries) {
    const mimeType = getMimeType(filename);
    if (!mimeType) {
      warnings.push(`Skipping unsupported file: ${filename}`);
      continue;
    }

    const buffer = Buffer.from(await zipEntry.async("arraybuffer"));
    const fileHash = hashSHA256(buffer);

    mediaFiles.push({ filename, buffer, mimeType, fileHash });
  }

  if (mediaFiles.length === 0) {
    return { error: "No valid media files found after filtering" };
  }

  // ── Parse optional caption.txt ───────────────────────────────────────────

  let caption = "";
  const captionEntry = files.get("caption.txt");
  if (captionEntry) {
    caption = (await captionEntry.async("string")).trim();
  } else {
    warnings.push("No caption.txt found – caption left empty");
  }

  // ── Parse optional meta.json or generate defaults ────────────────────────

  let metaJson: MetaJson;
  const metaEntry = files.get("meta.json");

  if (metaEntry) {
    try {
      const metaRaw = await metaEntry.async("string");
      metaJson = JSON.parse(metaRaw) as MetaJson;
    } catch {
      return { error: "meta.json is invalid JSON" };
    }

    // Validate the fields that are present
    const metaError = validateMetaJson(metaJson);
    if (metaError) return { error: metaError };
  } else {
    // Auto-generate meta
    const autoType = detectPostType(mediaFiles);
    const publishDate = bucket.extractedDate ?? fallbackDate;

    metaJson = {
      publish_at: publishDate.toISOString(),
      type: autoType,
    };

    const parts: string[] = [
      `Auto-generated meta: type="${autoType}"`,
      `publish_at="${metaJson.publish_at}"`,
    ];
    if (!bucket.extractedDate) {
      parts.push("(date auto-scheduled)");
    }
    warnings.push(parts.join(", "));
  }

  // ── Type-specific validation ─────────────────────────────────────────────

  const typeWarning = validateMediaForType(metaJson.type, mediaFiles);
  if (typeWarning) {
    // For auto-generated meta we can be lenient – adjust the type
    if (!metaEntry) {
      // Re-detect with the actual files
      metaJson.type = detectPostType(mediaFiles);
    } else {
      return { error: typeWarning };
    }
  }

  // Extra: warn if carousel exceeds Meta API limit
  if (metaJson.type === "carousel" && mediaFiles.length > 10) {
    warnings.push("Carousel has more than 10 items; Meta API limit is 10");
  }

  return {
    post: {
      folderName,
      metaJson,
      caption,
      mediaFiles,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ─── Validation helpers ──────────────────────────────────────────────────────

/**
 * Validate a user-supplied meta.json. All fields are now optional except `type`
 * and `publish_at` (when provided they must be valid).
 */
function validateMetaJson(meta: Partial<MetaJson>): string | null {
  if (meta.type && !["image", "carousel", "reel"].includes(meta.type)) {
    return `meta.json type must be one of: image, carousel, reel (got: ${meta.type})`;
  }

  if (meta.publish_at) {
    const publishDate = new Date(meta.publish_at);
    if (isNaN(publishDate.getTime())) {
      return `meta.json publish_at is not a valid ISO 8601 date: ${meta.publish_at}`;
    }
  }

  // business_slug is optional – the batch processor fills it in
  return null;
}

/**
 * Check that the media files are compatible with the declared post type.
 * Returns an error string if invalid, null if OK.
 */
function validateMediaForType(
  type: MetaJson["type"],
  mediaFiles: ParsedMediaFile[]
): string | null {
  switch (type) {
    case "image":
      if (mediaFiles.length !== 1) {
        return `Image post must have exactly 1 image, found ${mediaFiles.length}`;
      }
      if (!isImageFile(mediaFiles[0].filename)) {
        return "Image post media must be an image file (.jpg, .png, .webp)";
      }
      break;

    case "carousel":
      if (mediaFiles.length < 2) {
        return "Carousel post must have at least 2 media files";
      }
      break;

    case "reel":
      if (mediaFiles.length !== 1) {
        return `Reel post must have exactly 1 video, found ${mediaFiles.length}`;
      }
      if (!isVideoFile(mediaFiles[0].filename)) {
        return "Reel post media must be a video file (.mp4, .mov)";
      }
      break;
  }

  return null;
}
