/**
 * Cliente Anthropic singleton + utilidades de coste y validación de entorno.
 *
 * Uso:
 *   import { getAnthropic, computeCostUsd, MODEL_CAPTION } from "@/lib/ai/anthropic";
 *   const client = getAnthropic();
 *   if (!client) return new Response("AI unavailable", { status: 503 });
 *
 * Tarjeta de precios cacheable (USD por millón de tokens, abril 2026):
 *   - Sonnet 4.5: input $3, output $15, cache_read $0.30, cache_creation $3.75
 *   - Haiku 4.5:  input $1, output $5,  cache_read $0.10, cache_creation $1.25
 *
 * El cache_read es ~10x más barato que input — la pieza estable
 * (brand voice, ejemplos, instrucciones del sistema) se cachea
 * con `cache_control: { type: "ephemeral" }` y se reutiliza durante 5 min.
 */
import Anthropic from "@anthropic-ai/sdk";

declare global {
  // eslint-disable-next-line no-var
  var __anthropic: Anthropic | undefined;
}

export const MODEL_CAPTION = "claude-sonnet-4-5" as const;
export const MODEL_HASHTAGS = "claude-haiku-4-5" as const;

export type AiModel = typeof MODEL_CAPTION | typeof MODEL_HASHTAGS;

interface PriceTable {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

const PRICING: Record<AiModel, PriceTable> = {
  "claude-sonnet-4-5": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheCreation: 3.75,
  },
  "claude-haiku-4-5": {
    input: 1.0,
    output: 5.0,
    cacheRead: 0.1,
    cacheCreation: 1.25,
  },
};

/**
 * Devuelve un cliente compartido cuando ANTHROPIC_API_KEY existe.
 * En desarrollo o cuando falta la clave, devuelve null para que las rutas
 * respondan 503 sin lanzar excepciones.
 */
export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (global.__anthropic) return global.__anthropic;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  if (process.env.NODE_ENV !== "production") global.__anthropic = client;
  return client;
}

export function isAiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export interface UsageCounts {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

/**
 * Calcula coste en USD a partir de los counters devueltos por la API.
 * Los counters cache_read_input_tokens y cache_creation_input_tokens
 * vienen ya separados — no los sumes a inputTokens.
 */
export function computeCostUsd(model: AiModel, usage: UsageCounts): number {
  const p = PRICING[model];
  const cost =
    (usage.inputTokens * p.input) / 1_000_000 +
    (usage.outputTokens * p.output) / 1_000_000 +
    (usage.cacheReadTokens * p.cacheRead) / 1_000_000 +
    (usage.cacheCreationTokens * p.cacheCreation) / 1_000_000;
  // Redondeo a 6 decimales (~ 1 millonésima de dólar) para evitar floats sucios.
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * Extrae los counters del objeto `usage` que devuelve la API.
 * Maneja la ausencia de campos cache_* (cuando no hay caché).
 */
export function extractUsage(raw: {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}): UsageCounts {
  return {
    inputTokens: raw.input_tokens ?? 0,
    outputTokens: raw.output_tokens ?? 0,
    cacheReadTokens: raw.cache_read_input_tokens ?? 0,
    cacheCreationTokens: raw.cache_creation_input_tokens ?? 0,
  };
}
