/**
 * Rate limiter de generación AI por business.
 *
 * Usa una sliding window de N minutos via Redis sorted set:
 *   - ZADD ai:rl:<businessId> <now> <id>
 *   - ZREMRANGEBYSCORE ai:rl:<businessId> 0 (now - windowMs)
 *   - ZCARD ai:rl:<businessId>
 *   - EXPIRE ai:rl:<businessId> windowSec
 *
 * Si Redis no está disponible (dev local) el rate limiter siempre permite —
 * la herramienta no debe romperse en local sin Redis.
 *
 * Limit por defecto: 10 generaciones/minuto/business.
 */
import { getRedis } from "@/lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms en que vuelve a haber slot disponible
}

interface Config {
  windowMs: number;
  max: number;
}

const DEFAULT_CONFIG: Config = {
  windowMs: 60_000, // 1 minuto
  max: 10,
};

export async function checkAiRateLimit(
  businessId: string,
  config: Partial<Config> = {},
): Promise<RateLimitResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, remaining: cfg.max, resetAt: Date.now() + cfg.windowMs };
  }

  const key = `ai:rl:${businessId}`;
  const now = Date.now();
  const windowStart = now - cfg.windowMs;

  try {
    const pipeline = redis.multi();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random().toString(36).slice(2, 8)}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, cfg.windowMs);
    const results = await pipeline.exec();

    if (!results) {
      return { allowed: true, remaining: cfg.max, resetAt: now + cfg.windowMs };
    }

    // results[2] es el ZCARD: [error | null, count]
    const cardEntry = results[2];
    const count = cardEntry && Array.isArray(cardEntry) ? Number(cardEntry[1] ?? 0) : 0;

    const allowed = count <= cfg.max;
    const remaining = Math.max(0, cfg.max - count);

    return { allowed, remaining, resetAt: now + cfg.windowMs };
  } catch (err) {
    console.error("[ai/rate-limit] redis error:", err);
    // Fail-open en caso de error de Redis para no bloquear al usuario.
    return { allowed: true, remaining: cfg.max, resetAt: now + cfg.windowMs };
  }
}
