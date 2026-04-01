/**
 * Meta Graph API client — decoupled, typed, error-mapped.
 *
 * All calls use the official Instagram Graph API v21.0.
 * https://developers.facebook.com/docs/instagram-api
 *
 * IMPORTANT: This service requires:
 *   1. A Meta App with Instagram Business permissions
 *      (instagram_business_basic + instagram_business_content_publish)
 *   2. Meta App Review approval for publishing (required for non-test accounts)
 *   3. A valid long-lived User Access Token
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
 * Tries Instagram token exchange first, falls back to Facebook token exchange.
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<LongLivedTokenResult> {
  const { appId, appSecret } = await import("@/lib/config").then((m) =>
    m.getMetaAppConfig()
  );

  // Try Instagram long-lived token exchange first
  try {
    const igUrl = new URL("https://graph.instagram.com/access_token");
    igUrl.searchParams.set("grant_type", "ig_exchange_token");
    igUrl.searchParams.set("client_secret", appSecret);
    igUrl.searchParams.set("access_token", shortLivedToken);

    const igRes = await fetch(igUrl.toString());
    const igJson = await igRes.json();

    if (igRes.ok && !igJson.error && igJson.access_token) {
      return igJson as LongLivedTokenResult;
    }
  } catch {
    // Not an Instagram token, try Facebook exchange below
  }

  // Facebook long-lived token exchange
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
  const { appId, appSecret } = await import("@/lib/config").then((m) =>
    m.getMetaAppConfig()
  );

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
 * Given a user token, find the Instagram Professional account.
 *
 * Tries two flows:
 * 1. Instagram Business Login: /me → direct IG account info
 * 2. Facebook Login (legacy): /me/accounts → Pages → instagram_business_account
 */
export async function getLinkedIgAccounts(
  userToken: string
): Promise<IgAccountInfo[]> {
  // Try Instagram Business Login flow first: token is for an IG user directly
  try {
    const me = await graphRequest<{
      id: string;
      username?: string;
      name?: string;
      user_id?: string;
    }>(
      "GET",
      "/me",
      { fields: "id,username,name" },
      userToken
    );

    // If we get a username, this is an Instagram Login token
    if (me.username) {
      return [{
        igUserId: me.user_id ?? me.id,
        igUsername: me.username,
        fbPageId: me.id,
        fbPageName: me.name ?? me.username,
        pageToken: userToken,
      }];
    }
  } catch {
    // Not an Instagram Login token, try Facebook Login flow below
  }

  // Facebook Login flow: discover IG accounts via Facebook Pages
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

export async function buildOAuthUrl(state: string): Promise<string> {
  const { appId, redirectUri } = await import("@/lib/config").then((m) =>
    m.getMetaAppConfig()
  );

  const scopes = [
    "instagram_business_basic",
    "instagram_business_content_publish",
    "instagram_business_manage_comments",
  ].join(",");

  // Instagram Business Login requires the Instagram OAuth endpoint
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  // Enable Facebook Login fallback for accounts linked via FB Pages
  url.searchParams.set("enable_fb_login", "0");

  return url.toString();
}

/**
 * Exchange OAuth code for a short-lived token, then for a long-lived one.
 * Uses the Instagram API token exchange endpoint (form-urlencoded POST).
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const { appId, appSecret, redirectUri } = await import("@/lib/config").then(
    (m) => m.getMetaAppConfig()
  );

  // Step 1: Exchange code for short-lived token via Instagram API
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const shortJson = await shortRes.json();

  if (!shortRes.ok || shortJson.error_type || shortJson.error) {
    throw new MetaApiError(
      shortJson.code ?? shortRes.status,
      shortJson.error_message ?? shortJson.error?.message ?? "Token exchange failed"
    );
  }

  // Step 2: Exchange for long-lived token via Instagram Graph API
  const longLived = await exchangeForLongLivedToken(shortJson.access_token);
  const expiresAt = new Date(
    Date.now() + (longLived.expires_in - 300) * 1000 // 5 min buffer
  );

  return {
    accessToken: longLived.access_token,
    expiresAt,
  };
}
