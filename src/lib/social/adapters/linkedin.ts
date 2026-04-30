/**
 * LinkedIn adapter — publica un post en el perfil personal del usuario
 * o en una página de empresa que ha autorizado.
 *
 * Endpoint: POST https://api.linkedin.com/rest/posts
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
 *
 * Flujo:
 *  1. Si hay imágenes → registerUpload + PUT al uploadUrl + crear post con asset
 *  2. Si hay video → registerUpload (multi-part) + PUT chunks + crear post
 *  3. Sin media → crear post tipo TEXT
 *
 * El externalUserId del SocialConnection ya es el "Person URN" (urn:li:person:xxx).
 *
 * Limitaciones conocidas:
 *  - Posts a páginas de empresa requieren scope w_organization_social (no w_member_social)
 *  - Por ahora solo perfiles personales
 *  - Carruseles nativos requieren scope adicional + UGC API (más complejo, fase 2)
 */
import type { PlatformAdapter, PublishPayload, PublishResult } from "./types";
import { PlatformPublishError, makePublishError } from "./types";

const LINKEDIN_API_VERSION = "202404";
const REST_BASE = "https://api.linkedin.com/rest";

interface UploadInitResponse {
  value: {
    uploadUrl: string;
    image?: string; // urn:li:image:xxx
    video?: string; // urn:li:video:xxx
  };
}

async function initImageUpload(
  accessToken: string,
  ownerUrn: string,
): Promise<UploadInitResponse> {
  const res = await fetch(`${REST_BASE}/images?action=initializeUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      initializeUploadRequest: { owner: ownerUrn },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw makePublishError("LINKEDIN", res, body, "Image upload init failed");
  }
  return res.json() as Promise<UploadInitResponse>;
}

async function uploadImageBytes(
  uploadUrl: string,
  imageBytes: ArrayBuffer,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: imageBytes,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new PlatformPublishError(
      "LINKEDIN",
      `Image upload to LinkedIn CDN failed: ${res.status} ${body.slice(0, 120)}`,
      { retryable: res.status >= 500, statusCode: res.status },
    );
  }
}

async function fetchAssetBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new PlatformPublishError(
      "LINKEDIN",
      `Cannot fetch asset from storage: ${res.status}`,
      { retryable: res.status >= 500 },
    );
  }
  return res.arrayBuffer();
}

async function createPost(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ id: string }> {
  const res = await fetch(`${REST_BASE}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw makePublishError(
      "LINKEDIN",
      res,
      errBody,
      "LinkedIn post creation failed",
    );
  }

  // LinkedIn devuelve el post URN en el header `x-restli-id`
  const postUrn = res.headers.get("x-restli-id");
  if (!postUrn) {
    throw new PlatformPublishError(
      "LINKEDIN",
      "LinkedIn no devolvió x-restli-id header",
      { retryable: false },
    );
  }
  return { id: postUrn };
}

