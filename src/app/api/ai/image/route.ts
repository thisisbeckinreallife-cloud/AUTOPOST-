/**
 * POST /api/ai/image
 *
 * Genera 1+ imágenes con FLUX (schnell/dev/pro) vía Together.AI.
 * Descuenta créditos según calidad seleccionada.
 *
 * Body:
 *   {
 *     businessId: string,
 *     prompt: string,
 *     model?: "schnell" | "dev" | "pro",     // default "dev"
 *     aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9",  // default "1:1"
 *     count?: 1 | 2 | 3 | 4,                  // default 1
 *     negativePrompt?: string,
 *     seed?: number,
 *   }
 *
 * Response 200:
 *   {
 *     images: [{url, width, height}],
 *     model: string,
 *     costUsd: number,
 *     remainingCredits: {monthly, addon, total},
 *     creditsCost: number,
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { consumeCredit, refundCredit } from "@/lib/ai/credits";
import {
  generateImage,
  isTogetherAvailable,
  MODEL_FLUX_SCHNELL,
  MODEL_FLUX_DEV,
  MODEL_FLUX_PRO,
  type FluxModel,
} from "@/lib/ai/together";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import type { AiActionType } from "@/lib/ai/plan-config";

const bodySchema = z.object({
  businessId: z.string().min(1),
  prompt: z.string().min(3).max(2000),
  model: z.enum(["schnell", "dev", "pro"]).default("dev"),
  aspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9"]).default("1:1"),
  count: z.number().int().min(1).max(4).default(1),
  negativePrompt: z.string().max(500).optional(),
  seed: z.number().int().optional(),
});

// Mapping del shorthand "model" del body al model ID + acción de créditos.
const MODEL_MAP: Record<
  "schnell" | "dev" | "pro",
  { fluxModel: FluxModel; action: AiActionType; perImageCredits: number }
> = {
  schnell: {
    fluxModel: MODEL_FLUX_SCHNELL,
    action: "image_schnell",
    perImageCredits: 1,
  },
  dev: {
    fluxModel: MODEL_FLUX_DEV,
    action: "image_dev",
    perImageCredits: 3,
  },
  pro: {
    fluxModel: MODEL_FLUX_PRO,
    action: "image_pro",
    perImageCredits: 5,
  },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Auth
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validation
  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { businessId, prompt, model, aspectRatio, count, negativePrompt, seed } =
    parsed.data;

  // Together availability
  if (!isTogetherAvailable()) {
    return NextResponse.json(
      {
        error:
          "Generación de imagen no disponible. Configura TOGETHER_API_KEY en Railway.",
      },
      { status: 503 },
    );
  }

  // Business check
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Rate limit
  const rl = await checkAiRateLimit(businessId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetAt: rl.resetAt },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  // Credit check + consume (cost = perImage × count)
  const config = MODEL_MAP[model];
  const totalCost = config.perImageCredits * count;
  const credit = await consumeCredit({
    adminUserId: session.adminUserId,
    action: config.action,
    businessId,
    costOverride: totalCost,
    provider: "together",
    model: config.fluxModel,
  });
  if (!credit.ok) {
    return NextResponse.json(
      {
        error: credit.error,
        errorCode: credit.errorCode,
        remaining: credit.remaining,
        availablePacks: credit.availablePacks,
      },
      { status: 402 },
    );
  }

  // Generate
  try {
    const result = await generateImage({
      prompt,
      model: config.fluxModel,
      aspectRatio,
      n: count,
      negativePrompt,
      seed,
    });

    // Audit log
    await db.auditLog
      .create({
        data: {
          businessId,
          adminUserId: session.adminUserId,
          action: "AI_IMAGE_GENERATED",
          entityType: "Business",
          entityId: businessId,
          detail: {
            promptLength: prompt.length,
            model: config.fluxModel,
            aspectRatio,
            count,
            costUsd: result.costUsd,
            creditsConsumed: totalCost,
          },
        },
      })
      .catch(() => {});

    return NextResponse.json({
      images: result.imageUrls.map((url) => ({
        url,
        width: result.width,
        height: result.height,
      })),
      model: config.fluxModel,
      costUsd: result.costUsd,
      remainingCredits: credit.remaining,
      creditsCost: totalCost,
    });
  } catch (err) {
    // Refund — la API de Together falló
    if (credit.generationId) {
      await refundCredit(
        credit.generationId,
        err instanceof Error ? err.message : "image gen failed",
      ).catch(() => {});
    }
    console.error("[ai/image] generation failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Generación falló: ${message}` },
      { status: 502 },
    );
  }
}
