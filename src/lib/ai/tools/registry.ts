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
 *
 * Asistente conversacional (post-upload, flow nuevo):
 *   - analyze_uploaded_batch → resumen narrativo para arrancar la conversación
 *   - propose_schedule       → calcula DETERMINISTAMENTE las fechas concretas
 *   - apply_schedule         → ejecuta el reschedule + activa el batch
 */
import { db } from "@/lib/db";
import {
  analyzeUploadedBatchTool,
  analyzeUploadedBatchHandler,
  proposeScheduleTool,
  proposeScheduleHandler,
  applyScheduleTool,
  applyScheduleHandler,
} from "./schedule-assistant";

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
    /**
     * Indica que la heurística inicial parece haber agrupado mal.
     * El LLM debe llamar a regroup_batch_with_ai automáticamente
     * (sin preguntar al user) si este flag es true.
     */
    recommendsRegrouping: boolean;
    regroupingReason?: string;
  }
> = async (input, ctx) => {
  const batch = await db.uploadBatch.findFirst({
    where: { id: input.batchId, businessId: ctx.businessId },
    include: {
      postDrafts: {
        where: { status: { in: ["DRAFT", "VALIDATED", "READY"] } },
        select: {
          id: true,
          sourceFolderName: true,
          postType: true,
          caption: true,
          mediaAssets: {
            select: { mimeType: true, originalFilename: true },
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

  // ───────────────────────────────────────────
  // DETECCIÓN AUTOMÁTICA DE AGRUPAMIENTO MALO
  // ───────────────────────────────────────────
  // Heurísticas para detectar que la inicial agrupó mal:
  //  - 5+ posts tipo IMAGE sueltos (single-asset): el user probablemente
  //    quería carruseles pero la heurística no detectó patrón
  //  - 5+ posts cuyos nombres comparten un prefijo común no detectado
  //    (e.g. todos empiezan con "campana_" o "marketing_")
  //  - El batch tiene >= 6 imágenes en total Y la mayoría son posts IMAGE sueltos
  let recommendsRegrouping = false;
  let regroupingReason: string | undefined;

  const imagePosts = posts.filter((p) => p.type === "IMAGE" && p.mediaCount === 1);
  if (imagePosts.length >= 5 && images >= 6) {
    // Buscar prefijos comunes en sourceFolderName
    const folderNames = imagePosts.map((p) => p.sourceFolderName);
    const commonPrefix = findCommonPrefix(folderNames);
    if (commonPrefix.length >= 3) {
      recommendsRegrouping = true;
      regroupingReason = `Detecté ${imagePosts.length} posts tipo IMAGE sueltos cuyos nombres empiezan por "${commonPrefix}*" — probablemente forman parte de carruseles. Voy a reagrupar con visión IA.`;
    } else if (imagePosts.length >= 8) {
      // Muchos sueltos sin prefijo común claro: igual sospechoso
      recommendsRegrouping = true;
      regroupingReason = `Detecté ${imagePosts.length} posts tipo IMAGE sueltos sin estructura clara. Reagrupo con visión IA para detectar carruseles por coherencia visual.`;
    }
  }

  return {
    totalFiles: batch.totalPosts ?? posts.length,
    images,
    videos,
    captions,
    posts,
    suggestions,
    recommendsRegrouping,
    regroupingReason,
  };
};

/**
 * Encuentra el prefijo común más largo de un array de strings.
 * Útil para detectar agrupamientos no obvios (e.g. todos los nombres
 * empiezan por "campana_" pero salieron como posts separados).
 */
function findCommonPrefix(strs: string[]): string {
  if (strs.length === 0) return "";
  if (strs.length === 1) return strs[0];
  let prefix = strs[0];
  for (const s of strs.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < s.length && prefix[i] === s[i]) i++;
    prefix = prefix.slice(0, i);
    if (prefix.length === 0) return "";
  }
  return prefix;
}

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

  // Validación de fecha: si el LLM propone una fecha pasada (alucinación
  // común porque no tiene acceso a la fecha real), forzamos próximo día válido.
  let startDate: Date;
  if (input.startDate) {
    const parsed = new Date(input.startDate);
    const minStart = new Date(Date.now() + 60 * 60 * 1000); // mínimo: en 1h
    if (isNaN(parsed.getTime())) {
      // Fecha inválida → mañana 10am
      startDate = new Date(Date.now() + 24 * 3600 * 1000);
      startDate.setHours(10, 0, 0, 0);
    } else if (parsed < minStart) {
      // Fecha pasada → mover al siguiente DÍA DE LA SEMANA + hora pedidos
      // Si el LLM dijo "viernes 11am" y ya pasó, queremos el SIGUIENTE viernes 11am
      startDate = new Date(parsed);
      while (startDate < minStart) {
        startDate.setDate(startDate.getDate() + 7);
      }
    } else {
      startDate = parsed;
    }
  } else {
    startDate = new Date(Date.now() + 24 * 3600 * 1000);
    startDate.setHours(10, 0, 0, 0);
  }
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

// ─── Tool: analyze_format_compatibility ─────────────────────────────────
export const analyzeFormatCompatibilityTool: ToolDefinition = {
  name: "analyze_format_compatibility",
  description:
    "Analiza si un PostDraft es compatible con cada plataforma social. Devuelve qué plataformas son recomendadas y qué problemas hay (formato incorrecto, aspect ratio malo, duración fuera de rango). Úsalo cuando el usuario pregunta '¿en qué plataformas puedo subir esto?', '¿esto va bien en TikTok?' o cuando detectes que está intentando publicar algo que va a quedar mal (imagen horizontal en TikTok, video largo en YouTube Shorts, etc.). Sé honesto y desaconseja explícitamente las plataformas donde no encajará.",
  parameters: {
    type: "object",
    properties: {
      postId: {
        type: "string",
        description: "ID del PostDraft a analizar",
      },
      platforms: {
        type: "array",
        items: {
          type: "string",
          enum: ["INSTAGRAM", "FACEBOOK", "TIKTOK", "LINKEDIN", "YOUTUBE", "PINTEREST"],
        },
        description:
          "Plataformas a evaluar. Si vacío, evalúa todas las disponibles.",
      },
    },
    required: ["postId"],
  },
};

export const analyzeFormatCompatibilityHandler: ToolHandler<
  {
    postId: string;
    platforms?: Array<
      "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "LINKEDIN" | "YOUTUBE" | "PINTEREST"
    >;
  },
  {
    postId: string;
    summary: {
      recommended: string[];
      avoid: string[];
      adjust: string[];
    };
    reports: Array<{
      platform: string;
      recommended: boolean;
      issues: Array<{
        severity: "blocker" | "warning" | "tip";
        message: string;
        recommendation?: string;
      }>;
    }>;
  }
> = async (input, ctx) => {
  const { analyzePostCompatibility } = await import("@/lib/social/format-rules");

  const draft = await db.postDraft.findFirst({
    where: { id: input.postId, businessId: ctx.businessId },
    include: { mediaAssets: true },
  });
  if (!draft) {
    throw new Error(`PostDraft ${input.postId} no encontrado`);
  }

  const reports = analyzePostCompatibility(
    {
      postType: draft.postType,
      caption: draft.caption,
      hasCaption: draft.caption.length > 0,
      mediaAssets: draft.mediaAssets.map((m) => ({
        mimeType: m.mimeType,
        width: m.width,
        height: m.height,
        durationSec: m.durationSec,
        fileSize: m.fileSize,
      })),
    },
    input.platforms,
  );

  const recommended = reports.filter((r) => r.recommended).map((r) => r.platform);
  const avoid = reports
    .filter((r) => r.blockerCount > 0)
    .map((r) => r.platform);
  const adjust = reports
    .filter((r) => r.blockerCount === 0 && r.warningCount > 0)
    .map((r) => r.platform);

  return {
    postId: input.postId,
    summary: { recommended, avoid, adjust },
    reports: reports.map((r) => ({
      platform: r.platform,
      recommended: r.recommended,
      issues: r.issues.map((i) => ({
        severity: i.severity,
        message: i.message,
        recommendation: i.recommendation,
      })),
    })),
  };
};

// ─── Tool: regroup_batch_with_ai ─────────────────────────────────────
export const regroupBatchTool: ToolDefinition = {
  name: "regroup_batch_with_ai",
  description:
    "Reagrupa los posts de un batch usando análisis visual (gpt-4o-mini Vision). Útil cuando la heurística inicial agrupó mal por nombres: imágenes que pertenecen al mismo carrusel quedaron como posts separados, o imágenes de campañas distintas se metieron en un mismo carrusel. Detecta coherencia visual (paleta, estilo, secuencia) y reagrupa. Llámalo cuando el user pregunta '¿podrías agrupar mejor las imágenes?' o cuando ves en analyze_batch que hay muchos posts tipo IMAGE sueltos que parecen relacionados. Coste interno ~$0.005-0.015. Cancela los drafts antiguos y crea nuevos.",
  parameters: {
    type: "object",
    properties: {
      batchId: {
        type: "string",
        description: "ID del UploadBatch a reagrupar",
      },
    },
    required: ["batchId"],
  },
};

export const regroupBatchHandler: ToolHandler<
  { batchId: string },
  {
    regrouped: number;
    cancelled: number;
    warnings: string[];
    groups: Array<{
      groupKey: string;
      type: string;
      reason: string;
      filenames: string[];
      captionDraft?: string;
    }>;
  }
> = async (input, ctx) => {
  // Llamamos al endpoint internamente reutilizando la lógica
  const { groupWithVision } = await import("@/services/parser/smart-grouper");
  const { hashSHA256 } = await import("@/lib/crypto");
  const { v4: uuidv4 } = await import("uuid");

  const batch = await db.uploadBatch.findFirst({
    where: { id: input.batchId, businessId: ctx.businessId },
    include: {
      postDrafts: {
        where: { status: { in: ["DRAFT", "VALIDATED", "READY"] } },
        include: { mediaAssets: true },
      },
    },
  });
  if (!batch) {
    throw new Error(`Batch ${input.batchId} no encontrado`);
  }

  const images = batch.postDrafts
    .flatMap((d) => d.mediaAssets.map((m) => ({ draft: d, asset: m })))
    .filter(({ asset }) => asset.mimeType.startsWith("image/"));

  if (images.length === 0) {
    return {
      regrouped: 0,
      cancelled: 0,
      warnings: ["No hay imágenes en el batch (solo videos o vacío)."],
      groups: [],
    };
  }

  if (images.length > 20) {
    return {
      regrouped: 0,
      cancelled: 0,
      warnings: [
        `El batch tiene ${images.length} imágenes — máx 20 para reagrupamiento. El user debe subir en lotes más pequeños.`,
      ],
      groups: [],
    };
  }

  const visionResult = await groupWithVision({
    images: images.map(({ asset }) => ({
      url: asset.storageUrl,
      filename: asset.originalFilename,
    })),
  });

  if (visionResult.groups.length === 0) {
    return {
      regrouped: 0,
      cancelled: 0,
      warnings: visionResult.warnings,
      groups: [],
    };
  }

  const assetByFilename = new Map(
    images.map(({ asset, draft }) => [asset.originalFilename, { asset, draft }]),
  );

  const newGroups: Array<{
    groupKey: string;
    type: string;
    reason: string;
    filenames: string[];
    captionDraft?: string;
  }> = [];
  const draftsToCancel = new Set<string>();

  for (const group of visionResult.groups) {
    const groupAssets = group.filenames
      .map((fn) => assetByFilename.get(fn))
      .filter((x): x is NonNullable<typeof x> => !!x);

    if (groupAssets.length === 0) continue;

    for (const { draft } of groupAssets) {
      draftsToCancel.add(draft.id);
    }

    const detectedType =
      groupAssets.length === 1
        ? "IMAGE"
        : group.detectedType === "carousel"
          ? "CAROUSEL"
          : "IMAGE";

    const newDraftId = uuidv4();
    const caption = group.captionDraft ?? "";
    const sortedHashes = groupAssets
      .map(({ asset }) => asset.fileHash)
      .sort()
      .join("|");
    const contentHash = hashSHA256(`${caption}|${sortedHashes}`);

    await db.postDraft.create({
      data: {
        id: newDraftId,
        businessId: ctx.businessId,
        batchId: batch.id,
        postType: detectedType as "IMAGE" | "CAROUSEL" | "REEL",
        publishAt: groupAssets[0].draft.publishAt,
        timezone: groupAssets[0].draft.timezone,
        caption,
        captionHash: hashSHA256(caption),
        contentHash,
        idempotencyKey: uuidv4(),
        status: "VALIDATED",
        sourceFolderName: group.groupKey,
        mediaAssets: {
          create: groupAssets.map(({ asset }, i) => ({
            originalFilename: asset.originalFilename,
            storagePath: asset.storagePath,
            storageUrl: asset.storageUrl,
            mimeType: asset.mimeType,
            fileSize: asset.fileSize,
            fileHash: asset.fileHash,
            width: asset.width,
            height: asset.height,
            durationSec: asset.durationSec,
            sortOrder: i,
          })),
        },
      },
    });

    newGroups.push({
      groupKey: group.groupKey,
      type: detectedType,
      reason: group.reason,
      filenames: group.filenames,
      captionDraft: group.captionDraft,
    });
  }

  if (draftsToCancel.size > 0) {
    await db.postDraft.updateMany({
      where: { id: { in: Array.from(draftsToCancel) } },
      data: { status: "CANCELLED", lastError: "Reemplazado por reagrupamiento IA" },
    });
  }

  return {
    regrouped: newGroups.length,
    cancelled: draftsToCancel.size,
    warnings: visionResult.warnings,
    groups: newGroups,
  };
};

// ─── Tool: confirm_batch_schedule ──────────────────────────────────────
export const confirmBatchScheduleTool: ToolDefinition = {
  name: "confirm_batch_schedule",
  description:
    "Aplica un calendario de publicación a un batch: actualiza publishAt, targetPlatforms y captions de cada PostDraft, y crea los jobs en BullMQ para que se publiquen automáticamente. Llámalo SOLO cuando el user haya confirmado expresamente que quiere publicar (ej. 'sí, programa', 'adelante', 'dale, publica'). Recibe el schedule propuesto por suggest_schedule (modificado o no por el user). Tras llamarlo, los posts pasan a SCHEDULED y se publican solos cuando llegue su hora — el user no tiene que hacer nada más.",
  parameters: {
    type: "object",
    properties: {
      batchId: { type: "string" },
      schedule: {
        type: "array",
        description:
          "Array con la programación final (puede ser el resultado de suggest_schedule o ajustado por el user)",
        items: {
          type: "object",
          properties: {
            postDraftId: { type: "string" },
            proposedAt: {
              type: "string",
              description: "ISO 8601 datetime con tz cuando publicar",
            },
            platforms: {
              type: "array",
              items: {
                type: "string",
                enum: ["instagram", "facebook", "tiktok", "linkedin", "youtube", "pinterest"],
              },
              description: "Plataformas en las que publicar este post",
            },
            caption: {
              type: "string",
              description:
                "(opcional) Caption final si el user lo aprobó o lo modificó",
            },
          },
          required: ["postDraftId", "proposedAt", "platforms"],
        },
      },
    },
    required: ["batchId", "schedule"],
  },
};

export const confirmBatchScheduleHandler: ToolHandler<
  {
    batchId: string;
    schedule: Array<{
      postDraftId: string;
      proposedAt: string;
      platforms: string[];
      caption?: string;
    }>;
  },
  {
    scheduled: number;
    failed: number;
    errors: string[];
  }
> = async (input, ctx) => {
  const { confirmBatch } = await import("@/services/scheduler/batch-processor");
  const { hashSHA256 } = await import("@/lib/crypto");

  // Verificar batch + ownership
  const batch = await db.uploadBatch.findFirst({
    where: { id: input.batchId, businessId: ctx.businessId },
    select: { id: true, status: true },
  });
  if (!batch) throw new Error(`Batch ${input.batchId} no encontrado`);

  const errors: string[] = [];

  // Mapear plataformas social vs Meta
  const META_PLATFORMS = new Set(["instagram", "facebook"]);
  const SOCIAL_PLATFORMS = new Set([
    "tiktok",
    "linkedin",
    "youtube",
    "pinterest",
  ]);

  // Aplicar cambios a cada draft
  for (const item of input.schedule) {
    try {
      const draft = await db.postDraft.findFirst({
        where: { id: item.postDraftId, businessId: ctx.businessId },
        select: { id: true, status: true },
      });
      if (!draft) {
        errors.push(`Draft ${item.postDraftId} no encontrado`);
        continue;
      }
      if (!["DRAFT", "VALIDATED", "READY"].includes(draft.status)) {
        errors.push(
          `Draft ${item.postDraftId} ya está en estado ${draft.status} — no se puede reprogramar`,
        );
        continue;
      }

      let publishAt = new Date(item.proposedAt);
      if (isNaN(publishAt.getTime())) {
        errors.push(
          `Draft ${item.postDraftId}: fecha inválida (${item.proposedAt})`,
        );
        continue;
      }
      // Si la fecha es pasada, forzamos próxima ocurrencia +7 días.
      // Esto previene los típicos casos donde el LLM propone "viernes 11am"
      // pero el viernes ya pasó. NO falla — la pone para el próximo viernes.
      const minFuture = new Date(Date.now() + 5 * 60 * 1000);
      while (publishAt < minFuture) {
        publishAt = new Date(publishAt.getTime() + 7 * 24 * 3600 * 1000);
      }

      const platforms = item.platforms.map((p) => p.toLowerCase());
      const publishToMeta = platforms.some((p) => META_PLATFORMS.has(p));
      const targetPlatforms = platforms
        .filter((p) => SOCIAL_PLATFORMS.has(p))
        .map((p) => p.toUpperCase()) as (
        | "TIKTOK"
        | "LINKEDIN"
        | "YOUTUBE"
        | "PINTEREST"
      )[];

      const updates: Record<string, unknown> = {
        publishAt,
        publishToMeta,
        targetPlatforms,
      };
      if (item.caption !== undefined) {
        updates.caption = item.caption;
        updates.captionHash = hashSHA256(item.caption);
      }

      await db.postDraft.update({
        where: { id: item.postDraftId },
        data: updates,
      });
    } catch (err) {
      errors.push(
        `Draft ${item.postDraftId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Lanzar confirmBatch para crear los jobs en BullMQ
  let scheduled = 0;
  let failed = 0;
  try {
    const result = await confirmBatch(input.batchId);
    scheduled = result.scheduled;
    failed = result.failed;
  } catch (err) {
    errors.push(
      `Error al confirmar batch: ${err instanceof Error ? err.message : String(err)}`,
    );
    failed = input.schedule.length;
  }

  return { scheduled, failed, errors };
};

// ─── Registry ──────────────────────────────────────────────────────────
export const TOOLS = {
  analyze_batch: { def: analyzeBatchTool, handler: analyzeBatchHandler },
  analyze_media_with_vision: { def: analyzeMediaTool, handler: analyzeMediaHandler },
  suggest_schedule: { def: suggestScheduleTool, handler: suggestScheduleHandler },
  confirm_batch_schedule: {
    def: confirmBatchScheduleTool,
    handler: confirmBatchScheduleHandler,
  },
  recommend_posting_time: {
    def: recommendPostingTimeTool,
    handler: recommendPostingTimeHandler,
  },
  update_brand_profile: {
    def: updateBrandProfileTool,
    handler: updateBrandProfileHandler,
  },
  analyze_format_compatibility: {
    def: analyzeFormatCompatibilityTool,
    handler: analyzeFormatCompatibilityHandler,
  },
  regroup_batch_with_ai: {
    def: regroupBatchTool,
    handler: regroupBatchHandler,
  },
  analyze_uploaded_batch: {
    def: analyzeUploadedBatchTool,
    handler: analyzeUploadedBatchHandler,
  },
  propose_schedule: {
    def: proposeScheduleTool,
    handler: proposeScheduleHandler,
  },
  apply_schedule: {
    def: applyScheduleTool,
    handler: applyScheduleHandler,
  },
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