export const linkedInAdapter: PlatformAdapter = {
  platform: "LINKEDIN",
  async publish({ draft, accessToken, connection }: PublishPayload): Promise<PublishResult> {
    const ownerUrn = `urn:li:person:${connection.externalUserId}`;

    // Imagen única
    if (draft.postType === "IMAGE" && draft.mediaAssets.length > 0) {
      const asset = draft.mediaAssets[0];
      const initResp = await initImageUpload(accessToken, ownerUrn);
      const imageBytes = await fetchAssetBytes(asset.storageUrl);
      await uploadImageBytes(initResp.value.uploadUrl, imageBytes);

      const { id: postUrn } = await createPost(accessToken, {
        author: ownerUrn,
        commentary: draft.caption,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            id: initResp.value.image,
          },
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      });

      const numericId = postUrn.split(":").pop();
      return {
        externalPostId: postUrn,
        externalPermalink: numericId
          ? `https://www.linkedin.com/feed/update/${postUrn}/`
          : null,
      };
    }

    // Carrusel — LinkedIn no soporta carrusel nativo via REST API
    // Fallback: publicamos como texto + primera imagen y advertimos.
    if (draft.postType === "CAROUSEL" && draft.mediaAssets.length > 0) {
      // TODO fase 2: usar UGC API + Documents para carruseles nativos.
      const asset = draft.mediaAssets[0];
      const initResp = await initImageUpload(accessToken, ownerUrn);
      const imageBytes = await fetchAssetBytes(asset.storageUrl);
      await uploadImageBytes(initResp.value.uploadUrl, imageBytes);

      const captionWithNote =
        draft.caption +
        (draft.mediaAssets.length > 1
          ? `\n\n— LinkedIn solo soporta una imagen por post; ${draft.mediaAssets.length - 1} más en el carrusel original.`
          : "");

      const { id: postUrn } = await createPost(accessToken, {
        author: ownerUrn,
        commentary: captionWithNote,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: { media: { id: initResp.value.image } },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      });

      return {
        externalPostId: postUrn,
        externalPermalink: `https://www.linkedin.com/feed/update/${postUrn}/`,
      };
    }

    // Video / Reel
    if (draft.postType === "REEL" && draft.mediaAssets.length > 0) {
      const asset = draft.mediaAssets[0];

      // Init video upload (single-part for <200MB)
      const initRes = await fetch(`${REST_BASE}/videos?action=initializeUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": LINKEDIN_API_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: ownerUrn,
            fileSizeBytes: asset.fileSize,
            uploadCaptions: false,
            uploadThumbnail: false,
          },
        }),
      });

      if (!initRes.ok) {
        const body = await initRes.text();
        throw makePublishError(
          "LINKEDIN",
          initRes,
          body,
          "Video upload init failed",
        );
      }

      const initData = (await initRes.json()) as {
        value: {
          video: string;
          uploadInstructions: { uploadUrl: string; firstByte: number; lastByte: number }[];
          uploadToken: string;
        };
      };

      // Subir el video chunk por chunk (LinkedIn devuelve uploadInstructions)
      const videoBytes = await fetchAssetBytes(asset.storageUrl);
      const uploadedEtags: string[] = [];

      for (const instruction of initData.value.uploadInstructions) {
        const chunk = videoBytes.slice(instruction.firstByte, instruction.lastByte + 1);
        const upRes = await fetch(instruction.uploadUrl, {
          method: "PUT",
          body: chunk,
        });
        if (!upRes.ok) {
          const errBody = await upRes.text();
          throw new PlatformPublishError(
            "LINKEDIN",
            `Video chunk upload failed: ${upRes.status} ${errBody.slice(0, 120)}`,
            { retryable: upRes.status >= 500, statusCode: upRes.status },
          );
        }
        const etag = upRes.headers.get("etag");
        if (etag) uploadedEtags.push(etag);
      }

      // Finalizar upload
      const finalizeRes = await fetch(
        `${REST_BASE}/videos?action=finalizeUpload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "LinkedIn-Version": LINKEDIN_API_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            finalizeUploadRequest: {
              video: initData.value.video,
              uploadToken: initData.value.uploadToken,
              uploadedPartIds: uploadedEtags,
            },
          }),
        },
      );

      if (!finalizeRes.ok) {
        const body = await finalizeRes.text();
        throw makePublishError("LINKEDIN", finalizeRes, body, "Video finalize failed");
      }

      // Crear post con video URN
      const { id: postUrn } = await createPost(accessToken, {
        author: ownerUrn,
        commentary: draft.caption,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: { media: { id: initData.value.video } },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      });

      return {
        externalPostId: postUrn,
        externalPermalink: `https://www.linkedin.com/feed/update/${postUrn}/`,
      };
    }

    // Sin media — solo texto
    const { id: postUrn } = await createPost(accessToken, {
      author: ownerUrn,
      commentary: draft.caption,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    });

    return {
      externalPostId: postUrn,
      externalPermalink: `https://www.linkedin.com/feed/update/${postUrn}/`,
    };
  },
};
