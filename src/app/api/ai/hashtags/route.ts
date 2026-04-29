/**
 * POST /api/ai/hashtags
 *
 * Genera hashtags categorizados (primary/secondary) usando Claude Haiku 4.5.
 * No es streaming — la respuesta es JSON one-shot.
 *
 * Body:
 *   {
 *     businessId: string,
 *     caption: string,           // caption ya escrito al que añadir hashtags
 *   }
 *
 * Response 200:
 *   {
 *     primary: string[],         // 8 hashtags de nicho
 *     secondary: string[],       // 12 hashtags de cola larga
 *     usage: { inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, costUsd }
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  getAnthropic,
  computeCostUsd,
  extractUsage,
  MODEL_HASHTAGS,
} from "@/lib/ai/anthropic";
import {
  loadBrandVoiceContext,
  buildHashtagSystemBlocks,
} from "@/lib/ai/brand-voice";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";

const bodySchema = z.object({
  businessId: z.string().min(1),
  caption: z.string().min(3).max(2200),
});

const hashtagResponseSchema = z.object({
  primary: z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u)).min(1).max(15),
  secondary: z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u)).min(1).max(20),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { businessId, caption } = parsed.data;

  const client = getAnthropic();
  if (!client) {
    return NextResponse.json(
      { error: "AI temporarily unavailable. Configure ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

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

  const ctx = await loadBrandVoiceContext(businessId);
  const system = buildHashtagSystemBlocks(ctx);

  try {
    const response = await client.messages.create({
      model: MODEL_HASHTAGS,
      max_tokens: 600,
      system,
      messages: [
        {
          role: "user",
          content: `Caption del post:\n\n${caption}\n\nDevuélveme el JSON con primary y secondary.`,
        },
      ],
    });

    const usage = extractUsage(response.usage);
    const costUsd = computeCostUsd(MODEL_HASHTAGS, usage);

    // Extract JSON from text blocks
    const text = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const jsonText = extractJson(text);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "AI response was not valid JSON", raw: text },
        { status: 502 },
      );
    }

    const validated = hashtagResponseSchema.safeParse(parsedJson);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "AI response failed schema validation",
          details: validated.error.flatten(),
          raw: parsedJson,
        },
        { status: 502 },
      );
    }

    // Persist usage + audit (don't block response on failure)
    await Promise.allSettled([
      db.aiUsage.create({
        data: {
          businessId,
          type: "hashtags",
          model: MODEL_HASHTAGS,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheReadTokens: usage.cacheReadTokens,
          cacheCreationTokens: usage.cacheCreationTokens,
          costUsd,
        },
      }),
      db.auditLog.create({
        data: {
          businessId,
          adminUserId: session.adminUserId,
          action: "AI_HASHTAGS_GENERATED",
          entityType: "Business",
          entityId: businessId,
          detail: {
            captionLength: caption.length,
            primaryCount: validated.data.primary.length,
            secondaryCount: validated.data.secondary.length,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cacheReadTokens: usage.cacheReadTokens,
            cacheCreationTokens: usage.cacheCreationTokens,
            costUsd,
          },
        },
      }),
    ]);

    return NextResponse.json({
      ...validated.data,
      usage: { ...usage, costUsd, model: MODEL_HASHTAGS },
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Anthropic rate limit. Reintenta en unos segundos." },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: 502 },
      );
    }
    console.error("[ai/hashtags] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Extracts a JSON object from a string that may contain prose around it.
 * Handles "```json\n{...}\n```", trailing text, etc.
 */
function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fence) return fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}
