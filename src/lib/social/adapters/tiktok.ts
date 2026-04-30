/**
 * TikTok adapter — publica un video usando Content Posting API.
 *
 * Endpoints:
 *   POST /v2/post/publish/video/init/   — registra el upload + obtiene URL firmada
 *   PUT {upload_url}                    — sube los bytes del video
 *   GET /v2/post/publish/status/fetch/  — polling hasta que el video se procesa
 *
 * Docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 *
 * Limitaciones:
 *   - Solo videos (TikTok no soporta image-only en el feed principal vía API)
 *   - Si el postType es IMAGE/CAROUSEL, fallamos con error claro
 *   - El caption va en el campo `title` (TikTok no tiene caption separado del título)
 *   - Tamaño max: 287MB para Direct Post; chunked si >64MB
 *
 * App review necesario: "Content Posting API" + uso del scope `video.publish`.
 */
import type { PlatformAdapter, PublishPayload, PublishResult } from "./types";
import { PlatformPublishError, makePublishError } from "./types";

const TIKTOK_BASE = "https://open.tiktokapis.com";
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

interface InitResponse {
  data: {
    publish_id: string;
    upload_url: string;
  };
  error?: { code: string; message: string };
}

interface StatusResponse {
  data: {
    status:
      | "PROCESSING_UPLOAD"
      | "PROCESSING_DOWNLOAD"
      | "SEND_TO_USER_INBOX"
      | "PUBLISH_COMPLETE"
      | "FAILED";
    publicaly_available_post_id?: string[];
    fail_reason?: string;
  };
  error?: { code: string; message: string };
}

async function initVideoUpload(
  accessToken: string,
  videoSize: number,
  caption: string,
): Promise<InitResponse> {
  const totalChunks = Math.ceil(videoSize / CHUNK_SIZE);
  const lastChunkSize =
    videoSize - (totalChunks - 1) * CHUNK_SIZE;

  const res = await fetch(`${TIKTOK_BASE}/v2/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: caption.slice(0, 2200), // TikTok max title 2200 chars
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: totalChunks > 1 ? CHUNK_SIZE : videoSize,
        total_chunk_count: totalChunks,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw makePublishError("TIKTOK", res, body, "TikTok init upload failed");
  }
  return res.json() as Promise<InitResponse>;
}

async function uploadVideoBytes(
  uploadUrl: string,
  videoBytes: ArrayBuffer,
  videoSize: number,
): Promise<void> {
  const totalChunks = Math.ceil(videoSize / CHUNK_SIZE);

  if (totalChunks === 1) {
    // Single PUT
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
        "Content-Type": "video/mp4",
      },
      body: videoBytes,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new PlatformPublishError(
        "TIKTOK",
        `Video upload to TikTok CDN failed: ${res.status} ${body.slice(0, 120)}`,
        { retryable: res.status >= 500, statusCode: res.status },
      );
    }
    return;
  }

  // Chunked
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, videoSize);
    const chunk = videoBytes.slice(start, end);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${start}-${end - 1}/${videoSize}`,
        "Content-Type": "video/mp4",
      },
      body: chunk,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new PlatformPublishError(
        "TIKTOK",
        `Chunk ${i + 1}/${totalChunks} upload failed: ${res.status} ${body.slice(0, 120)}`,
        { retryable: res.status >= 500, statusCode: res.status },
      );
    }
  }
}

async function pollStatus(
  accessToken: string,
  publishId: string,
  maxWaitMs = 5 * 60 * 1000,
): Promise<{ postId: string }> {
  const start = Date.now();
  const pollInterval = 5000;

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${TIKTOK_BASE}/v2/post/publish/status/fetch/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw makePublishError("TIKTOK", res, body, "TikTok status fetch failed");
    }

    const data = (await res.json()) as StatusResponse;
    const status = data.data.status;

    if (status === "PUBLISH_COMPLETE") {
      const postId = data.data.publicaly_available_post_id?.[0];
      if (!postId) {
        throw new PlatformPublishError(
          "TIKTOK",
          "Status COMPLETE but no post ID returned",
          { retryable: false },
        );
      }
      return { postId };
    }

    if (status === "FAILED") {
      throw new PlatformPublishError(
        "TIKTOK",
        `TikTok publish failed: ${data.data.fail_reason ?? "unknown reason"}`,
        { retryable: false },
      );
    }

    if (status === "SEND_TO_USER_INBOX") {
      // Modo "draft" — el post quedó en el inbox del usuario, debe finalizarlo manualmente.
      // En Direct Post mode esto no debería pasar, pero por si acaso.
      throw new PlatformPublishError(
        "TIKTOK",
        "TikTok devolvió SEND_TO_USER_INBOX (la app no está aprobada para Direct Post)",
        { retryable: false },
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new PlatformPublishError(
    "TIKTOK",
    `TikTok publish timeout after ${maxWaitMs}ms`,
    { retryable: true },
  );
}

async function fetchAssetBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new PlatformPublishError(
      "TIKTOK",
      `Cannot fetch asset from storage: ${res.status}`,
      { retryable: res.status >= 500 },
    );
  }
  return res.arrayBuffer();
}

export const tikTokAdapter: PlatformAdapter = {
  platform: "TIKTOK",
  async publish({ draft, accessToken }: PublishPayload): Promise<PublishResult> {
    if (draft.postType !== "REEL") {
      throw new PlatformPublishError(
        "TIKTOK",
        "TikTok solo acepta videos. Cambia el post a tipo REEL para publicar en TikTok.",
        { retryable: false },
      );
    }

    if (draft.mediaAssets.length === 0) {
      throw new PlatformPublishError(
        "TIKTOK",
        "TikTok requiere un asset de video",
        { retryable: false },
      );
    }

    const asset = draft.mediaAssets[0];
    if (!asset.mimeType.startsWith("video/")) {
      throw new PlatformPublishError(
        "TIKTOK",
        `TikTok requiere video; recibido ${asset.mimeType}`,
        { retryable: false },
      );
    }

    // 1. Init upload
    const initData = await initVideoUpload(
      accessToken,
      asset.fileSize,
      draft.caption,
    );

    if (!initData.data?.publish_id || !initData.data?.upload_url) {
      throw new PlatformPublishError(
        "TIKTOK",
        `Init response missing fields: ${JSON.stringify(initData.error ?? initData)}`,
        { retryable: false },
      );
    }

    // 2. Fetch + upload bytes
    const videoBytes = await fetchAssetBytes(asset.storageUrl);
    await uploadVideoBytes(initData.data.upload_url, videoBytes, asset.fileSize);

    // 3. Poll status
    const { postId } = await pollStatus(accessToken, initData.data.publish_id);

    return {
      externalPostId: postId,
      externalPermalink: null, // TikTok no expone permalink directo desde API
    };
  },
};
