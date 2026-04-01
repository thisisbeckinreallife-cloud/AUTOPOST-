/**
 * Client-side smart file analyzer.
 * Takes raw dropped files and groups them into "smart posts" by:
 *   1. Matching images to text files by name (post1.jpg + post1.txt)
 *   2. Matching folders (images/ + copies/ or creativos/ + textos/)
 *   3. Detecting date patterns in file/folder names
 *   4. Grouping loose images into individual posts
 *
 * Runs entirely in the browser — no backend calls.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface SmartPost {
  id: string;
  images: DroppedFile[];
  caption: string;
  /** Where the caption came from */
  captionSource: "file" | "matched" | "manual" | "none";
  /** Date extracted from filename, if any */
  detectedDate: Date | null;
  /** Confidence level for auto-matching */
  confidence: "high" | "medium" | "low";
  /** Human-readable match explanation */
  matchReason: string;
  /** Status for UI */
  status: "ready" | "needs-caption" | "needs-review";
}

export interface DroppedFile {
  file: File;
  /** Relative path inside the dropped folder/zip */
  relativePath: string;
  /** Just the filename without extension */
  stem: string;
  /** Lowercase extension */
  ext: string;
  /** Is it a media file */
  isMedia: boolean;
  /** Is it a text file */
  isText: boolean;
  /** Content (for text files, read lazily) */
  textContent?: string;
}

export interface AnalysisResult {
  posts: SmartPost[];
  /** Unmatched text files that couldn't be paired */
  unmatchedTexts: DroppedFile[];
  /** Strategy used */
  strategy: string;
  /** Human-readable summary */
  summary: string;
}

// ─── Constants ──────────────────────────────────────────────────

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);
const VIDEO_EXTS = new Set(["mp4", "mov"]);
const MEDIA_EXTS = new Set([...IMAGE_EXTS, ...VIDEO_EXTS]);
const TEXT_EXTS = new Set(["txt"]);
const IGNORED = new Set([".ds_store", "thumbs.db", "__macosx"]);
const DATE_RE = /(\d{4})-(\d{2})-(\d{2})/;

// Caption-folder names (case-insensitive)
const COPY_FOLDER_NAMES = new Set([
  "copies", "copys", "copy", "textos", "texto",
  "captions", "caption", "texts", "text", "descripciones",
]);
const MEDIA_FOLDER_NAMES = new Set([
  "images", "imagenes", "fotos", "photos", "media",
  "creativos", "creativas", "videos", "reels",
]);

let idCounter = 0;
function nextId(): string {
  return `sp-${++idCounter}-${Date.now()}`;
}

// ─── Helpers ────────────────────────────────────────────────────

function getExt(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

function getStem(name: string): string {
  const parts = name.split(".");
  if (parts.length > 1) parts.pop();
  return parts.join(".").toLowerCase().trim();
}

function isIgnored(name: string): boolean {
  const lower = name.toLowerCase();
  return IGNORED.has(lower) || lower.startsWith(".");
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-_\s]+/g, "")
    .replace(/\d+/g, (m) => m.padStart(4, "0"));
}

function extractDate(name: string): Date | null {
  const m = DATE_RE.exec(name);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], 10, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).trim());
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

// ─── File classification ────────────────────────────────────────

function classifyFile(file: File, relativePath: string): DroppedFile | null {
  const name = file.name;
  if (isIgnored(name)) return null;

  const ext = getExt(name);
  const stem = getStem(name);
  const isMedia = MEDIA_EXTS.has(ext);
  const isText = TEXT_EXTS.has(ext) || name.toLowerCase() === "caption.txt";

  if (!isMedia && !isText) return null;

  return { file, relativePath, stem, ext, isMedia, isText };
}

// ─── Strategy: structured folders (YYYY-MM-DD_name/) ────────────

function tryStructuredFolders(
  folderMap: Map<string, DroppedFile[]>
): SmartPost[] | null {
  const structured: SmartPost[] = [];
  let matchCount = 0;

  for (const [folder, files] of folderMap) {
    if (DATE_RE.test(folder)) matchCount++;
  }

  // Need at least half the folders to match date pattern
  if (matchCount < folderMap.size * 0.5 && matchCount < 2) return null;

  for (const [folder, files] of folderMap) {
    const media = files.filter((f) => f.isMedia);
    const textFiles = files.filter((f) => f.isText);
    if (media.length === 0) continue;

    const captionFile = textFiles.find(
      (f) => f.file.name.toLowerCase() === "caption.txt" || f.isText
    );

    structured.push({
      id: nextId(),
      images: media,
      caption: "",
      captionSource: captionFile ? "file" : "none",
      detectedDate: extractDate(folder),
      confidence: "high",
      matchReason: `Carpeta "${folder}"`,
      status: captionFile ? "ready" : "needs-caption",
    });
  }

  return structured.length > 0 ? structured : null;
}

