/**
 * Cliente Together.AI singleton + helpers para generación de imágenes y vídeo.
 *
 * Routing por capability:
 *   - Imágenes feed/carrusel  → FLUX.1 dev (calidad pro a 1/3 coste DALL-E)
 *   - Imágenes hero shots     → FLUX.1.1 pro / FLUX.2 pro
 *   - Imágenes rápidas/trial  → FLUX.1 schnell (más barato)
 *   - Hashtags                → Llama 3.3 70B (mecánico, 4× más barato que Haiku)
 *   - Vision análisis         → Llama 3.2 90B Vision (descripción de imágenes)
 *   - Reels Pro               → Kling 2.1 Master vía Together
 *   - Reels Cinematic         → Sora 2 vía Together
 *
 * Sin la TOGETHER_API_KEY, los helpers devuelven null y las rutas
 * responden 503 limpiamente.
 */
import Together from "together-ai";

declare global {
  // eslint-disable-next-line no-var
  var __together: Together | undefined;
}

// ─── Modelos ────────────────────────────────────────────────────────────────

export const MODEL_FLUX_SCHNELL = "black-forest-labs/FLUX.1-schnell-Free" as const;
export const MODEL_FLUX_DEV = "black-forest-labs/FLUX.1-dev" as const;
export const MODEL_FLUX_PRO = "black-forest-labs/FLUX.1.1-pro" as const;
export const MODEL_LLAMA_33_70B = "meta-llama/Llama-3.3-70B-Instruct-Turbo" as const;
export const MODEL_LLAMA_VISION = "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo" as const;

export type FluxModel =
  | typeof MODEL_FLUX_SCHNELL
  | typeof MODEL_FLUX_DEV
  | typeof MODEL_FLUX_PRO;

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

interface AspectDimensions {
  width: number;
  height: number;
}

const ASPECT_TO_DIMENSIONS: Record<AspectRatio, AspectDimensions> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 896, height: 1120 },
  "9:16": { width: 720, height: 1280 },
  "16:9": { width: 1280, height: 720 },
};

// ─── Coste por imagen (USD, abril 2026) ─────────────────────────────────────

export const FLUX_COST_USD: Record<FluxModel, number> = {
  [MODEL_FLUX_SCHNELL]: 0.0027,
  [MODEL_FLUX_DEV]: 0.0154,
  [MODEL_FLUX_PRO]: 0.04,
};

// ─── Cliente ────────────────────────────────────────────────────────────────

export function getTogether(): Together | null {
  if (!process.env.TOGETHER_API_KEY) return null;
  if (global.__together) return global.__together;
  const client = new Together({ apiKey: process.env.TOGETHER_API_KEY });
  if (process.env.NODE_ENV !== "production") global.__together = client;
  return client;
}

export function isTogetherAvailable(): boolean {
  return !!process.env.TOGETHER_API_KEY;
}

// ─── Image generation ───────────────────────────────────────────────────────

export interface GenerateImageInput {
  prompt: string;
  model?: FluxModel;
  aspectRatio?: AspectRatio;
  seed?: number;
  negativePrompt?: string;
  /** N° de imágenes a generar (1-4). Coste se multiplica. */
  n?: number;
}

export interface GenerateImageResult {
  imageUrls: string[];
  model: FluxModel;
  costUsd: number;
  width: number;
  height: number;
  seed?: number;
}

/**
 * Genera 1 o más imágenes con FLUX vía Together.AI.
 * Devuelve URLs (Together las hospeda temporalmente — el caller las descarga
 * y guarda en R2 si necesita persistencia).
 *
 * Para hero shots usa FLUX.1.1-pro (model = MODEL_FLUX_PRO).
 * Para feed estándar FLUX.1-dev.
 * Para iteración rápida FLUX.1-schnell (más barato pero menor calidad).
 */
export async function generateImage(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  const client = getTogether();
  if (!client) {
    throw new Error("TOGETHER_API_KEY no configurada");
  }

  const model = input.model ?? MODEL_FLUX_DEV;
  const aspect = input.aspectRatio ?? "1:1";
  const dims = ASPECT_TO_DIMENSIONS[aspect];
  const n = Math.min(4, Math.max(1, input.n ?? 1));

  // SDK v0.39 expone images.generate (no images.create). Tipos parciales,
  // casteamos defensivamente.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images = (client.images as unknown) as {
    generate(opts: Record<string, unknown>): Promise<{
      data?: Array<{ url?: string; b64_json?: string }>;
    }>;
  };

  const response = await images.generate({
    model,
    prompt: input.prompt,
    width: dims.width,
    height: dims.height,
    steps: model === MODEL_FLUX_SCHNELL ? 4 : model === MODEL_FLUX_PRO ? 28 : 25,
    n,
    seed: input.seed,
    negative_prompt: input.negativePrompt,
    response_format: "url",
  });

  const dataArr = response.data ?? [];
  const imageUrls = dataArr
    .map((d) => d.url)
    .filter((u): u is string => typeof u === "string" && u.length > 0);

  if (imageUrls.length === 0) {
    throw new Error("Together no devolvió URLs de imagen");
  }

  return {
    imageUrls,
    model,
    costUsd: FLUX_COST_USD[model] * imageUrls.length,
    width: dims.width,
    height: dims.height,
    seed: input.seed,
  };
}

// ─── Llama 3.3 chat (hashtags + tareas mecánicas) ───────────────────────────

export interface LlamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function llamaChat(input: {
  messages: LlamaChatMessage[];
  model?: typeof MODEL_LLAMA_33_70B | typeof MODEL_LLAMA_VISION;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<{
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  costUsd: number;
}> {
  const client = getTogether();
  if (!client) {
    throw new Error("TOGETHER_API_KEY no configurada");
  }

  const model = input.model ?? MODEL_LLAMA_33_70B;

  const response = await client.chat.completions.create({
    model,
    messages: input.messages,
    max_tokens: input.maxTokens ?? 600,
    temperature: input.temperature ?? 0.7,
    ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  const text = response.choices?.[0]?.message?.content ?? "";
  const usage = response.usage;
  const inputTokens = usage?.prompt_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? 0;

  // Llama 3.3 70B: $0.88 in / $0.88 out per 1M tokens.
  // Llama 3.2 Vision 90B: $1.20 in / $1.20 out per 1M tokens.
  const pricePerMillion = model === MODEL_LLAMA_VISION ? 1.2 : 0.88;
  const costUsd = ((inputTokens + outputTokens) * pricePerMillion) / 1_000_000;

  return {
    text,
    usage: { inputTokens, outputTokens },
    costUsd: Math.round(costUsd * 1_000_000) / 1_000_000,
  };
}

// ─── Vision (análisis de imagen para clustering / paleta) ──────────────────

export async function analyzeImageWithVision(input: {
  imageUrl: string;
  prompt: string;
  maxTokens?: number;
}): Promise<{ text: string; costUsd: number }> {
  const client = getTogether();
  if (!client) {
    throw new Error("TOGETHER_API_KEY no configurada");
  }

  const response = await client.chat.completions.create({
    model: MODEL_LLAMA_VISION,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: input.prompt },
          { type: "image_url", image_url: { url: input.imageUrl } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
      },
    ],
    max_tokens: input.maxTokens ?? 400,
  });

  const text = response.choices?.[0]?.message?.content ?? "";
  const usage = response.usage;
  const total = (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0);
  const costUsd = (total * 1.2) / 1_000_000;
  return { text, costUsd: Math.round(costUsd * 1_000_000) / 1_000_000 };
}
