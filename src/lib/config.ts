/**
 * Platform configuration store.
 * Reads from system_configs table first, falls back to env vars.
 * Sensitive values (secrets) are encrypted with AES-256-GCM.
 */
import { db } from "./db";
import { encrypt, decrypt } from "./crypto";

export type ConfigKey =
  | "META_APP_ID"
  | "META_APP_SECRET"
  | "META_REDIRECT_URI";

const SENSITIVE_KEYS: ConfigKey[] = ["META_APP_SECRET"];

export interface MetaAppConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

/** Read a single config value (plain or decrypted). Returns null if not set. */
export async function getConfig(key: ConfigKey): Promise<string | null> {
  try {
    const row = await db.systemConfig.findUnique({ where: { key } });
    if (!row) return process.env[key] ?? null;

    if (row.isEncrypted && row.valueEnc && row.valueIv && row.valueTag) {
      return decrypt({ enc: row.valueEnc, iv: row.valueIv, tag: row.valueTag });
    }
    return row.value ?? process.env[key] ?? null;
  } catch {
    // If DB is unavailable during startup, fall back to env
    return process.env[key] ?? null;
  }
}

/** Write a config value. Sensitive keys are automatically encrypted. */
export async function setConfig(
  key: ConfigKey,
  value: string,
  description?: string
): Promise<void> {
  const isEncrypted = SENSITIVE_KEYS.includes(key);

  if (isEncrypted) {
    const { enc, iv, tag } = encrypt(value);
    await db.systemConfig.upsert({
      where: { key },
      create: { key, valueEnc: enc, valueIv: iv, valueTag: tag, isEncrypted: true, description },
      update: { valueEnc: enc, valueIv: iv, valueTag: tag, isEncrypted: true },
    });
  } else {
    await db.systemConfig.upsert({
      where: { key },
      create: { key, value, isEncrypted: false, description },
      update: { value, isEncrypted: false },
    });
  }
}

/** Delete a config value (reverts to env var fallback). */
export async function deleteConfig(key: ConfigKey): Promise<void> {
  await db.systemConfig.deleteMany({ where: { key } });
}

/**
 * Load all three Meta App credentials.
 * Throws if any are missing (neither DB nor env).
 */
export async function getMetaAppConfig(): Promise<MetaAppConfig> {
  const [appId, appSecret, redirectUri] = await Promise.all([
    getConfig("META_APP_ID"),
    getConfig("META_APP_SECRET"),
    getConfig("META_REDIRECT_URI"),
  ]);

  if (!appId)      throw new Error("META_APP_ID not configured. Set it in Settings → Meta App.");
  if (!appSecret)  throw new Error("META_APP_SECRET not configured. Set it in Settings → Meta App.");
  if (!redirectUri) throw new Error("META_REDIRECT_URI not configured. Set it in Settings → Meta App.");

  return { appId, appSecret, redirectUri };
}

/**
 * Returns which keys are configured (without exposing values).
 * Safe to send to the frontend.
 */
export async function getConfigStatus(): Promise<Record<ConfigKey, boolean>> {
  const keys: ConfigKey[] = ["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"];
  const status: Record<string, boolean> = {};

  for (const key of keys) {
    const val = await getConfig(key);
    status[key] = !!val;
  }

  return status as Record<ConfigKey, boolean>;
}
