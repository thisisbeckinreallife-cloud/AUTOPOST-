/**
 * Meta Graph API client — decoupled, typed, error-mapped.
 *
 * All calls use the official Instagram Graph API v21.0.
 * https://developers.facebook.com/docs/instagram-api
 *
 * IMPORTANT: This service requires:
 *   1. A Meta App with instagram_basic + instagram_content_publish permissions
 *   2. Meta App Review approval for instagram_content_publish (required for
 *      publishing to non-test accounts)
 *   3. A valid long-lived User Access Token or Page Token
 *
 * See README.md § "Meta App Setup" for full instructions.
 */

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class MetaApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public type?: string,
    public fbtraceId?: string
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

// ─────────────────────────────────────────
// LOW-LEVEL FETCH
// ─────────────────────────────────────────

async function graphRequest<T>(
  method: "GET" | "POST",
  path: string,
  params: Record<string, string> = {},
  accessToken: string
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);

  let init: RequestInit;
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    init = { method: "GET" };
  } else {
    const body = new URLSearchParams(params);
    init = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    };
  }

  const res = await fetch(url.toString(), init);
  const json = await res.json();

  if (!res.ok || json.error) {
    const err = json.error ?? { code: res.status, message: "Unknown error" };
    throw new MetaApiError(
      err.code ?? res.status,
      err.message ?? "Unknown error",
      err.type,
      err.fbtrace_id
    );
  }

  return json as T;
}

// ─────────────────────────────────────────
// TOKEN MANAGEMENT
// ─────────────────────────────────────────

export interface LongLivedTokenResult {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
}

/**
 * Exchange short-lived token for long-lived token.
 * Short-lived tokens are obtained from the OAuth flow.
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<LongLivedTokenResult> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be set");
  }

  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const res = await fetch(url.toString());
  const json = await res.json();

  if (!res.ok || json.error) {
    const err = json.error ?? { code: res.status, message: "Token exchange failed" };
    throw new MetaApiError(err.code, err.message, err.type);
  }

  return json as LongLivedTokenResult;
}

/**
 * Get a Page access token from a user token.
 * Required for some Instagram publishing flows.
 */
export async function getPageAccessToken(
  pageId: string,
  userToken: string
): Promise<string> {
  const result = await graphRequest<{ access_token: string }>(
    "GET",
    `/${pageId}`,
    { fields: "access_token" },
    userToken
  );
  return result.access_token;
}

/**
 * Inspect a token to verify it's valid.
 */
export interface TokenDebugResult {
  app_id: string;
  is_valid: boolean;
  expires_at?: number;
  scopes?: string[];
  user_id?: string;
}

export async function debugToken(
  tokenToInspect: string
): Promise<TokenDebugResult> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID / META_APP_SECRET not set");

  const appToken = `${appId}|${appSecret}`;
  const url = new URL(`${GRAPH_BASE}/debug_token`);
  url.searchParams.set("input_token", tokenToInspect);
  url.searchParams.set("access_token", appToken);

  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data as TokenDebugResult;
}

// ─────────────────────────────────────────
// INSTAGRAM ACCOUNT DISCOVERY
// ─────────────────────────────────────────

export interface IgAccountInfo {
  igUserId: string;
  igUsername: string;
  fbPageId: string;
  fbPageName: string;
  pageToken: string;
}

/**
 * Given a user token, find the Instagram Professional account linked to
 * their Facebook Pages.
 *
 * Flow: user token → Pages list → each page's instagram_business_account
 */
export async function getLinkedIgAccounts(
  userToken: string
): Promise<IgAccountInfo[]> {
  interface PageResult {
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string; username: string };
  }
  interface PagesResponse {
    data: PageResult[];
  }

  const pages = await graphRequest<PagesResponse>(
    "GET",
    "/me/accounts",
    { fields: "id,name,access_token,instagram_business_account{id,username}" },
    userToken
  );

  const results: IgAccountInfo[] = [];
  for (const page of pages.data) {
    if (page.instagram_business_account) {
      results.push({
        igUserId: page.instagram_business_account.id,
        igUsername: page.instagram_business_account.username,
        fbPageId: page.id,
        fbPageName: page.name,
        pageToken: page.access_token,
      });
    }
  }
  return results;
}

// ─────────────────────────────────────────
// MEDIA PUBLISHING
// ─────────────────────────────────────────

/**
 * Step 1a: Create a single image media container.
 * imageUrl must be a publicly accessible URL.
 *
 * NOTE: Meta requires publicly accessible URLs for media.
 * Use pre-signed S3 URLs (min. 1 hour validity) or public bucket.
 */
export async function createImageContainer(
  igUserId: string,
  imageUrl: string,
  caption: string,
  accessToken: string,
  locationId?: string
): Promise<string> {
  const params: Record<string, string> = {
    image_url: imageUrl,
    caption,
    media_type: "IMAGE",
  };
  if (locationId) params.location_id = locationId;

  const result = await graphRequest<{ id: string }>(
    "POST",
    `/${igUserId}/media`,
    params,
    accessToken
  );
  return result.id;
}

