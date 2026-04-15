/**
 * POST /api/batches/direct — process directly uploaded media files (not ZIP).
 * Files must already be uploaded to S3 via presigned URLs.
 * Creates an UploadBatch + PostDrafts from the provided metadata.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { downloadBuffer, checkStorageConfig } from "@/lib/storage";
import { hashSHA256 } from "@/lib/crypto";
import { createPostDraftFromParsed } from "@/services/scheduler/batch-processor";
import { validateParsedPost } from "@/services/validator/post-validator";
import { v4 as uuidv4 } from "uuid";
import type { ParsedPost, ParsedMediaFile } from "@/types";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface DirectPostInput {
  storageKeys: string[];
  filenames: string[];
  fileSizes: number[];
  mimeTypes: string[];
  caption: string;
  postType: "image" | "carousel" | "reel";
  publishAt: string;
  collaborators?: string[];
}

interface DirectUploadBody {
  businessSlug: string;
  batchId: string;
  posts: DirectPostInput[];
}

export async function POST(request: NextRequest) {
  try {
    const storageError = checkStorageConfig();
    if (storageError) {
      return NextResponse.json({ error: storageError }, { status: 503 });
    }

    const session = await requireSession();

    const body = (await request.json()) as DirectUploadBody;
    const { businessSlug, batchId, posts } = body;

    if (!businessSlug || !batchId || !posts || posts.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (businessSlug, batchId, posts)" },
        { status: 400 }
      );
    }

    if (posts.length > 10) {
      return NextResponse.json(
        { error: "Maximo 10 posts por subida directa" },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { slug: businessSlug, isActive: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found or inactive" },
        { status: 404 }
      );
    }

    // Download all media files and build ParsedPosts
    const parsedPosts: ParsedPost[] = [];
    const allErrors: Array<{ folder: string; field?: string; message: string; severity: string }> = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      if (post.storageKeys.length === 0 || post.storageKeys.length !== post.filenames.length) {
        allErrors.push({
          folder: `post-${i}`,
          message: "Datos de archivos inconsistentes",
          severity: "error",
        });
        continue;
      }

      try {
        const mediaFiles: ParsedMediaFile[] = [];

        for (let j = 0; j < post.storageKeys.length; j++) {
          const buffer = await downloadBuffer(post.storageKeys[j]);
          mediaFiles.push({
            filename: post.filenames[j],
            buffer,
            mimeType: post.mimeTypes[j],
            fileHash: hashSHA256(buffer),
          });
        }

        const folderName = `direct-${Date.now()}-${i}`;

        const parsedPost: ParsedPost = {
          folderName,
          metaJson: {
            publish_at: post.publishAt,
            type: post.postType,
            collaborators: post.collaborators,
          },
          caption: post.caption,
          mediaFiles,
        };

        parsedPosts.push(parsedPost);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        allErrors.push({
          folder: `post-${i}`,
          message: `Error descargando archivo: ${msg}`,
          severity: "error",
        });
      }
    }

    if (parsedPosts.length === 0) {
      return NextResponse.json(
        { error: "No se pudo procesar ningun post", details: allErrors },
        { status: 400 }
      );
    }

    // Compute a batch-level hash from all file hashes
    const allHashes = parsedPosts
      .flatMap((p) => p.mediaFiles.map((f) => f.fileHash))
      .sort()
      .join("|");
    const batchFileHash = hashSHA256(Buffer.from(allHashes));

    // Create batch record
    const batch = await db.$transaction(async (tx) => {
      const b = await tx.uploadBatch.create({
        data: {
          id: batchId,
          businessId: business.id,
          originalFilename: `direct-upload-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}`,
          storagePath: `direct/${business.slug}/${batchId}`,
          fileSize: parsedPosts.reduce(
            (sum, p) => sum + p.mediaFiles.reduce((s, f) => s + f.buffer.length, 0),
            0
          ),
          fileHash: batchFileHash,
          status: "PARSING",
          uploadedByIp:
            request.headers.get("x-forwarded-for") ??
            request.headers.get("x-real-ip") ??
            null,
        },
      });
      await tx.auditLog.create({
        data: {
          businessId: business.id,
          adminUserId: session.adminUserId,
          action: "BATCH_UPLOADED",
          entityType: "UploadBatch",
          entityId: b.id,
          detail: {
            type: "direct_upload",
            postCount: parsedPosts.length,
          },
        },
      });
      return b;
    });

    // Validate and create drafts
    let validPosts = 0;
    let failedPosts = 0;

    for (const parsedPost of parsedPosts) {
      try {
        const validationResult = await validateParsedPost(parsedPost, business.id);

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

        await createPostDraftFromParsed(
          parsedPost,
          batch.id,
          business.id,
          business.slug
        );
        validPosts++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        allErrors.push({
          folder: parsedPost.folderName,
          message: `Error creando post: ${msg}`,
          severity: "error",
        });
        failedPosts++;
      }
    }

    const finalStatus =
      validPosts === 0 ? "VALIDATION_FAILED" : "PARSED";

    await db.uploadBatch.update({
      where: { id: batch.id },
      data: {
        status: finalStatus,
        parsedAt: new Date(),
        parseErrors: allErrors as unknown as Prisma.InputJsonValue,
        totalPosts: parsedPosts.length,
        validPosts,
        failedPosts,
      },
    });

    return NextResponse.json(
      { data: { batchId: batch.id, status: finalStatus } },
      { status: 202 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[BatchesDirect] POST error:", msg, err);
    return NextResponse.json(
      { error: `Error procesando subida directa: ${msg}` },
      { status: 500 }
    );
  }
}
