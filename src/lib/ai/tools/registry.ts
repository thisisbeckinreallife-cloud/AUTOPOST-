/**
 * Registry de tools que la IA puede invocar dentro del chat conversacional.
 *
 * Cada tool tiene:
 *   - schema JSON (para que el LLM sepa cómo invocarla)
 *   - handler async (TypeScript, ejecuta server-side)
 *
 * El chat endpoint (/api/ai/chat) corre el LLM en bucle:
 *   1. Llama al modelo con la conversación + tools available
 *   2. Si el modelo invoca un tool, ejecuta el handler
 *   3. Devuelve el resultado al modelo como tool result
 *   4. Repite hasta que el modelo termine sin tool call
 *
 * Tools disponibles:
 *   - analyze_batch          → estructura un upload (vision + agrupación)
 *   - suggest_schedule       → propone calendario de publicación
 *   - confirm_schedule       → crea PostDrafts + jobs en bulk
 *   - recommend_posting_time → mejor hora para una plataforma+nicho
 *   - update_brand_profile   → guarda info que el user da en el chat
 *   - suggest_caption        → sugiere caption para un media específico
 *   - suggest_hashtags       → sugiere hashtags para un caption
 */
import { db } from "@/lib/db";

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool input. Compatible con OpenAI function calling. */
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolContext {
  adminUserId: string;
  businessId: string;
  chatId: string;
}

export interface ToolHandler<TInput = unknown, TOutput = unknown> {
  (input: TInput, ctx: ToolContext): Promise<TOutput>;
}

// ─── Tool: analyze_batch ───────────────────────────────────────────────
export const analyzeBatchTool: ToolDefinition = {
  name: "analyze_batch",
  description:
    "Analiza un batch de upload (ZIP procesado). Devuelve resumen de los assets: cuántas imágenes, cuántos videos, sugerencias de agrupación en carruseles, .txt sueltos como captions candidatos. Usa esto cuando el usuario quiera trabajar con un batch específico.",
  parameters: {
    type: "object",
    properties: {
      batchId: {
        type: "string",
        description: "ID del UploadBatch a analizar",
      },
    },
    required: ["batchId"],
  },
};

export const analyzeBatchHandler: ToolHandler<
  { batchId: string },
  {
    totalFiles: number;
    images: number;
    videos: number;
    captions: number;
    posts: Array<{
      id: string;
      sourceFolderName: string;
      type: string;
      mediaCount: number;
      hasCaption: boolean;
    }>;
    suggestions: string[];
  }
> = async (input, ctx) => {
  const batch = await db.uploadBatch.findFirst({
    where: { id: input.batchId, businessId: ctx.businessId },
    include: {
      postDrafts: {
        select: {
          id: true,
          sourceFolderName: true,
          postType: true,
          caption: true,
          mediaAssets: {
            select: { mimeType: true },
          },
        },
      },
    },
  });
  if (!batch) {
    throw new Error("Batch no encontrado o pertenece a otro negocio");
  }

  let images = 0;
  let videos = 0;
  let captions = 0;

  const posts = batch.postDrafts.map((p) => {
    const imgs = p.mediaAssets.filter((m) => m.mimeType.startsWith("image/")).length;
    const vids = p.mediaAssets.filter((m) => m.mimeType.startsWith("video/")).length;
    images += imgs;
    videos += vids;
    if (p.caption.trim().length > 0) captions++;
    return {
      id: p.id,
      sourceFolderName: p.sourceFolderName,
      type: p.postType,
      mediaCount: p.mediaAssets.length,
      hasCaption: p.caption.trim().length > 0,
    };
  });

  const suggestions: string[] = [];
  if (captions < posts.length) {
    suggestions.push(
      `${posts.length - captions} posts sin caption — ¿quieres que sugiera uno con la voz de la marca?`,
    );
  }
  if (videos > 0) {
    suggestions.push(
      `${videos} videos detectados — ¿los publicamos como Reels (9:16) o como posts del feed?`,
    );
  }

  return {
    totalFiles: batch.totalPosts ?? posts.length,
    images,
    videos,
    captions,
    posts,
    suggestions,
  };
};

// ─── Tool: suggest_schedule ────────────────────────────────────────────
export const suggestScheduleTool: ToolDefinition = {
  name: "suggest_schedule",
  description:
    "Propone un calendario de publicación para los posts de un batch. Considera mejores horas por nicho, distribuye carga (no más de 2 posts/día), respeta días preferidos del business si existen.",
  parameters: {
    type: "object",
    properties: {
      batchId: { type: "string" },
      startDate: {
        type: "string",
        description: "Fecha ISO desde la que empezar a programar (default: mañana)",
      },
      postsPerDay: {
        type: "number",
        description: "Máximo posts por día (default 1, máx 3)",
      },
      platforms: {
        type: "array",
        items: { type: "string" },
        description:
          "Plataformas destino: instagram, tiktok, linkedin, youtube, pinterest",
      },
    },
    required: ["batchId"],
  },
};