/**
 * Step 1b: Create a carousel item container (no caption, no publish).
 */
export async function createCarouselItemContainer(
  igUserId: string,
  mediaUrl: string,
  mediaType: "IMAGE" | "VIDEO",
  accessToken: string
): Promise<string> {
  const params: Record<string, string> = {
    image_url: mediaType === "IMAGE" ? mediaUrl : "",
    video_url: mediaType === "VIDEO" ? mediaUrl : "",
    media_type: mediaType,
    is_carousel_item: "true",
  };
  // Remove empty params
  for (const k of Object.keys(params)) {
    if (!params[k]) delete params[k];
  }

  const result = await graphRequest<{ id: string }>(
    "POST",
    `/${igUserId}/media`,
    params,
    accessToken
  );
  return result.id;
}

/**
 * Step 1c: Create carousel parent container.
 */
export async function createCarouselContainer(
  igUserId: string,
  childrenIds: string[],
  caption: string,
  accessToken: string,
  locationId?: string
): Promise<string> {
  const params: Record<string, string> = {
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
    caption,
  };
  if (locationId) params.location_id = locationId;

  const result = await graphRequest<{ id: string }>(
    "POST",
    `/${igUserId}/media`,
    params,
    accessToken
  );
  return result.id;
}

/**
 * Step 1d: Create a reel container.
 * videoUrl must be a publicly accessible URL.
 *
 * NOTE: Reels require the video to be fully uploaded and accessible.
 * For large videos, use the resumable upload API (not implemented here;
 * documented as external dependency in README).
 */
export async function createReelContainer(
  igUserId: string,
  videoUrl: string,
  caption: string,
  accessToken: string,
  locationId?: string
): Promise<string> {
  const params: Record<string, string> = {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: "true",
  };
  if (locationId) params.location_id = locationId;

  const result = await graphRequest<{ id: string }>(
    "POST",
    `/${igUserId}/media`,
    params,
    accessToken
  );
  return result.id;
}

/**
 * Step 2: Check container status.
 * For videos/reels, wait until status = FINISHED before publishing.
 */
export interface ContainerStatus {
  id: string;
  status_code: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";
  error_message?: string;
}

export async function getContainerStatus(
  containerId: string,
  accessToken: string
): Promise<ContainerStatus> {
  return graphRequest<ContainerStatus>(
    "GET",
    `/${containerId}`,
    { fields: "status_code,error_message" },
    accessToken
  );
}

/**
 * Step 3: Publish a container.
 * Returns the media ID of the published post.
 */
export async function publishContainer(
  igUserId: string,
  containerId: string,
  accessToken: string
): Promise<string> {
  const result = await graphRequest<{ id: string }>(
    "POST",
    `/${igUserId}/media_publish`,
    { creation_id: containerId },
    accessToken
  );
  return result.id;
}

/**
 * Get permalink of a published media.
 */
export async function getMediaPermalink(
  mediaId: string,
  accessToken: string
): Promise<string | undefined> {
  try {
    const result = await graphRequest<{ permalink?: string }>(
      "GET",
      `/${mediaId}`,
      { fields: "permalink" },
      accessToken
    );
    return result.permalink;
  } catch {
    return undefined;
  }
}

/**
 * Post first comment on a media.
 */
export async function postFirstComment(
  mediaId: string,
  comment: string,
  accessToken: string
): Promise<void> {
  await graphRequest<{ id: string }>(
    "POST",
    `/${mediaId}/comments`,
    { message: comment },
    accessToken
  );
}

// ─────────────────────────────────────────
// OAUTH URL BUILDER
// ─────────────────────────────────────────

export function buildOAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !redirectUri) {
    throw new Error("META_APP_ID and META_REDIRECT_URI must be set");
  }

  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  return url.toString();
}

/**
 * Exchange OAuth code for a short-lived token, then for a long-lived one.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    throw new Error("META_APP_ID, META_APP_SECRET, META_REDIRECT_URI must be set");
  }

  // Step 1: Short-lived token
  const tokenUrl = new URL(`${GRAPH_BASE}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const shortRes = await fetch(tokenUrl.toString());
  const shortJson = await shortRes.json();

  if (!shortRes.ok || shortJson.error) {
    throw new MetaApiError(
      shortJson.error?.code ?? shortRes.status,
      shortJson.error?.message ?? "Token exchange failed"
    );
  }

  // Step 2: Long-lived token
  const longLived = await exchangeForLongLivedToken(shortJson.access_token);
  const expiresAt = new Date(
    Date.now() + (longLived.expires_in - 300) * 1000 // 5 min buffer
  );

  return {
    accessToken: longLived.access_token,
    expiresAt,
  };
}