// ─── Strategy: separate media/copy folders ──────────────────────

function trySeparateFolders(
  folderMap: Map<string, DroppedFile[]>
): SmartPost[] | null {
  const folderNames = Array.from(folderMap.keys());
  const lowerNames = folderNames.map((n) => n.toLowerCase());

  let mediaFolder: string | null = null;
  let copyFolder: string | null = null;

  for (let i = 0; i < folderNames.length; i++) {
    if (MEDIA_FOLDER_NAMES.has(lowerNames[i])) mediaFolder = folderNames[i];
    if (COPY_FOLDER_NAMES.has(lowerNames[i])) copyFolder = folderNames[i];
  }

  if (!mediaFolder) return null;

  const mediaFiles = (folderMap.get(mediaFolder) ?? []).filter((f) => f.isMedia);
  const copyFiles = copyFolder
    ? (folderMap.get(copyFolder) ?? []).filter((f) => f.isText)
    : [];

  if (mediaFiles.length === 0) return null;

  // Sort both arrays by normalized name for matching
  mediaFiles.sort((a, b) => normalize(a.stem).localeCompare(normalize(b.stem)));
  copyFiles.sort((a, b) => normalize(a.stem).localeCompare(normalize(b.stem)));

  const posts: SmartPost[] = [];

  for (let i = 0; i < mediaFiles.length; i++) {
    const img = mediaFiles[i];

    // Try to match by name first
    let matchedCopy = copyFiles.find(
      (c) => normalize(c.stem) === normalize(img.stem)
    );

    // Fall back to matching by order
    if (!matchedCopy && i < copyFiles.length) {
      matchedCopy = copyFiles[i];
    }

    const confidence = matchedCopy
      ? normalize(matchedCopy.stem) === normalize(img.stem)
        ? "high"
        : "medium"
      : "low";

    const matchReason = matchedCopy
      ? confidence === "high"
        ? `"${img.file.name}" + "${matchedCopy.file.name}" (mismo nombre)`
        : `"${img.file.name}" + "${matchedCopy.file.name}" (por orden)`
      : `"${img.file.name}" (sin texto)`;

    posts.push({
      id: nextId(),
      images: [img],
      caption: "",
      captionSource: matchedCopy ? "matched" : "none",
      detectedDate: extractDate(img.stem) ?? extractDate(img.file.name),
      confidence,
      matchReason,
      status: matchedCopy ? (confidence === "high" ? "ready" : "needs-review") : "needs-caption",
    });
  }

  return posts;
}

// ─── Strategy: name-based matching (post1.jpg + post1.txt) ──────

function tryNameMatching(files: DroppedFile[]): SmartPost[] | null {
  const media = files.filter((f) => f.isMedia);
  const texts = files.filter((f) => f.isText);

  if (media.length === 0 || texts.length === 0) return null;

  // Build a map of stem → text files
  const textByStem = new Map<string, DroppedFile>();
  for (const t of texts) {
    textByStem.set(normalize(t.stem), t);
  }

  let matchCount = 0;
  const posts: SmartPost[] = [];
  const usedTexts = new Set<string>();

  for (const img of media) {
    const key = normalize(img.stem);
    const matchedText = textByStem.get(key);

    if (matchedText) {
      matchCount++;
      usedTexts.add(key);
      posts.push({
        id: nextId(),
        images: [img],
        caption: "",
        captionSource: "matched",
        detectedDate: extractDate(img.stem),
        confidence: "high",
        matchReason: `"${img.file.name}" + "${matchedText.file.name}"`,
        status: "ready",
      });
    } else {
      posts.push({
        id: nextId(),
        images: [img],
        caption: "",
        captionSource: "none",
        detectedDate: extractDate(img.stem),
        confidence: "low",
        matchReason: `"${img.file.name}" (sin texto asociado)`,
        status: "needs-caption",
      });
    }
  }

  // Need at least some matches to use this strategy
  if (matchCount < 2 && matchCount < media.length * 0.3) return null;
  return posts;
}

// ─── Strategy: each folder = one post ───────────────────────────