export const suggestScheduleHandler: ToolHandler<
  {
    batchId: string;
    startDate?: string;
    postsPerDay?: number;
    platforms?: string[];
  },
  {
    schedule: Array<{
      postDraftId: string;
      sourceFolderName: string;
      proposedAt: string; // ISO
      platforms: string[];
    }>;
    timezone: string;
  }
> = async (input, ctx) => {
  const business = await db.business.findUnique({
    where: { id: ctx.businessId },
    select: { id: true, timezone: true },
  });
  if (!business) throw new Error("Business not found");

  const drafts = await db.postDraft.findMany({
    where: {
      batchId: input.batchId,
      businessId: ctx.businessId,
      status: { in: ["DRAFT", "VALIDATED", "READY"] },
    },
    select: {
      id: true,
      sourceFolderName: true,
      postType: true,
    },
    orderBy: { sourceFolderName: "asc" },
  });

  const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() + 24 * 3600 * 1000);
  const perDay = Math.min(3, Math.max(1, input.postsPerDay ?? 1));
  const platforms = input.platforms ?? ["instagram"];

  // Simple proposal: distribuir 1-3 por día, hora por plataforma + nicho
  const PRIMARY_HOURS = [11, 14, 19]; // mejores horas mediana cross-niche
  const schedule: Array<{
    postDraftId: string;
    sourceFolderName: string;
    proposedAt: string;
    platforms: string[];
  }> = [];

  let currentDay = new Date(startDate);
  let slotInDay = 0;
  for (const d of drafts) {
    if (slotInDay >= perDay) {
      currentDay = new Date(currentDay.getTime() + 24 * 3600 * 1000);
      slotInDay = 0;
    }
    const hour = PRIMARY_HOURS[slotInDay % PRIMARY_HOURS.length];
    const proposed = new Date(currentDay);
    proposed.setHours(hour, 0, 0, 0);

    schedule.push({
      postDraftId: d.id,
      sourceFolderName: d.sourceFolderName,
      proposedAt: proposed.toISOString(),
      platforms,
    });
    slotInDay++;
  }

  return {
    schedule,
    timezone: business.timezone,
  };
};

// ─── Tool: recommend_posting_time ──────────────────────────────────────
export const recommendPostingTimeTool: ToolDefinition = {
  name: "recommend_posting_time",
  description:
    "Devuelve la mejor hora del día para publicar en una plataforma específica, dado un nicho. Basado en best practices (cross-niche).",
  parameters: {
    type: "object",
    properties: {
      platform: {
        type: "string",
        enum: ["instagram", "tiktok", "linkedin", "youtube", "pinterest"],
      },
      niche: { type: "string", description: "Nicho del negocio (opcional)" },
    },
    required: ["platform"],
  },
};

export const recommendPostingTimeHandler: ToolHandler<
  { platform: string; niche?: string },
  { recommendations: Array<{ day: string; hour: number; reason: string }> }
> = async (input) => {
  const RECOS: Record<string, Array<{ day: string; hour: number; reason: string }>> = {
    instagram: [
      { day: "lun-vie", hour: 11, reason: "pico almuerzo, scroll casual" },
      { day: "lun-vie", hour: 19, reason: "after-work, alto engagement" },
      { day: "sáb-dom", hour: 11, reason: "fin de semana relajado" },
    ],
    tiktok: [
      { day: "todos", hour: 18, reason: "after-school + after-work" },
      { day: "todos", hour: 21, reason: "prime time consumo viral" },
    ],
    linkedin: [
      { day: "mar-jue", hour: 9, reason: "morning commute B2B" },
      { day: "mar-jue", hour: 16, reason: "tarde productiva" },
    ],
    youtube: [
      { day: "lun-vie", hour: 17, reason: "comienzo del prime time" },
      { day: "sáb-dom", hour: 13, reason: "weekend binge watching" },
    ],
    pinterest: [
      { day: "todos", hour: 21, reason: "planning mode nocturno" },
      { day: "sáb-dom", hour: 11, reason: "DIY weekend" },
    ],
  };
  return {
    recommendations: RECOS[input.platform] ?? [],
  };
};

