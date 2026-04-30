/**
 * Tipos compartidos para los adapters de publicación por plataforma.
 *
 * Cada plataforma (TikTok, LinkedIn, YouTube, Pinterest) implementa
 * la interface `PlatformAdapter` y devuelve `PublishResult`.
 *
 * El worker llama a `dispatchPublish(payload)` que enruta al adapter
 * correspondiente vía la plataforma del SocialConnection.
 */
import type {
  MediaAsset,
  PostDraft,
  SocialConnection,
  SocialPlatform,
} from "@prisma/client";

/**
 * Lo que el worker pasa al adapter:
 *  - draft: PostDraft completo (caption, postType, etc.)
 *  - assets: MediaAsset[] con URLs en R2 (firmadas o públicas)
 *  - accessToken: token decryptado, listo para usar (Bearer)
 *  - connection: SocialConnection metadata (externalUserId, scopes…)
 */
export interface PublishPayload {
  draft: PostDraft & { mediaAssets: MediaAsset[] };
  accessToken: string;
  connection: SocialConnection;
}

/**
 * Resultado exitoso del adapter.
 */
export interface PublishResult {
  /** ID del post en la plataforma destino */
  externalPostId: string;
  /** URL pública del post (si la plataforma la expone) */
  externalPermalink: string | null;
  /** Datos extra para guardar en SocialPublication.metadata si aplica */
  raw?: Record<string, unknown>;
}

/**
 * Errores tipados para distinguir "fallo recuperable" (retry)
 * de "fallo permanente" (no reintentar).
 */
export class PlatformPublishError extends Error {
  readonly platform: SocialPlatform;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly providerCode?: string;

  constructor(
    platform: SocialPlatform,
    message: string,
    opts: {
      retryable?: boolean;
      statusCode?: number;
      providerCode?: string;
    } = {},
  ) {
    super(message);
    this.name = "PlatformPublishError";
    this.platform = platform;
    this.retryable = opts.retryable ?? true;
    this.statusCode = opts.statusCode;
    this.providerCode = opts.providerCode;
  }
}

/**
 * Interface que cada adapter implementa.
 */
export interface PlatformAdapter {
  platform: SocialPlatform;
  publish(payload: PublishPayload): Promise<PublishResult>;
}

/**
 * Helper común — parsea respuesta de error de provider y crea
 * un PlatformPublishError tipado. Los adapters lo usan para
 * distinguir 4xx (no retry) de 5xx (retry).
 */
export function makePublishError(
  platform: SocialPlatform,
  res: Response,
  body: string,
  fallbackMessage: string,
): PlatformPublishError {
  const status = res.status;
  // Errores 4xx no se reintentan (excepto 429 rate limit)
  const retryable = status >= 500 || status === 429 || status === 408;

  let providerCode: string | undefined;
  let providerMessage = fallbackMessage;
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    if (typeof parsed.error === "string") {
      providerMessage = parsed.error;
    } else if (parsed.error && typeof parsed.error === "object") {
      const errObj = parsed.error as Record<string, unknown>;
      if (typeof errObj.message === "string") providerMessage = errObj.message;
      if (typeof errObj.code === "string" || typeof errObj.code === "number") {
        providerCode = String(errObj.code);
      }
    } else if (typeof parsed.message === "string") {
      providerMessage = parsed.message;
    }
  } catch {
    // body no es JSON, usamos el fallback
  }

  return new PlatformPublishError(
    platform,
    `${platform} ${status}: ${providerMessage}`,
    { retryable, statusCode: status, providerCode },
  );
}
