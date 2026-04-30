/**
 * Dispatcher central para los adapters de publicación.
 *
 * El worker llama a `dispatchPublish(platform, payload)` y este enruta
 * al adapter correspondiente. Si la plataforma no tiene adapter,
 * lanza error explícito.
 *
 * También exporta los adapters individualmente por si se necesitan
 * en tests o lógica específica.
 */
import type { SocialPlatform } from "@prisma/client";
import type { PlatformAdapter, PublishPayload, PublishResult } from "./types";
import { linkedInAdapter } from "./linkedin";
import { tikTokAdapter } from "./tiktok";
import { youTubeAdapter } from "./youtube";
import { pinterestAdapter } from "./pinterest";
import { PlatformPublishError } from "./types";

const adapters: Record<SocialPlatform, PlatformAdapter> = {
  TIKTOK: tikTokAdapter,
  LINKEDIN: linkedInAdapter,
  YOUTUBE: youTubeAdapter,
  PINTEREST: pinterestAdapter,
};

export function getPlatformAdapter(platform: SocialPlatform): PlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new PlatformPublishError(
      platform,
      `No adapter registered for platform ${platform}`,
      { retryable: false },
    );
  }
  return adapter;
}

export async function dispatchPublish(
  platform: SocialPlatform,
  payload: PublishPayload,
): Promise<PublishResult> {
  const adapter = getPlatformAdapter(platform);
  return adapter.publish(payload);
}

export {
  linkedInAdapter,
  tikTokAdapter,
  youTubeAdapter,
  pinterestAdapter,
};
export type { PlatformAdapter, PublishPayload, PublishResult } from "./types";
export { PlatformPublishError } from "./types";
