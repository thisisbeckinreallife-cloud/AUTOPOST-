/**
 * POST /api/ai/caption
 *
 * Genera un caption editorial en streaming (SSE) usando Claude Sonnet 4.5
 * con el contexto de voz del negocio (últimos 30 captions publicados) cacheado
 * vía `cache_control: { type: "ephemeral" }`.
 *
 * Body:
 *   {
 *     businessId: string,
 *     brief: string,             // descripción del post a generar
 *     channel?: "feed" | "reel" | "story",
 *     length?: "short" | "medium" | "long",
 *   }
 *
 * Respuesta: SSE con eventos
 *   event: chunk      → data: { text: string }
 *   event: usage      → data: { inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, costUsd }
 *   event: done       → data: { text: string }   // texto completo final
 *   event: error      → data: { error: string }
 *
 * Auth: requireSession (admin login).
 * Rate limit: 10/min/business.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  getAnthropic,
  computeCostUsd,
  extractUsage,
  MODEL_CAPTION,
} from "@/lib/ai/anthropic";
import {
  loadBrandVoiceContext,
  buildCaptionSystemBlocks,
} from "@/lib/ai/brand-voice";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { consumeCredit, refundCredit } from "@/lib/ai/credits";

const bodySchema = z.object({
  businessId: z.string().min(1),
  brief: z.string().min(3).max(2000),
  channel: z.enum(["feed", "reel", "story"]).optional(),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Auth
  let session;
  try {
    session = await requireSession();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  // 2. Validation
  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { businessId, brief, channel, length } = parsed.data;

  // 3. SDK availability
  const client = getAnthropic();
  if (!client) {
    return jsonError("AI temporarily unavailable. Configure ANTHROPIC_API_KEY.", 503);
  }

  // 4. Business existence (no per-user ownership check yet — admin scope)
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) return jsonError("Business not found", 404);

  // 5. Rate limit
  const rl = await checkAiRateLimit(businessId);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        resetAt: rl.resetAt,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  // 5b. Credit check + consumo (1 crédito por caption)
  const credit = await consumeCredit({
    adminUserId: session.adminUserId,
    action: "caption",
    businessId,
    provider: "anthropic",
    model: MODEL_CAPTION,
  });
  if (!credit.ok) {
    return new Response(
      JSON.stringify({
        error: credit.error,
        errorCode: credit.errorCode,
        remaining: credit.remaining,
        availablePacks: credit.availablePacks,
      }),
      {
        status: 402,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // 6. Brand voice
  const ctx = await loadBrandVoiceContext(businessId);
  const system = buildCaptionSystemBlocks(ctx);

  // 7. User message
  const channelHint = channel ? `Canal: ${channel}.` : "";
  const lengthHint =
    length === "short"
      ? "Longitud: corta (1–2 frases)."
      : length === "long"
        ? "Longitud: larga (4–6 frases)."
        : "Longitud: media (2–4 frases).";

  const userMessage = `${channelHint} ${lengthHint}\n\nBrief:\n${brief}`.trim();

  // 8. Stream
  const adminUserId = session.adminUserId;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const messageStream = client.messages.stream({
          model: MODEL_CAPTION,
          max_tokens: 600,
          system,
          messages: [{ role: "user", content: userMessage }],
        });

        let fullText = "";

        messageStream.on("text", (text) => {
          fullText += text;
          send("chunk", { text });
        });

        const final = await messageStream.finalMessage();

        // Extract concatenated text from final blocks (defensive — also have fullText).
        const finalText =
          fullText ||
          final.content
            .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("");

        const usage = extractUsage(final.usage);
        const costUsd = computeCostUsd(MODEL_CAPTION, usage);

        send("usage", {
          ...usage,
          costUsd,
          model: MODEL_CAPTION,
          remainingCredits: credit.remaining,
          creditsCost: 1,
        });
        send("done", { text: finalText });

        // Persistencia paralela (no bloquea el cierre del stream del cliente).
        await Promise.allSettled([
          db.aiUsage.create({
            data: {
              businessId,
              type: "caption",
              model: MODEL_CAPTION,
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
              adminUserId,
              action: "AI_CAPTION_GENERATED",
              entityType: "Business",
              entityId: businessId,
              detail: {
                briefLength: brief.length,
                channel: channel ?? null,
                length,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                cacheReadTokens: usage.cacheReadTokens,
                cacheCreationTokens: usage.cacheCreationTokens,
                costUsd,
              },
            },
          }),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (err instanceof Anthropic.RateLimitError) {
          send("error", { error: "Anthropic rate limit. Reintenta en unos segundos." });
        } else if (err instanceof Anthropic.APIError) {
          send("error", { error: `API error: ${message}` });
        } else {
          send("error", { error: message });
        }
        console.error("[ai/caption] stream failed:", err);
        // Devolver el crédito al usuario porque la API falló.
        if (credit.generationId) {
          await refundCredit(credit.generationId, message).catch((e) =>
            console.error("[ai/caption] refund failed:", e),
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
