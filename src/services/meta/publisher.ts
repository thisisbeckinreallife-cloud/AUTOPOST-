/**
 * High-level publish orchestrator.
 * Takes a PostDraft with MediaAssets and publishes to Instagram
 * using the correct flow for each post type.
 */
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { getSignedDownloadUrl } from "@/lib/storage";
import type { PostDraft, MediaAsset, MetaConnection } from "@prisma/client";
import {
  MetaApiError,
  createImageContainer,
  createCarouselContainer,
  createCarouselItemContainer,
  createReelContainer,
  getContainerStatus,
  publishContainer,
  getMediaPermalink,
  postFirstComment,
} from "./client";

// How long to wait for video processing (ms)
const VIDEO_POLL_INTERVAL_MS = 5000;
const VIDEO_POLL_MAX_ATTEMPTS = 60; // 5 min max

export interface PublishResult {
  mediaId: string;
  permalink?: string;
  containerId: string;
}

export async function publishPost(
  draft: PostDraft & { mediaAssets: MediaAsset[] },
  connection: MetaConnection
): Promise<PublishResult> {
  // Decrypt access token — never expose this to frontend
  const accessToken = decrypt({
    enc: connection.accessTokenEnc,
    iv: connection.accessTokenIv,
    tag: connection.accessTokenTag,
  });
  console.log(`[Publisher] Token decrypted, length=${accessToken.length}, starts=${accessToken.substring(0, 10)}...`);

  // Generate public/signed URLs for media (required by Meta — must be publicly accessible)
  const mediaWithUrls = await Promise.all(
    draft.mediaAssets
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(async (asset) => ({
        ...asset,
        signedUrl: await getSignedDownloadUrl(asset.storagePath, 3600),
      }))
  );

  console.log(`[Publisher] Post ${draft.id} type=${draft.postType} assets=${mediaWithUrls.length}`);
  for (const m of mediaWithUrls) {
    console.log(`[Publisher]   Asset: ${m.originalFilename} → ${m.signedUrl.substring(0, 100)}...`);
  }

  let containerId: string;

  switch (draft.postType) {
    case "IMAGE": {
      const asset = mediaWithUrls[0];
      if (!asset) throw new Error("No media asset for IMAGE post");
      containerId = await createImageContainer(
        connection.igUserId,
        asset.signedUrl,
        draft.caption,
        accessToken,
        draft.locationId ?? undefined
      );
      break;
    }

    case "CAROUSEL": {
      // 1. Create item containers
      const childIds: string[] = [];
      for (const asset of mediaWithUrls) {
        const mediaType = asset.mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";
        const childId = await createCarouselItemContainer(
          connection.igUserId,
          asset.signedUrl,
          mediaType,
          accessToken
        );
        // Videos in carousels also need processing time
        if (mediaType === "VIDEO") {
          await waitForVideoProcessing(childId, accessToken);
        }
        childIds.push(childId);
      }

      // 2. Create carousel parent
      containerId = await createCarouselContainer(
        connection.igUserId,
        childIds,
        draft.caption,
        accessToken,
        draft.locationId ?? undefined
      );
      break;
    }

    case "REEL": {
      const asset = mediaWithUrls[0];
      if (!asset) throw new Error("No media asset for REEL post");
      containerId = await createReelContainer(
        connection.igUserId,
        asset.signedUrl,
        draft.caption,
        accessToken,
        draft.locationId ?? undefined
      );

      // Wait for video processing
      await waitForVideoProcessing(containerId, accessToken);
      break;
    }

    default:
      throw new Error(`Unsupported post type: ${draft.postType}`);
  }

  // Publish the container
  const mediaId = await publishContainer(
    connection.igUserId,
    containerId,
    accessToken
  );

  // Get permalink
  const permalink = await getMediaPermalink(mediaId, accessToken);

  // Post first comment if set
  if (draft.firstComment?.trim()) {
    try {
      await postFirstComment(mediaId, draft.firstComment, accessToken);
    } catch (err) {
      // Non-fatal: log but don't fail the publish
      console.warn(
        `[Publisher] Failed to post first comment on ${mediaId}:`,
        err
      );
    }
  }

  return { mediaId, permalink, containerId };
}

async function waitForVideoProcessing(
  containerId: string,
  accessToken: string
): Promise<void> {
  for (let attempt = 0; attempt < VIDEO_POLL_MAX_ATTEMPTS; attempt++) {
    const status = await getContainerStatus(containerId, accessToken);

    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new MetaApiError(
        0,
        `Video processing failed: ${status.error_message ?? "unknown error"}`
      );
    }
    if (status.status_code === "EXPIRED") {
      throw new MetaApiError(0, "Media container expired before publishing");
    }

    await sleep(VIDEO_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Video processing timed out after ${
      (VIDEO_POLL_MAX_ATTEMPTS * VIDEO_POLL_INTERVAL_MS) / 1000
    }s`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
