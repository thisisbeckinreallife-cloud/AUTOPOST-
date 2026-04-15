/**
 * Client-side ZIP analyzer for smart post detection.
 * Runs entirely in the browser using JSZip.
 * Does NOT modify the backend — just provides intelligent previews.
 */
import JSZip from "jszip";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalyzedMedia {
  filename: string;
  path: string;
  type: "image" | "video";
  mimeType: string;
  data: ArrayBuffer;
  /** Blob URL for preview (images only) */
  previewUrl?: string;
  size: number;
}

export interface DetectedPost {
  id: string;
  mediaFiles: AnalyzedMedia[];
  caption: string;
  /** Where the caption came from */
  captionSource: "file" | "user" | "none";
  /** Post readiness */
  status: "complete" | "incomplete" | "error";
  /** Status message for the user */
  statusMessage: string;
  /** How confident the match is */
  matchConfidence: "high" | "low" | "manual";
  /** Original folder name or filename */
  sourceName: string;
  /** Date extracted from filename, if any */
  extractedDate: Date | null;
  /** Scheduled publish date (set during schedule config) */
  publishAt: Date | null;
  /** Post type auto-detected */
  postType: "image" | "carousel" | "reel";
  /** Instagram collaborators (usernames) — post appears on both feeds */
  collaborators: string[];
}

export interface AnalysisResult {
  posts: DetectedPost[];
  /** What structure pattern was detected */
  detectedPattern:
    | "perfect"        // Well-structured folders
    | "flat_images"    // Just images at root
    | "separated"      // images/ + copies/ folders
    | "name_matched"   // post1.jpg + post1.txt pattern
    | "mixed"          // Some of everything
    | "only_text"      // Only text files
    | "direct_upload"  // Direct file upload (no ZIP)
    | "unknown";
  /** Human-readable summary */
  summary: string;
  /** Any issues found */
  warnings: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);
const TEXT_EXTENSIONS = new Set(["txt"]);
const IGNORED_FILES = new Set([".ds_store", "thumbs.db", "desktop.ini"]);
const IGNORED_PREFIXES = ["__macosx/", "._"];
const DATE_RE = /(\d{4})[_-](\d{2})[_-](\d{2})/;

function ext(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(ext(filename));
}

function isVideo(filename: string): boolean {
  return VIDEO_EXTENSIONS.has(ext(filename));
}

function isMedia(filename: string): boolean {
  return isImage(filename) || isVideo(filename);
}

function isText(filename: string): boolean {
  return TEXT_EXTENSIONS.has(ext(filename));
}

function isIgnored(path: string): boolean {
  const lower = path.toLowerCase();
  if (IGNORED_PREFIXES.some((p) => lower.includes(p))) return true;
  const basename = lower.split("/").pop() ?? "";
  return IGNORED_FILES.has(basename) || basename.startsWith(".");
}

function baseName(filename: string): string {
  const parts = filename.split(".");
  parts.pop();
  return parts.join(".").toLowerCase().replace(/[_\-\s]+/g, "");
}

