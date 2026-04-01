export type {
  Business,
  MetaConnection,
  UploadBatch,
  PostDraft,
  MediaAsset,
  PublishJob,
  PublishAttempt,
  AuditLog,
  AdminUser,
  MetaConnectionStatus,
  BatchStatus,
  PostDraftStatus,
  PostType,
  JobStatus,
} from "@prisma/client";

// ─────────────────────────────────────────
// ZIP / PARSER TYPES
// ─────────────────────────────────────────

export interface MetaJson {
  publish_at: string;       // ISO 8601 with timezone
  type: "image" | "carousel" | "reel";
  business_slug: string;
  first_comment?: string;
  location_id?: string;
}

export interface ParsedPost {
  folderName: string;
  metaJson: MetaJson;
  caption: string;
  mediaFiles: ParsedMediaFile[];
}

export interface ParsedMediaFile {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  fileHash: string;
}

export interface ParseError {
  folder: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
}

export interface ParseResult {
  posts: ParsedPost[];
  errors: ParseError[];
  warnings: ParseError[];
}

// ─────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ─────────────────────────────────────────
// META API
// ─────────────────────────────────────────

export interface MetaTokens {
  accessToken: string;
  pageToken?: string;
}

export interface MetaContainerResult {
  containerId: string;
}

export interface MetaPublishResult {
  mediaId: string;
  permalink?: string;
}

export interface MetaApiError {
  code: number;
  message: string;
  type?: string;
  fbtrace_id?: string;
}

// ─────────────────────────────────────────
// JOB PAYLOAD (BullMQ)
// ─────────────────────────────────────────

export interface PublishJobPayload {
  postDraftId: string;
  publishJobId: string;
  businessId: string;
  attempt: number;
}

// ─────────────────────────────────────────
// API RESPONSE HELPERS
// ─────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────
// UI / FRONTEND SAFE TYPES
// (stripped of tokens and sensitive fields)
// ─────────────────────────────────────────

export interface BusinessSafe {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metaConnection?: MetaConnectionSafe | null;
}

export interface MetaConnectionSafe {
  id: string;
  igUserId: string;
  igUsername: string;
  fbPageId: string | null;
  fbPageName: string | null;
  status: string;
  tokenExpiresAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  // No tokens
}
