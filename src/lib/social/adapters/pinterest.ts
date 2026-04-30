/**
 * Pinterest adapter — crea un Pin (image) o Idea Pin (carousel/video).
 *
 * Endpoints:
 *   GET  /v5/user_account/                   — obtener default board
 *   POST /v5/pins                            — crear pin con image_url
 *
 * Docs: https://developers.pinterest.com/docs/api/v5/pins-create
 *
 * Limitaciones / decisiones:
 *   - Pinterest acepta imágenes públicas via URL (no upload bytes via API v5)
 *     Necesitamos que el storageUrl de los assets sea públicamente accesible.
 *     Si tu STORAGE_PUBLIC_URL apunta a R2 público, esto funciona out-of-the-box.
 *   - Para carruseles (multiple images): usamos `media_source.source_type = "multiple_image_urls"`.
 *   - Para video: `media_source.source_type = "video_id"` requiere upload previo a /v5/media.
 *     Por simplicidad inicial, posts tipo REEL en Pinterest se publican como imagen estática
 *     usando el primer frame (TODO fase 2: implementar /v5/media upload).
 *   - Necesitamos un board destino. Si el user no tiene boards, fallamos con mensaje claro.
 *
 * Permisos: scope `pins:write` + `boards:read` + `user_accounts:read`.
 */
import type { PlatformAdapter, PublishPayload, PublishResult } from "./types";
import { PlatformPublishError, makePublishError } from "./types";

const PINTEREST_BASE = "https://api.pinterest.com/v5";

interface BoardListResponse {
  items: { id: string; name: string }[];
}

interface PinResponse {
  id: string;
  url?: string; // Pinterest devuelve link directo
}

async function findDefaultBoard(accessToken: string): Promise<string> {
  const res = await fetch(`${PINTEREST_BASE}/boards?page_size=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw makePublishError("PINTEREST", res, body, "Could not list boards");
  }
  const data = (await res.json()) as BoardListResponse;
  if (!data.items || data.items.length === 0) {
    throw new PlatformPublishError(
      "PINTEREST",
      "El usuario no tiene boards en Pinterest. Crea al menos un board antes de publicar.",
      { retryable: false },
    );
  }
  return data.items[0].id;
}

export const pinterestAdapter: PlatformAdapter = {
  platform: "PINTEREST",
  async publish({ draft, accessToken }: PublishPayload): Promise<PublishResult> {
    if (draft.mediaAssets.length === 0) {
      throw new PlatformPublishError(
        "PINTEREST",
        "Pinterest requiere al menos un asset de media",
        { retryable: false },
      );
    }

    const boardId = await findDefaultBoard(accessToken);

    // Title = primera línea, description = resto del caption
    const lines = draft.caption.split("\n");
    const title = (lines[0] ?? "").trim().slice(0, 100) || "Untitled pin";
    const description = lines.slice(1).join("\n").trim().slice(0, 800);

    let mediaSource: Record<string, unknown>;
    if (draft.postType === "IMAGE" || draft.mediaAssets.length === 1) {
      // Pin único — image_url
      mediaSource = {
        source_type: "image_url",
        url: draft.mediaAssets[0].storageUrl,
      };
    } else if (draft.postType === "CAROUSEL") {
      // Carousel pin — multiple_image_urls
      mediaSource = {
        source_type: "multiple_image_urls",
        items: draft.mediaAssets.slice(0, 5).map((a) => ({
          url: a.storageUrl,
          title: title,
          description: description,
        })),
      };
    } else if (draft.postType === "REEL") {
      // Video pins requieren upload a /v5/media primero (fase 2).
      // Por ahora rechazamos con mensaje claro.
      throw new PlatformPublishError(
        "PINTEREST",
        "Pinterest video pins requieren upload previo a /v5/media (no implementado todavía). Usa una imagen.",
        { retryable: false },
      );
    } else {
      throw new PlatformPublishError(
        "PINTEREST",
        `Tipo de post no soportado en Pinterest: ${draft.postType}`,
        { retryable: false },
      );
    }

    const res = await fetch(`${PINTEREST_BASE}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: boardId,
        title,
        description,
        media_source: mediaSource,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw makePublishError("PINTEREST", res, body, "Pinterest pin creation failed");
    }

    const data = (await res.json()) as PinResponse;
    const permalink = data.url ?? `https://www.pinterest.com/pin/${data.id}/`;

    return {
      externalPostId: data.id,
      externalPermalink: permalink,
    };
  },
};