function extractDate(name: string): Date | null {
  const m = DATE_RE.exec(name);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T10:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function detectPostType(media: AnalyzedMedia[]): "image" | "carousel" | "reel" {
  if (media.length === 1) {
    return media[0].type === "video" ? "reel" : "image";
  }
  return "carousel";
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getStatusInfo(post: Omit<DetectedPost, "status" | "statusMessage">): {
  status: DetectedPost["status"];
  statusMessage: string;
} {
  if (post.mediaFiles.length === 0) {
    return { status: "error", statusMessage: "Sin foto o video" };
  }
  if (!post.caption) {
    return { status: "incomplete", statusMessage: "Sin texto. Puedes agregarlo ahora." };
  }
  return { status: "complete", statusMessage: "Listo para publicar" };
}

// ─── Main analyzer ──────────────────────────────────────────────────────────

export async function analyzeZip(file: File): Promise<AnalysisResult> {
  const warnings: string[] = [];
  const buffer = await file.arrayBuffer();

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return {
      posts: [],
      detectedPattern: "unknown",
      summary: "No pudimos leer el archivo. Asegurate de que sea un ZIP valido.",
      warnings: ["El archivo no es un ZIP valido o esta corrupto."],
    };
  }

  // Collect all files by category
  const allFiles: Array<{
    path: string;
    basename: string;
    folder: string;
    entry: JSZip.JSZipObject;
  }> = [];

  zip.forEach((path, entry) => {
    if (entry.dir || isIgnored(path)) return;
    const parts = path.split("/").filter(Boolean);
    const basename = parts[parts.length - 1];
    const folder = parts.length > 1 ? parts[0] : "__root__";
    allFiles.push({ path, basename, folder, entry });
  });

  const mediaFiles = allFiles.filter((f) => isMedia(f.basename));
  const textFiles = allFiles.filter((f) => isText(f.basename));

  if (mediaFiles.length === 0 && textFiles.length === 0) {
    return {
      posts: [],
      detectedPattern: "unknown",
      summary: "No encontramos fotos, videos o textos en tu archivo.",
      warnings: ["El ZIP no contiene archivos compatibles."],
    };
  }

  if (mediaFiles.length === 0 && textFiles.length > 0) {
    return {
      posts: [],
      detectedPattern: "only_text",
      summary: "Solo encontramos archivos de texto, pero no fotos ni videos.",
      warnings: ["Necesitas incluir al menos una foto o video por post."],
    };
  }

  // Detect the structure pattern
  const pattern = detectPattern(allFiles, mediaFiles, textFiles);

  let posts: DetectedPost[];

  switch (pattern) {
    case "perfect":
      posts = await parsePerfectStructure(allFiles, mediaFiles, textFiles);
      break;
    case "separated":
      posts = await parseSeparatedStructure(allFiles, mediaFiles, textFiles, warnings);
      break;
    case "name_matched":
      posts = await parseNameMatchedStructure(mediaFiles, textFiles);
      break;
    case "flat_images":
      posts = await parseFlatImages(mediaFiles);
      break;
    default:
      posts = await parseMixedStructure(allFiles, mediaFiles, textFiles, warnings);
      break;
  }

  // Generate summary
  const completeCount = posts.filter((p) => p.status === "complete").length;
  const incompleteCount = posts.filter((p) => p.status === "incomplete").length;
  const errorCount = posts.filter((p) => p.status === "error").length;

  let summary = `Encontramos ${posts.length} post${posts.length !== 1 ? "s" : ""}.`;
  if (completeCount === posts.length) {
    summary += " Todo esta perfecto.";
  } else {
    if (incompleteCount > 0)
      summary += ` ${incompleteCount} necesita${incompleteCount !== 1 ? "n" : ""} atencion.`;
    if (errorCount > 0) summary += ` ${errorCount} tiene${errorCount !== 1 ? "n" : ""} problemas.`;
  }

  return { posts, detectedPattern: pattern, summary, warnings };
}

// ─── Pattern detection ──────────────────────────────────────────────────────

function detectPattern(
  all: typeof Array.prototype,
  media: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  text: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>
): AnalysisResult["detectedPattern"] {
  const folders = new Set(media.map((f) => f.folder));

  // Check for separated structure: images/ + copies/ or similar
  const folderNames = [...folders].map((f) => f.toLowerCase());
  const hasMediaFolder = folderNames.some((f) =>
    ["images", "imagenes", "fotos", "photos", "media", "creativos", "creatives", "videos"].includes(f)
  );
  const hasTextFolder = folderNames.some((f) =>
    ["copies", "textos", "texts", "captions", "copy", "copys"].includes(f)
  );
  if (hasMediaFolder && hasTextFolder) return "separated";

  // Check for name matching: post1.jpg + post1.txt at root
  if (
    media.every((f) => f.folder === "__root__") &&
    text.length > 0 &&
    text.every((f) => f.folder === "__root__")
  ) {
    const mediaBases = new Set(media.map((f) => baseName(f.basename)));
    const textBases = new Set(text.map((f) => baseName(f.basename)));
    const overlap = [...mediaBases].filter((b) => textBases.has(b));
    if (overlap.length > 0 && overlap.length >= Math.min(mediaBases.size, textBases.size) * 0.5) {
      return "name_matched";
    }
  }

  // Check for perfect structure: folders with media + optional caption.txt
  const foldersWithMedia = [...folders].filter((f) => f !== "__root__");
  if (foldersWithMedia.length > 0) {
    const allHaveMedia = foldersWithMedia.every((folder) =>
      media.some((f) => f.folder === folder)
    );
    if (allHaveMedia) {
      // Check if folders also have caption.txt
      const hasCaptions = foldersWithMedia.some((folder) =>
        text.some((f) => f.folder === folder && f.basename.toLowerCase() === "caption.txt")
      );
      if (hasCaptions || text.length === 0) return "perfect";
    }
  }

  // Flat images at root
  if (media.every((f) => f.folder === "__root__") && text.length === 0) {
    return "flat_images";
  }

  return "mixed";
}

// ─── Structure parsers ──────────────────────────────────────────────────────

async function loadMedia(entry: JSZip.JSZipObject, filename: string, path: string): Promise<AnalyzedMedia> {
  const data = await entry.async("arraybuffer");
  const type = isVideo(filename) ? "video" : "image";
  const mimeType = type === "video"
    ? (ext(filename) === "mov" ? "video/quicktime" : "video/mp4")
    : (ext(filename) === "png" ? "image/png" : ext(filename) === "webp" ? "image/webp" : "image/jpeg");

  let previewUrl: string | undefined;
  if (type === "image") {
    const blob = new Blob([data], { type: mimeType });
    previewUrl = URL.createObjectURL(blob);
  }

  return { filename, path, type, mimeType, data, previewUrl, size: data.byteLength };
}

async function loadCaption(entry: JSZip.JSZipObject): Promise<string> {
  return (await entry.async("string")).trim();
}

/** Perfect structure: each folder = one post */
async function parsePerfectStructure(
  all: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  media: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  text: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>
): Promise<DetectedPost[]> {
  const folders = new Set(
    all.filter((f) => f.folder !== "__root__").map((f) => f.folder)
  );
  const posts: DetectedPost[] = [];

  for (const folder of folders) {
    const folderMedia = media.filter((f) => f.folder === folder);
    const captionFile = text.find(
      (f) => f.folder === folder && f.basename.toLowerCase() === "caption.txt"
    );

    if (folderMedia.length === 0) continue;

    const mediaItems = await Promise.all(
      folderMedia.map((f) => loadMedia(f.entry, f.basename, f.path))
    );
    const caption = captionFile ? await loadCaption(captionFile.entry) : "";
    const captionSource = captionFile ? "file" : "none";
    const extractedDate = extractDate(folder);
    const postType = detectPostType(mediaItems);

    const partial = {
      id: generateId(),
      mediaFiles: mediaItems,
      caption,
      captionSource: captionSource as DetectedPost["captionSource"],
      matchConfidence: "high" as const,
      sourceName: folder,
      extractedDate,
      publishAt: extractedDate,
      postType,
      collaborators: [] as string[],
    };

    const { status, statusMessage } = getStatusInfo(partial);
    posts.push({ ...partial, status, statusMessage });
  }

  // Also handle root-level loose media
  const rootMedia = media.filter((f) => f.folder === "__root__");
  for (const file of rootMedia) {
    const mediaItem = await loadMedia(file.entry, file.basename, file.path);
    const extractedDate = extractDate(file.basename);
    const partial = {
      id: generateId(),
      mediaFiles: [mediaItem],
      caption: "",
      captionSource: "none" as const,
      matchConfidence: "high" as const,
      sourceName: file.basename,
      extractedDate,
      publishAt: extractedDate,
      postType: detectPostType([mediaItem]),
      collaborators: [] as string[],
    };
    const { status, statusMessage } = getStatusInfo(partial);
    posts.push({ ...partial, status, statusMessage });
  }

  return posts.sort((a, b) => {
    if (a.extractedDate && b.extractedDate) return a.extractedDate.getTime() - b.extractedDate.getTime();
    if (a.extractedDate) return -1;
    if (b.extractedDate) return 1;
    return a.sourceName.localeCompare(b.sourceName);
  });
}

/** Separated: images/ + copies/ folders */
async function parseSeparatedStructure(
  all: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  media: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  text: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  warnings: string[]
): Promise<DetectedPost[]> {
  // Sort media and text alphabetically by filename for order-based matching
  const sortedMedia = [...media].sort((a, b) => a.basename.localeCompare(b.basename));
  const sortedText = [...text].sort((a, b) => a.basename.localeCompare(b.basename));

  const posts: DetectedPost[] = [];
  const matchedTextIndices = new Set<number>();

  for (const file of sortedMedia) {
    const mediaItem = await loadMedia(file.entry, file.basename, file.path);
    const mediaBase = baseName(file.basename);

    // Try name matching first
    let caption = "";
    let captionSource: DetectedPost["captionSource"] = "none";
    let confidence: DetectedPost["matchConfidence"] = "high";

    const nameMatch = sortedText.findIndex(
      (t, i) => !matchedTextIndices.has(i) && baseName(t.basename) === mediaBase
    );

    if (nameMatch >= 0) {
      caption = await loadCaption(sortedText[nameMatch].entry);
      captionSource = "file";
      matchedTextIndices.add(nameMatch);
      confidence = "high";
    }

    const extractedDate = extractDate(file.basename);
    const partial = {
      id: generateId(),
      mediaFiles: [mediaItem],
      caption,
      captionSource,
      matchConfidence: confidence,
      sourceName: file.basename,
      extractedDate,
      publishAt: extractedDate,
      postType: detectPostType([mediaItem]),
      collaborators: [] as string[],
    };
    const { status, statusMessage } = getStatusInfo(partial);
    posts.push({ ...partial, status, statusMessage });
  }

  // Try order-based matching for unmatched
  const unmatchedPosts = posts.filter((p) => p.captionSource === "none");
  const unmatchedTexts = sortedText.filter((_, i) => !matchedTextIndices.has(i));

  if (unmatchedPosts.length > 0 && unmatchedTexts.length > 0) {
    const matchCount = Math.min(unmatchedPosts.length, unmatchedTexts.length);
    warnings.push(
      `Emparejamos ${matchCount} texto${matchCount !== 1 ? "s" : ""} por orden. Revisa que esten bien.`
    );
    for (let i = 0; i < matchCount; i++) {
      const caption = await loadCaption(unmatchedTexts[i].entry);
      unmatchedPosts[i].caption = caption;
      unmatchedPosts[i].captionSource = "file";
      unmatchedPosts[i].matchConfidence = "low";
      const { status, statusMessage } = getStatusInfo(unmatchedPosts[i]);
      unmatchedPosts[i].status = status;
      unmatchedPosts[i].statusMessage = statusMessage;
    }
  }

  return posts;
}

/** Name matched: post1.jpg + post1.txt at root */
async function parseNameMatchedStructure(
  media: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  text: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>
): Promise<DetectedPost[]> {
  const textMap = new Map<string, typeof text[0]>();
  for (const t of text) {
    textMap.set(baseName(t.basename), t);
  }

  const posts: DetectedPost[] = [];

  for (const file of media) {
    const mediaItem = await loadMedia(file.entry, file.basename, file.path);
    const base = baseName(file.basename);
    const matchedText = textMap.get(base);

    let caption = "";
    let captionSource: DetectedPost["captionSource"] = "none";

    if (matchedText) {
      caption = await loadCaption(matchedText.entry);
      captionSource = "file";
    }

    const extractedDate = extractDate(file.basename);
    const partial = {
      id: generateId(),
      mediaFiles: [mediaItem],
      caption,
      captionSource,
      matchConfidence: matchedText ? ("high" as const) : ("low" as const),
      sourceName: file.basename,
      extractedDate,
      publishAt: extractedDate,
      postType: detectPostType([mediaItem]),
      collaborators: [] as string[],
    };
    const { status, statusMessage } = getStatusInfo(partial);
    posts.push({ ...partial, status, statusMessage });
  }

  return posts.sort((a, b) => a.sourceName.localeCompare(b.sourceName));
}

/** Flat images: each image = one post */
async function parseFlatImages(
  media: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>
): Promise<DetectedPost[]> {
  const sorted = [...media].sort((a, b) => a.basename.localeCompare(b.basename));
  const posts: DetectedPost[] = [];

  for (const file of sorted) {
    const mediaItem = await loadMedia(file.entry, file.basename, file.path);
    const extractedDate = extractDate(file.basename);
    const partial = {
      id: generateId(),
      mediaFiles: [mediaItem],
      caption: "",
      captionSource: "none" as const,
      matchConfidence: "high" as const,
      sourceName: file.basename,
      extractedDate,
      publishAt: extractedDate,
      postType: detectPostType([mediaItem]),
      collaborators: [] as string[],
    };
    const { status, statusMessage } = getStatusInfo(partial);
    posts.push({ ...partial, status, statusMessage });
  }

  return posts;
}

/** Mixed: try best effort */
async function parseMixedStructure(
  all: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  media: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  text: Array<{ path: string; basename: string; folder: string; entry: JSZip.JSZipObject }>,
  warnings: string[]
): Promise<DetectedPost[]> {
  warnings.push("Tu archivo tiene una estructura mixta. Hicimos lo mejor posible para organizarlo.");

  // Group by folder first, then handle root-level
  const folderMedia = new Map<string, typeof media>();
  const folderText = new Map<string, typeof text>();

  for (const f of media) {
    if (!folderMedia.has(f.folder)) folderMedia.set(f.folder, []);
    folderMedia.get(f.folder)!.push(f);
  }
  for (const f of text) {
    if (!folderText.has(f.folder)) folderText.set(f.folder, []);
    folderText.get(f.folder)!.push(f);
  }

  const posts: DetectedPost[] = [];

  for (const [folder, files] of folderMedia.entries()) {
    if (folder === "__root__") {
      // Root files: try name matching with text, otherwise individual posts
      const rootTexts = folderText.get("__root__") ?? [];
      const textMap = new Map<string, typeof text[0]>();
      for (const t of rootTexts) textMap.set(baseName(t.basename), t);

      for (const file of files) {
        const mediaItem = await loadMedia(file.entry, file.basename, file.path);
        const matchedText = textMap.get(baseName(file.basename));
        const caption = matchedText ? await loadCaption(matchedText.entry) : "";
        const captionSource = matchedText ? "file" : "none";
        const extractedDate = extractDate(file.basename);
        const partial = {
          id: generateId(),
          mediaFiles: [mediaItem],
          caption,
          captionSource: captionSource as DetectedPost["captionSource"],
          matchConfidence: (matchedText ? "high" : "low") as DetectedPost["matchConfidence"],
          sourceName: file.basename,
          extractedDate,
          publishAt: extractedDate,
          postType: detectPostType([mediaItem]),
          collaborators: [] as string[],
        };
        const { status, statusMessage } = getStatusInfo(partial);
        posts.push({ ...partial, status, statusMessage });
      }
    } else {
      // Folder: all media = one post
      const mediaItems = await Promise.all(
        files.map((f) => loadMedia(f.entry, f.basename, f.path))
      );
      const folderTexts = folderText.get(folder) ?? [];
      const captionFile = folderTexts.find((t) => t.basename.toLowerCase() === "caption.txt");
      const caption = captionFile ? await loadCaption(captionFile.entry) : "";
      const captionSource = captionFile ? "file" : "none";
      const extractedDate = extractDate(folder);
      const partial = {
        id: generateId(),
        mediaFiles: mediaItems,
        caption,
        captionSource: captionSource as DetectedPost["captionSource"],
        matchConfidence: "high" as const,
        sourceName: folder,
        extractedDate,
        publishAt: extractedDate,
        postType: detectPostType(mediaItems),
        collaborators: [] as string[],
      };
      const { status, statusMessage } = getStatusInfo(partial);
      posts.push({ ...partial, status, statusMessage });
    }
  }

  return posts.sort((a, b) => a.sourceName.localeCompare(b.sourceName));
}

// ─── ZIP Repacker ───────────────────────────────────────────────────────────

/**
 * Repack analyzed posts into a clean ZIP that the backend parser understands.
 * Each post becomes a folder with media + caption.txt + meta.json.
 */
export async function repackZip(posts: DetectedPost[]): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (post.status === "error") continue;

    // Determine publish date — always required by backend.
    // Add 10-minute buffer so it's never "too soon" for the validator.
    let publishDate: Date;
    if (post.publishAt) {
      publishDate = new Date(post.publishAt);
      const minTime = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
      if (publishDate < minTime) {
        publishDate = minTime;
      }
    } else {
      // Fallback: schedule 24h from now + index offset
      publishDate = new Date(Date.now() + (24 + i) * 60 * 60 * 1000);
    }

    // Build folder name
    const d = publishDate;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const safeName = post.sourceName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .substring(0, 30);
    const folderName = `${dateStr}_${safeName || `post${i + 1}`}`;

    const folder = zip.folder(folderName)!;

    // Add media files
    for (const media of post.mediaFiles) {
      folder.file(media.filename, media.data);
    }

    // Add caption
    if (post.caption) {
      folder.file("caption.txt", post.caption);
    }

    // Add meta.json — publish_at is ALWAYS required by the backend
    const meta: Record<string, unknown> = {
      type: post.postType,
      publish_at: publishDate.toISOString(),
    };
    if (post.collaborators && post.collaborators.length > 0) {
      meta.collaborators = post.collaborators;
    }
    folder.file("meta.json", JSON.stringify(meta, null, 2));
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

// ─── Direct Media Analyzer ─────────────────────────────────────────────────

/**
 * Analyze directly uploaded media files (no ZIP).
 * Groups files into posts: 1 video → reel, 1 image → image, multiple → carousel.
 */
export function analyzeDirectMedia(files: File[]): AnalysisResult {
  const warnings: string[] = [];

  const mediaFiles: Array<{ file: File; type: "image" | "video" }> = [];
  for (const file of files) {
    const name = file.name.toLowerCase();
    if (isImage(name)) {
      mediaFiles.push({ file, type: "image" });
    } else if (isVideo(name)) {
      mediaFiles.push({ file, type: "video" });
    } else {
      warnings.push(`Archivo ignorado: ${file.name} (formato no soportado)`);
    }
  }

  if (mediaFiles.length === 0) {
    return {
      posts: [],
      detectedPattern: "direct_upload",
      summary: "No encontramos fotos o videos compatibles.",
      warnings,
    };
  }

  // Group videos as individual reels, images together as carousel or single
  const posts: DetectedPost[] = [];
  const videos = mediaFiles.filter((f) => f.type === "video");
  const images = mediaFiles.filter((f) => f.type === "image");

  // Each video becomes its own reel
  for (const v of videos) {
    const mimeType = ext(v.file.name) === "mov" ? "video/quicktime" : "video/mp4";
    const previewUrl = URL.createObjectURL(v.file);
    const media: AnalyzedMedia = {
      filename: v.file.name,
      path: v.file.name,
      type: "video",
      mimeType,
      data: new ArrayBuffer(0), // Not needed for direct upload — file is uploaded separately
      previewUrl,
      size: v.file.size,
    };

    const partial = {
      id: generateId(),
      mediaFiles: [media],
      caption: "",
      captionSource: "none" as const,
      matchConfidence: "high" as const,
      sourceName: v.file.name,
      extractedDate: null,
      publishAt: null,
      postType: "reel" as const,
      collaborators: [] as string[],
    };
    const { status, statusMessage } = getStatusInfo(partial);
    posts.push({ ...partial, status, statusMessage });
  }

  // Images: if 1 → image post, if 2-10 → carousel, if >10 → individual posts
  if (images.length >= 2 && images.length <= 10) {
    // One carousel
    const mediaItems: AnalyzedMedia[] = images.map((img) => {
      const e = ext(img.file.name);
      const mimeType = e === "png" ? "image/png" : e === "webp" ? "image/webp" : "image/jpeg";
      const previewUrl = URL.createObjectURL(img.file);
      return {
        filename: img.file.name,
        path: img.file.name,
        type: "image" as const,
        mimeType,
        data: new ArrayBuffer(0),
        previewUrl,
        size: img.file.size,
      };
    });

    const partial = {
      id: generateId(),
      mediaFiles: mediaItems,
      caption: "",
      captionSource: "none" as const,
      matchConfidence: "high" as const,
      sourceName: `${images.length} fotos`,
      extractedDate: null,
      publishAt: null,
      postType: "carousel" as const,
      collaborators: [] as string[],
    };
    const { status, statusMessage } = getStatusInfo(partial);
    posts.push({ ...partial, status, statusMessage });
  } else {
    // Individual image posts
    for (const img of images) {
      const e = ext(img.file.name);
      const mimeType = e === "png" ? "image/png" : e === "webp" ? "image/webp" : "image/jpeg";
      const previewUrl = URL.createObjectURL(img.file);
      const media: AnalyzedMedia = {
        filename: img.file.name,
        path: img.file.name,
        type: "image",
        mimeType,
        data: new ArrayBuffer(0),
        previewUrl,
        size: img.file.size,
      };

      const partial = {
        id: generateId(),
        mediaFiles: [media],
        caption: "",
        captionSource: "none" as const,
        matchConfidence: "high" as const,
        sourceName: img.file.name,
        extractedDate: null,
        publishAt: null,
        postType: "image" as const,
        collaborators: [] as string[],
      };
      const { status, statusMessage } = getStatusInfo(partial);
      posts.push({ ...partial, status, statusMessage });
    }
  }

  const summary = `${posts.length} post${posts.length !== 1 ? "s" : ""} detectado${posts.length !== 1 ? "s" : ""}. Agrega el texto y programa la publicacion.`;

  return {
    posts,
    detectedPattern: "direct_upload",
    summary,
    warnings,
  };
}

// ─── Cleanup ────────────────────────────────────────────────────────────────

/** Revoke all blob URLs to free memory */
export function cleanupPreviews(posts: DetectedPost[]): void {
  for (const post of posts) {
    for (const media of post.mediaFiles) {
      if (media.previewUrl) {
        URL.revokeObjectURL(media.previewUrl);
      }
    }
  }
}
