/**
 * Billing · Watermark "Programado con autopost.app"
 * ──────────────────────────────────────────────────────────────────────────
 * Inserta un texto promocional al final del caption de los posts cuando el
 * usuario está en plan FREE o BASIC. Pro y Agency NO llevan watermark.
 *
 * El usuario puede desactivar el watermark con el toggle `hideWatermark`
 * en Settings, PERO esa preferencia solo se respeta si su plan ≥ PRO.
 * Server-side check: nunca confíes en `hideWatermark=true` con plan FREE.
 *
 * Política de inserción:
 *  - Si la caption YA contiene el watermark (substring exacto), no duplica.
 *  - Si la caption está vacía, deja vacía (no spammeamos).
 *  - Insertamos con doble salto de línea + dot separator + emoji minimal.
 *  - Texto fijo: "—\n📲 Programado con autopost.app"
 */

import type { AdminUser, Subscription } from "@prisma/client";
import { getEffectiveTier, FEATURES, type Tier } from "./plan";

export const WATERMARK_TEXT = "—\n📲 Programado con autopost.app";

/**
 * Devuelve el watermark a aplicar (string) o null si no procede.
 *
 * Reglas:
 *  - Si tier ≥ PRO Y user.hideWatermark === true → no watermark.
 *  - En cualquier otro caso → watermark (FREE/BASIC siempre, PRO/AGENCY
 *    solo si no han desactivado).
 */
export function getWatermarkFor(
  user: Pick<AdminUser, "plan" | "hideWatermark">,
  subscription?: Pick<Subscription, "status" | "tier"> | null
): string | null {
  const tier = getEffectiveTier(user, subscription);

  // Pro/Agency con preferencia de ocultar → respetamos
  if (FEATURES.canHideWatermark(tier) && user.hideWatermark) {
    return null;
  }

  // FREE/BASIC: siempre watermark, pase lo que pase con hideWatermark
  // Pro/Agency con hideWatermark=false: también watermark
  return WATERMARK_TEXT;
}

/**
 * Devuelve la caption con el watermark añadido (si procede).
 * Idempotente: si la caption ya contiene el watermark, no duplica.
 */
export function appendWatermark(
  caption: string,
  user: Pick<AdminUser, "plan" | "hideWatermark">,
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
