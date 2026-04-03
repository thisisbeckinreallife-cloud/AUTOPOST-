/**
 * S3-compatible storage client.
 * Works with AWS S3, MinIO, Cloudflare R2, etc.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

function getS3Client(): S3Client {
  const endpoint = process.env.STORAGE_ENDPOINT;
  // R2 requires lowercase "auto" as region
  const rawRegion = process.env.STORAGE_REGION ?? "auto";
  const region = rawRegion.toLowerCase();
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
    },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });
}

const BUCKET = () => {
  const b = process.env.STORAGE_BUCKET;
  if (!b) throw new Error("STORAGE_BUCKET is not set");
  return b;
};

/**
 * Check if storage is properly configured.
 * Returns null if OK, or an error message describing what's missing.
 */
export function checkStorageConfig(): string | null {
  const missing: string[] = [];
  if (!process.env.STORAGE_BUCKET) missing.push("STORAGE_BUCKET");
  if (!process.env.STORAGE_ACCESS_KEY_ID) missing.push("STORAGE_ACCESS_KEY_ID");
  if (!process.env.STORAGE_SECRET_ACCESS_KEY) missing.push("STORAGE_SECRET_ACCESS_KEY");

  if (missing.length === 0) return null;

  return `Almacenamiento no configurado. Faltan variables de entorno: ${missing.join(", ")}. Configuralas en Railway → Variables.`;
}

export async function uploadFile(
  key: string,
  body: Buffer | Readable,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  const upload = new Upload({
    client,
    params: {
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });
  await upload.done();
  return key;
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

export async function getSignedUploadUrl(
  key: string,
  _contentType: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = getS3Client();
  // Don't include ContentType in the signature — allows any content type from client
  const command = new PutObjectCommand({
    Bucket: BUCKET(),
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  // For R2 with public URL configured, use that directly (more reliable for Meta API)
  const publicUrl = process.env.STORAGE_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  }
  // Fallback to signed URL
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export function getPublicUrl(key: string): string {
  const base = process.env.STORAGE_PUBLIC_URL ?? "";
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function downloadBuffer(key: string): Promise<Buffer> {
  const client = getS3Client();
  const result = await client.send(
    new GetObjectCommand({ Bucket: BUCKET(), Key: key })
  );
  const stream = result.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}

export async function fileExists(key: string): Promise<boolean> {
  const client = getS3Client();
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET(), Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a safe storage key for a batch ZIP.
 * Format: batches/{businessSlug}/{batchId}/{filename}
 */
export function batchStorageKey(
  businessSlug: string,
  batchId: string,
  filename: string
): string {
  const safe = sanitizeFilename(filename);
  return `batches/${businessSlug}/${batchId}/${safe}`;
}

/**
 * Generate a safe storage key for a media asset.
 * Format: assets/{businessSlug}/{batchId}/{postFolder}/{filename}
 */
export function assetStorageKey(
  businessSlug: string,
  batchId: string,
  postFolder: string,
  filename: string
): string {
  const safeFolder = sanitizePath(postFolder);
  const safeFile = sanitizeFilename(filename);
  return `assets/${businessSlug}/${batchId}/${safeFolder}/${safeFile}`;
}

/** Strip path traversal and dangerous characters from filenames. */
function sanitizeFilename(name: string): string {
  return name
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._\-]/g, "_")
    .replace(/^[._]+/, "");
}

function sanitizePath(path: string): string {
  return path
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._\-/]/g, "_");
}
