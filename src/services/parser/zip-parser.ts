/**
 * ZIP import parser.
 * Reads a ZIP buffer, extracts post folders, validates structure,
 * and returns parsed posts with their media, captions, and meta.json.
 */
import JSZip from "jszip";
import { hashSHA256 } from "@/lib/crypto";
import type { MetaJson, ParsedPost, ParsedMediaFile, ParseResult, ParseError } from "@/types";

// Allowed media types
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

/**
 * Sanitize a folder name to prevent path traversal.
 * Returns null if the name is unsafe.
 */
function sanitizeFolderName(name: string): string | null {
  const clean = name.replace(/\.\./g, "").replace(/[^a-zA-Z0-9_\-]/g, "");
  if (!clean || clean !== name.replace(/[^a-zA-Z0-9_\-]/g, "")) {
    // Allow the original if it only has safe chars
    const safeOriginal = /^[a-zA-Z0-9_\-]+$/.test(name);
    return safeOriginal ? name : null;
  }
  return name;
}

export async function parseZip(zipBuffer: Buffer): Promise<ParseResult> {
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];
  const posts: ParsedPost[] = [];

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBuffer);
  } catch (err) {
    return {
      posts: [],
      errors: [{ folder: "__root__", message: "Invalid or corrupt ZIP file", severity: "error" }],
      warnings: [],
    };
  }

  // Find all top-level folders that look like YYYY-MM or YYYY-MM/YYYY-MM-DD_*
  // Structure: optional YYYY-MM wrapper → YYYY-MM-DD_post-XX folders
  const postFolders = discoverPostFolders(zip);

  if (postFolders.length === 0) {
    errors.push({
      folder: "__root__",
      message: "No post folders found. Expected folders named YYYY-MM-DD_<name>",
      severity: "error",
    });
    return { posts, errors, warnings };
  }

  for (const folderPath of postFolders) {
    const folderName = folderPath.split("/").filter(Boolean).pop() ?? folderPath;

    // Validate folder name safety
    if (!sanitizeFolderName(folderName)) {
      errors.push({
        folder: folderName,
        message: `Unsafe folder name: "${folderName}"`,
        severity: "error",
      });
      continue;
    }

    const result = await parsePostFolder(zip, folderPath, folderName);
    if (result.error) {
      errors.push({ folder: folderName, message: result.error, severity: "error" });
      continue;
    }
    if (result.warnings) {
      for (const w of result.warnings) {
        warnings.push({ folder: folderName, message: w, severity: "warning" });
      }
    }
    if (result.post) {
      posts.push(result.post);
    }
  }

  return { posts, errors, warnings };
}

function discoverPostFolders(zip: JSZip): string[] {
  const folders = new Set<string>();

  zip.forEach((relativePath, file) => {
    if (file.dir) return;

    // Split path and find post folder (YYYY-MM-DD_*)
    const parts = relativePath.split("/").filter(Boolean);

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (/^\d{4}-\d{2}-\d{2}_/.test(part)) {
        // Build full path to this folder
        const folderPath = parts.slice(0, i + 1).join("/") + "/";
        folders.add(folderPath);
        break;
      }
    }
  });

  return Array.from(folders).sort();
}

interface FolderParseResult {
  post?: ParsedPost;
  error?: string;
  warnings?: string[];
}

async function parsePostFolder(
  zip: JSZip,
  folderPath: string,
  folderName: string
): Promise<FolderParseResult> {
  const warnings: string[] = [];

  // Get all files in this folder (non-recursive, direct children only)
  const filesInFolder: Record<string, JSZip.JSZipObject> = {};
  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    if (relativePath.startsWith(folderPath)) {
      const relative = relativePath.slice(folderPath.length);
      // Only direct children (no sub-folders)
      if (!relative.includes("/")) {
        filesInFolder[relative.toLowerCase()] = file;
      }
    }
  });

  // Validate required files
  if (!filesInFolder["caption.txt"]) {
    return { error: "Missing caption.txt" };
  }
  if (!filesInFolder["meta.json"]) {
    return { error: "Missing meta.json" };
  }

  // Parse caption
  const captionRaw = await filesInFolder["caption.txt"].async("string");
  const caption = captionRaw.trim();
  if (!caption) {
    return { error: "caption.txt is empty" };
  }

  // Parse meta.json
  let metaJson: MetaJson;
  try {
    const metaRaw = await filesInFolder["meta.json"].async("string");
    metaJson = JSON.parse(metaRaw) as MetaJson;
  } catch {
    return { error: "meta.json is invalid JSON" };
  }

  // Validate meta.json fields
  const metaError = validateMetaJson(metaJson);
  if (metaError) return { error: metaError };

  // Collect media files
  const mediaFiles: ParsedMediaFile[] = [];
  const mediaEntries = Object.entries(filesInFolder)
    .filter(([name]) => isMediaFile(name))
    .sort(([a], [b]) => a.localeCompare(b));

  if (mediaEntries.length === 0) {
    return { error: "No media files found (expected .jpg, .png, .mp4, .mov, etc.)" };
  }

  for (const [filename, zipEntry] of mediaEntries) {
    const mimeType = getMimeType(filename);
    if (!mimeType) {
      warnings.push(`Skipping unsupported file: ${filename}`);
      continue;
    }

    const buffer = Buffer.from(await zipEntry.async("arraybuffer"));
    const fileHash = hashSHA256(buffer);

    mediaFiles.push({
      filename,
      buffer,
      mimeType,
      fileHash,
    });
  }

  if (mediaFiles.length === 0) {
    return { error: "No valid media files found after filtering" };
  }

  // Type-specific validation
  switch (metaJson.type) {
    case "image":
      if (mediaFiles.length !== 1) {
        return {
          error: `Image post must have exactly 1 image, found ${mediaFiles.length}`,
        };
      }
      if (!isImageFile(mediaFiles[0].filename)) {
        return { error: "Image post media must be an image file (.jpg, .png, .webp)" };
      }
      break;

    case "carousel":
      if (mediaFiles.length < 2) {
        return { error: "Carousel post must have at least 2 media files" };
      }
      if (mediaFiles.length > 10) {
        warnings.push("Carousel has more than 10 items; Meta API limit is 10");
      }
      break;

    case "reel":
      if (mediaFiles.length !== 1) {
        return {
          error: `Reel post must have exactly 1 video, found ${mediaFiles.length}`,
        };
      }
      if (!isVideoFile(mediaFiles[0].filename)) {
        return { error: "Reel post media must be a video file (.mp4, .mov)" };
      }
      break;
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

function validateMetaJson(meta: Partial<MetaJson>): string | null {
  if (!meta.publish_at) return "meta.json missing required field: publish_at";
  if (!meta.type) return "meta.json missing required field: type";
  if (!meta.business_slug) return "meta.json missing required field: business_slug";

  if (!["image", "carousel", "reel"].includes(meta.type)) {
    return `meta.json type must be one of: image, carousel, reel (got: ${meta.type})`;
  }

  // Validate date/time
  const publishDate = new Date(meta.publish_at);
  if (isNaN(publishDate.getTime())) {
    return `meta.json publish_at is not a valid ISO 8601 date: ${meta.publish_at}`;
  }

  return null;
}