function tryFolderPosts(
  folderMap: Map<string, DroppedFile[]>
): SmartPost[] | null {
  if (folderMap.size < 2) return null;

  const posts: SmartPost[] = [];

  for (const [folder, files] of folderMap) {
    const media = files.filter((f) => f.isMedia);
    const texts = files.filter((f) => f.isText);
    if (media.length === 0) continue;

    const captionFile = texts.find(
      (f) => f.file.name.toLowerCase() === "caption.txt"
    ) ?? texts[0];

    posts.push({
      id: nextId(),
      images: media,
      caption: "",
      captionSource: captionFile ? "file" : "none",
      detectedDate: extractDate(folder),
      confidence: captionFile ? "high" : "medium",
      matchReason: `Carpeta "${folder}"`,
      status: captionFile ? "ready" : "needs-caption",
    });
  }

  return posts.length > 0 ? posts : null;
}

// ─── Strategy: loose files (each image = one post) ──────────────

function looseFilesPosts(files: DroppedFile[]): SmartPost[] {
  const media = files.filter((f) => f.isMedia);
  return media.map((img) => ({
    id: nextId(),
    images: [img],
    caption: "",
    captionSource: "none" as const,
    detectedDate: extractDate(img.stem),
    confidence: "medium" as const,
    matchReason: img.file.name,
    status: "needs-caption" as const,
  }));
}

// ─── Main analyzer ──────────────────────────────────────────────

export async function analyzeFiles(rawFiles: File[]): Promise<AnalysisResult> {
  idCounter = 0;

  // 1. Classify all files
  const classified: DroppedFile[] = [];
  for (const file of rawFiles) {
    // Use webkitRelativePath if available (folder drop), else just name
    const path =
      (file as any).webkitRelativePath || file.name;
    const df = classifyFile(file, path);
    if (df) classified.push(df);
  }

  if (classified.length === 0) {
    return {
      posts: [],
      unmatchedTexts: [],
      strategy: "empty",
      summary: "No se encontraron fotos ni videos.",
    };
  }

  // 2. Group by top-level folder
  const folderMap = new Map<string, DroppedFile[]>();
  const rootFiles: DroppedFile[] = [];

  for (const df of classified) {
    const parts = df.relativePath.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const topFolder = parts[0];
      if (isIgnored(topFolder)) continue;
      if (!folderMap.has(topFolder)) folderMap.set(topFolder, []);
      folderMap.get(topFolder)!.push(df);
    } else {
      rootFiles.push(df);
    }
  }

  // 3. Try strategies in order of intelligence
  let posts: SmartPost[] | null = null;
  let strategy = "";

  // Strategy 1: Structured date folders
  if (!posts && folderMap.size > 0) {
    posts = tryStructuredFolders(folderMap);
    if (posts) strategy = "structured";
  }

  // Strategy 2: Separate media/copy folders
  if (!posts && folderMap.size >= 2) {
    posts = trySeparateFolders(folderMap);
    if (posts) strategy = "separate-folders";
  }

  // Strategy 3: Name-based matching on root files
  if (!posts && rootFiles.length > 0) {
    posts = tryNameMatching(rootFiles);
    if (posts) strategy = "name-match";
  }

  // Strategy 4: Each folder = one post
  if (!posts && folderMap.size > 0) {
    posts = tryFolderPosts(folderMap);
    if (posts) strategy = "folder-posts";
  }

  // Strategy 5: Loose files — each image = one post
  if (!posts) {
    const allFiles = [...rootFiles];
    for (const files of folderMap.values()) allFiles.push(...files);
    posts = looseFilesPosts(allFiles);
    strategy = "loose";
  }

  // 4. Read caption text content for matched posts
  for (const post of posts) {
    if (post.captionSource === "file" || post.captionSource === "matched") {
      // Find the text file associated
      const allTexts = classified.filter((f) => f.isText);

      let textFile: DroppedFile | undefined;
      if (post.captionSource === "file") {
        // Caption.txt in same folder
        const postFolder = post.images[0]?.relativePath.split("/")[0];
        textFile = allTexts.find((t) => {
          const folder = t.relativePath.split("/")[0];
          return folder === postFolder;
        });
      } else {
        // Name-matched
        const imgStem = normalize(post.images[0]?.stem ?? "");
        textFile = allTexts.find((t) => normalize(t.stem) === imgStem);
      }

      if (textFile) {
        const content = await readTextFile(textFile.file);
        post.caption = content;
        if (content.length > 0) {
          post.status = post.confidence === "high" ? "ready" : "needs-review";
        }
      }
    }
  }

  // 5. Collect unmatched texts
  const usedTextStems = new Set(
    posts
      .filter((p) => p.captionSource !== "none")
      .flatMap((p) => p.images.map((i) => normalize(i.stem)))
  );
  const unmatchedTexts = classified.filter(
    (f) => f.isText && !usedTextStems.has(normalize(f.stem))
  );

  // 6. Build summary
  const readyCount = posts.filter((p) => p.status === "ready").length;
  const needsCaptionCount = posts.filter((p) => p.status === "needs-caption").length;
  const needsReviewCount = posts.filter((p) => p.status === "needs-review").length;

  const summaryParts: string[] = [`${posts.length} posts detectados`];
  if (readyCount > 0) summaryParts.push(`${readyCount} listos`);
  if (needsCaptionCount > 0)
    summaryParts.push(`${needsCaptionCount} sin texto`);
  if (needsReviewCount > 0)
    summaryParts.push(`${needsReviewCount} para revisar`);

  const strategyLabels: Record<string, string> = {
    structured: "Carpetas con fecha detectadas",
    "separate-folders": "Carpetas de creativos y textos emparejadas",
    "name-match": "Archivos emparejados por nombre",
    "folder-posts": "Cada carpeta = un post",
    loose: "Cada imagen = un post",
    empty: "Sin archivos",
  };

  return {
    posts,
    unmatchedTexts,
    strategy,
    summary: `${strategyLabels[strategy] ?? strategy}. ${summaryParts.join(" · ")}`,
  };
}

