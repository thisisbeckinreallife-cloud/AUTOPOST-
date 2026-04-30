/**
 * Cliente OpenAI singleton + utilidades de coste y validación de entorno.
 *
 * Uso:
 *   import { getOpenAI, isOpenAIAvailable, MODEL_CHAT } from "@/lib/ai/openai";
 *   const client = getOpenAI();
 *   if (!client) return new Response("AI unavailable", { status: 503 });
 *
 * Tarjeta de precios (USD por millón de tokens, abril 2026):
 *   - gpt-4o-mini: input $0.15, output $0.60  (sweet spot para chat)
 *   - gpt-4o:      input $2.50, output $10.00 (premium)
 *
 * Comparativa típica por interacción de chat (~16K input + 1.5K output):
 *   - gpt-4o-mini: $0.0033 (~5x más barato que Llama 3.3 en Together)
 *   - gpt-4o:      $0.055
 *
 * Tool calling: muy fiable en gpt-4o-mini (la razón principal para migrar
 * desde Llama 3.3 70B, que alucinaba nombres de funciones inexistentes).
 */
import OpenAI from "openai";

declare global {
  // eslint-disable-next-line no-var
  var __openai: OpenAI | undefined;
}

export const MODEL_CHAT = "gpt-4o-mini" as const;
export const MODEL_CHAT_PREMIUM = "gpt-4o" as const;

export type OpenAIModel = typeof MODEL_CHAT | typeof MODEL_CHAT_PREMIUM;

interface PriceTable {
  input: number;
  output: number;
}

const PRICING: Record<OpenAIModel, PriceTable> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
};

/**
 * Devuelve un cliente compartido cuando OPENAI_API_KEY existe.
 * En desarrollo o cuando falta la clave, devuelve null para que las rutas
 * respondan 503 sin lanzar excepciones.
 */
export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (global.__openai) return global.__openai;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  if (process.env.NODE_ENV !== "production") global.__openai = client;
  return client;
}

export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export interface UsageCounts {
  inputTokens: number;
  outputTokens: number;
}

export function computeCostUsd(
  model: OpenAIModel,
  usage: UsageCounts,
): number {
  const p = PRICING[model];
  const cost =
    (usage.inputTokens * p.input) / 1_000_000 +
    (usage.outputTokens * p.output) / 1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
