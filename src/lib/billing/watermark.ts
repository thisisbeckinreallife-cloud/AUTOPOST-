/**
 * Billing · Watermark "Programado con autopost.app"
 * ──────────────────────────────────────────────────────────────────────────
 * Inserta un texto promocional al final del caption de los posts publicados
 * SOLO cuando el usuario está en plan FREE. Cualquier plan de pago
 * (BASIC, PRO, AGENCY) publica sin watermark — no es negociable: si pagas,
 * no llevas marca. Si no pagas, llevas marca siempre.
 *
 * No hay toggle. La regla es binaria: tier === "FREE" → watermark, else null.
 *
 * Política de inserción:
 *  - Si la caption YA contiene el watermark (substring exacto), no duplica.
 *  - Si la caption está vacía, deja vacía (no spammeamos).
 *  - Insertamos con doble salto de línea + em-dash separator + emoji.
 *  - Texto fijo: "—\n📲 Programado con autopost.app"
 */

import type { AdminUser, Subscription } from "@prisma/client";
import { getEffectiveTier } from "./plan";

export const WATERMARK_TEXT = "—\n📲 Programado con autopost.app";

/**
 * Devuelve el watermark a aplicar (string) o null si no procede.
 *
 * Reglas en orden:
 *  1. Si la variable de entorno WATERMARK_DISABLED="1" → null SIEMPRE.
 *     Pensado para self-hosting / instancias del owner del producto que
 *     no quieren marca en sus propias publicaciones aunque su plan en BD
 *     sea FREE (sin Stripe configurado todavía).
 *  2. Plan FREE → watermark. Cualquier plan de pago → null.
 */
export function getWatermarkFor(
  user: Pick<AdminUser, "plan">,
  subscription?: Pick<Subscription, "status" | "tier"> | null
): string | null {
  // Kill-switch global vía env var. Útil para self-host / instancias del owner.
  if (process.env.WATERMARK_DISABLED === "1") return null;

  const tier = getEffectiveTier(user, subscription);
  return tier === "FREE" ? WATERMARK_TEXT : null;
}

/**
 * Devuelve la caption con el watermark añadido (si procede).
 * Idempotente: si la caption ya contiene el watermark, no duplica.
 */
export function appendWatermark(
  caption: string,
  user: Pick<AdminUser, "plan">,
  subscription?: Pick<Subscription, "status" | "tier"> | null
): string {
  const watermark = getWatermarkFor(user, subscription);
  if (!watermark) return caption;

  // No duplicar
  if (caption.includes(WATERMARK_TEXT)) return caption;

  // Si caption vacía, no añadimos solo el watermark suelto (queda raro)
  const trimmed = caption.trim();
  if (!trimmed) return caption;

  return `${trimmed}\n\n${watermark}`;
}

/**
 * Helper para tests / debugging — inspecciona si una caption ya tiene watermark.
 */
export function hasWatermark(caption: string): boolean {
  return caption.includes(WATERMARK_TEXT);
}