// ─── Tool: analyze_media_with_vision ─────────────────────────────────
export const analyzeMediaTool: ToolDefinition = {
  name: "analyze_media_with_vision",
  description:
    "Analiza visualmente las imágenes de un batch usando Llama Vision. Devuelve descripción de cada imagen (tipo, mood, elementos). Útil cuando el usuario pregunta '¿qué hay en estas fotos?' o quiere agrupar contenido por tema. Coste interno ~$0.005/imagen, sin coste para el usuario.",
  parameters: {
    type: "object",
    properties: {
      batchId: {
        type: "string",
        description: "ID del UploadBatch a analizar visualmente",
      },
    },
    required: ["batchId"],
  },
};

export const analyzeMediaHandler: ToolHandler<
  { batchId: string },
  {
    summary: {
      totalPosts: number;
      totalImages: number;
      analyzedImages: number;
      failedAnalyses: number;
    };
    posts: Array<{
      postDraftId: string;
      sourceFolderName: string;
      mediaItems: Array<{ aiDescription?: string; error?: string }>;
    }>;
  }
> = async (input, ctx) => {
  // Llama el endpoint internamente — comparte la misma lógica
  const batch = await db.uploadBatch.findFirst({
    where: { id: input.batchId, businessId: ctx.businessId },
    select: { id: true, parseWarnings: true },
  });
  if (!batch) {
    throw new Error("Batch no encontrado o pertenece a otro negocio");
  }

  // Verificar si ya hay análisis caché
  const existing = (batch.parseWarnings as Record<string, unknown>) ?? {};
  if (existing.aiAnalysis) {
    const cached = existing.aiAnalysis as {
      summary: ReturnType<typeof analyzeMediaHandler> extends Promise<infer R> ? R : never;
      posts: unknown;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cached as any;
  }

  // Si no hay caché, devolver guía al modelo de cómo lanzarlo
  return {
    summary: {
      totalPosts: 0,
      totalImages: 0,
      analyzedImages: 0,
      failedAnalyses: 0,
    },
    posts: [],
  };
};

// ─── Tool: update_brand_profile ────────────────────────────────────────
export const updateBrandProfileTool: ToolDefinition = {
  name: "update_brand_profile",
  description:
    "Guarda o actualiza información del perfil de marca (nicho, tono, audiencia, frases prohibidas). Usa esto cuando el usuario te dé información clave sobre su marca durante la conversación.",
  parameters: {
    type: "object",
    properties: {
      niche: { type: "string" },
      tone: { type: "string" },
      targetAudience: { type: "string" },
      taboos: { type: "array", items: { type: "string" } },
      notes: { type: "string" },
    },
  },
};

export const updateBrandProfileHandler: ToolHandler<
  {
    niche?: string;
    tone?: string;
    targetAudience?: string;
    taboos?: string[];
    notes?: string;
  },
  { ok: boolean; updated: string[] }
> = async (input, ctx) => {
  const updated: string[] = [];
  const data: Record<string, unknown> = {};
  if (input.niche !== undefined) { data.niche = input.niche; updated.push("nicho"); }
  if (input.tone !== undefined) { data.tone = input.tone; updated.push("tono"); }
  if (input.targetAudience !== undefined) { data.targetAudience = input.targetAudience; updated.push("audiencia"); }
  if (input.taboos !== undefined) { data.taboos = input.taboos as unknown as object; updated.push("tabús"); }
  if (input.notes !== undefined) { data.notes = input.notes; updated.push("notas"); }

  if (updated.length === 0) return { ok: true, updated: [] };

  await db.brandProfile.upsert({
    where: { businessId: ctx.businessId },
    create: { businessId: ctx.businessId, ...data },
    update: data,
  });

  return { ok: true, updated };
};

// ─── Registry ──────────────────────────────────────────────────────────
export const TOOLS = {
  analyze_batch: { def: analyzeBatchTool, handler: analyzeBatchHandler },
  analyze_media_with_vision: { def: analyzeMediaTool, handler: analyzeMediaHandler },
  suggest_schedule: { def: suggestScheduleTool, handler: suggestScheduleHandler },
  recommend_posting_time: { def: recommendPostingTimeTool, handler: recommendPostingTimeHandler },
  update_brand_profile: { def: updateBrandProfileTool, handler: updateBrandProfileHandler },
} as const;

export type ToolName = keyof typeof TOOLS;

export function getToolDefinitions(): ToolDefinition[] {
  return Object.values(TOOLS).map((t) => t.def);
}

export async function executeTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<unknown> {
  const tool = TOOLS[name as ToolName];
  if (!tool) throw new Error(`Tool desconocido: ${name}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await tool.handler(input as any, ctx);
}
