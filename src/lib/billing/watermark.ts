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
 * Default actual: marca DESACTIVADA por código. Esta función devuelve
 * null SIEMPRE — ningún post lleva la marca "Programado con autopost.app",
 * sin importar el plan.
 *
 * Para reactivar (cuando vendamos como SaaS público con plan FREE con
 * marca): poner WATERMARK_ENABLED="1" en las variables de entorno.
 * Entonces vuelve la regla original: tier === "FREE" → marca, paid → sin.
 */
export function getWatermarkFor(
  user: Pick<AdminUser, "plan">,
  subscription?: Pick<Subscription, "status" | "tier"> | null
): string | null {
  // Default: marca off. Se activa explícitamente con env var.
  if (process.env.WATERMARK_ENABLED !== "1") return null;

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
