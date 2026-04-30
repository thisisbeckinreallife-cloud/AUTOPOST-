/**
 * YouTube adapter — sube un Short usando YouTube Data API v3.
 *
 * Endpoint: POST https://www.googleapis.com/upload/youtube/v3/videos
 *   - Resumable upload protocol (2-step):
 *     1. POST con metadata + header "X-Upload-Content-Length"
 *        → devuelve URL para PUT del binario
 *     2. PUT del video bytes a la URL devuelta
 *
 * Docs: https://developers.google.com/youtube/v3/guides/uploading_a_video
 *
 * Limitaciones:
 *   - Solo videos (YouTube no acepta image-only)
 *   - Si el postType es IMAGE/CAROUSEL, fallamos con error claro
 *   - Para que sea Short: aspect ratio 9:16, duración ≤60s, hashtag #shorts en description
 *   - Quota inicial: 10,000 unidades/día (cada upload cuesta 1600u → ~6 uploads/día)
 *   - Necesario solicitar aumento de quota desde el primer día
 */
import type { PlatformAdapter, PublishPayload, PublishResult } from "./types";
import { PlatformPublishError, makePublishError } from "./types";

const UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3/videos";

interface InitVideoResponse {
  id: string;
  snippet?: { title: string };
  status?: { uploadStatus: string };
}

async function fetchAssetBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new PlatformPublishError(
      "YOUTUBE",
      `Cannot fetch asset from storage: ${res.status}`,
      { retryable: res.status >= 500 },
    );
  }
  return res.arrayBuffer();
}

/**
 * Inicia upload resumable y devuelve la URL para subir bytes.
 */
async function initResumableUpload(
  accessToken: string,
  videoSize: number,
  metadata: {
    title: string;
    description: string;
    tags?: string[];
    categoryId?: string;
  },
  mimeType: string,
): Promise<string> {
  const url = `${UPLOAD_BASE}?uploadType=resumable&part=snippet,status`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(videoSize),
      "X-Upload-Content-Type": mimeType,
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title.slice(0, 100), // YouTube max title 100
        description: metadata.description.slice(0, 5000),
        tags: metadata.tags ?? [],
        categoryId: metadata.categoryId ?? "22", // 22 = People & Blogs
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
        embeddable: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw makePublishError(
      "YOUTUBE",
      res,
      body,
      "YouTube resumable init failed",
    );
  }

  const uploadUrl = res.headers.get("location");
  if (!uploadUrl) {
    throw new PlatformPublishError(
      "YOUTUBE",
      "YouTube no devolvió location header tras init upload",
      { retryable: false },
    );
  }
  return uploadUrl;
}

async function uploadVideoBytes(
  uploadUrl: string,
  videoBytes: ArrayBuffer,
  mimeType: string,
): Promise<InitVideoResponse> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(videoBytes.byteLength),
    },
    body: videoBytes,
  });

  if (!res.ok) {
    const body = await res.text();
    throw makePublishError("YOUTUBE", res, body, "YouTube video upload failed");
  }

  return res.json() as Promise<InitVideoResponse>;
}

/**
 * Garantiza que la description tenga el hashtag #Shorts para que
 * YouTube lo trate como Short (junto con aspect ratio 9:16 y ≤60s).
 */
function buildShortsDescription(caption: string): string {
  const hasShorts = /\B#shorts?\b/i.test(caption);
  if (hasShorts) return caption;
  // Si no, añadimos al final
  return caption.trimEnd() + "\n\n#Shorts";
}

export const youTubeAdapter: PlatformAdapter = {
  platform: "YOUTUBE",
  async publish({ draft, accessToken }: PublishPayload): Promise<PublishResult> {
    if (draft.postType !== "REEL") {
      throw new PlatformPublishError(
        "YOUTUBE",
        "YouTube Shorts solo acepta videos. Cambia el post a tipo REEL para publicar en YouTube.",
        { retryable: false },
      );
    }

    if (draft.mediaAssets.length === 0) {
      throw new PlatformPublishError(
        "YOUTUBE",
        "YouTube requiere un asset de video",
        { retryable: false },
      );
    }

    const asset = draft.mediaAssets[0];
    if (!asset.mimeType.startsWith("video/")) {
      throw new PlatformPublishError(
        "YOUTUBE",
        `YouTube requiere video; recibido ${asset.mimeType}`,
        { retryable: false },
      );
    }

    // Title = primera línea o primeros 100 chars del caption
    const firstLine = draft.caption.split("\n")[0].trim();
    const title = (firstLine.length > 0 ? firstLine : "Untitled video").slice(0, 100);
    const description = buildShortsDescription(draft.caption);

    // Init resumable upload
    const uploadUrl = await initResumableUpload(
      accessToken,
      asset.fileSize,
      { title, description },
      asset.mimeType,
    );

    // Fetch bytes from R2
    const videoBytes = await fetchAssetBytes(asset.storageUrl);

    // Upload bytes
    const result = await uploadVideoBytes(uploadUrl, videoBytes, asset.mimeType);

    return {
      externalPostId: result.id,
      externalPermalink: `https://youtube.com/shorts/${result.id}`,
    };
  },
};