// ─── Re-package into ZIP for backend ────────────────────────────

export async function packagePostsToZip(
  posts: SmartPost[],
  schedule: {
    startDate: string;
    startTime: string;
    days: boolean[];
    spacing: "daily" | "every2" | "every3" | "weekdays" | "custom";
    customHours?: number;
  }
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // Compute publish dates
  const publishDates = computePublishDates(posts.length, schedule);

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const folderName =
      post.detectedDate
        ? formatFolderDate(post.detectedDate) + "_post-" + (i + 1)
        : formatFolderDate(publishDates[i]) + "_post-" + (i + 1);

    // Add media files
    for (const img of post.images) {
      const buf = await img.file.arrayBuffer();
      zip.file(`${folderName}/${img.file.name}`, buf);
    }

    // Add caption
    if (post.caption.trim()) {
      zip.file(`${folderName}/caption.txt`, post.caption);
    }

    // Add meta.json
    const type =
      post.images.length === 1
        ? VIDEO_EXTS.has(post.images[0].ext)
          ? "reel"
          : "image"
        : "carousel";

    const publishDate = post.detectedDate ?? publishDates[i];
    const meta = {
      type,
      publish_at: publishDate.toISOString(),
    };
    zip.file(`${folderName}/meta.json`, JSON.stringify(meta, null, 2));
  }

  return zip.generateAsync({ type: "blob" });
}

function formatFolderDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function computePublishDates(
  count: number,
  schedule: {
    startDate: string;
    startTime: string;
    days: boolean[];
    spacing: "daily" | "every2" | "every3" | "weekdays" | "custom";
    customHours?: number;
  }
): Date[] {
  const [y, m, d] = schedule.startDate.split("-").map(Number);
  const [h, min] = schedule.startTime.split(":").map(Number);

  let current = new Date(y, m - 1, d, h || 10, min || 0, 0);
  const dates: Date[] = [];

  // If using day-of-week selection
  const useDays = schedule.days.some(Boolean);

  for (let i = 0; i < count; ) {
    // Check if this day is allowed
    const dow = current.getDay(); // 0=Sun, 1=Mon, ...
    const dayAllowed = !useDays || schedule.days[dow];

    if (dayAllowed) {
      dates.push(new Date(current));
      i++;
    }

    // Advance to next candidate
    switch (schedule.spacing) {
      case "daily":
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "every2":
        current = new Date(current.getTime() + 2 * 24 * 60 * 60 * 1000);
        break;
      case "every3":
        current = new Date(current.getTime() + 3 * 24 * 60 * 60 * 1000);
        break;
      case "weekdays":
        // Move to next weekday
        do {
          current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        } while (current.getDay() === 0 || current.getDay() === 6);
        break;
      case "custom":
        current = new Date(
          current.getTime() + (schedule.customHours ?? 24) * 60 * 60 * 1000
        );
        break;
    }
  }

  return dates;
}
