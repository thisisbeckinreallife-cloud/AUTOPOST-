/**
 * POST /api/ai/caption
 *
 * Genera un caption editorial en streaming (SSE).
 *
 * Provider routing:
 *   - Si ANTHROPIC_API_KEY presente → Claude Sonnet 4.5 con cache_control
 *     ephemeral (calidad gold standard, regens 1.3×)
 *   - Si solo TOGETHER_API_KEY → Llama 3.3 70B vía Together (6× más barato,
 *     calidad 85% del Claude, regens 2×)
 *   - Si ninguna → 503
 *
 * Body:
 *   {
 *     businessId: string,
 *     brief: string,
 *     channel?: "feed" | "reel" | "story",
 *     length?: "short" | "medium" | "long",
 *   }
 *
 * Respuesta: SSE con eventos chunk / usage / done / error.
 * Auth: requireSession.
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
  isTogetherAvailable,
  llamaChat,
  MODEL_LLAMA_33_70B,
} from "@/lib/ai/together";
import {
  loadBrandVoiceContext,
  buildCaptionSystemBlocks,
} from "@/lib/ai/brand-voice";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";

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

  // 3. Provider routing — Anthropic preferido, Together como fallback
  const anthropicClient = getAnthropic();
  const useAnthropic = !!anthropicClient;
  const useTogether = !useAnthropic && isTogetherAvailable();
  if (!useAnthropic && !useTogether) {
    return jsonError(
      "AI no disponible. Configura ANTHROPIC_API_KEY o TOGETHER_API_KEY.",
      503,
    );
  }
  const provider = useAnthropic ? "anthropic" : "together";
  const model = useAnthropic ? MODEL_CAPTION : MODEL_LLAMA_33_70B;

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
        let finalText = "";
        let usage = {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
        };
        let costUsd = 0;

        if (useAnthropic && anthropicClient) {
          // Path A: Claude Sonnet con streaming + cache_control
          const messageStream = anthropicClient.messages.stream({
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
          finalText =
            fullText ||
            final.content
              .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
              .map((b) => b.text)
              .join("");
          usage = extractUsage(final.usage);
          costUsd = computeCostUsd(MODEL_CAPTION, usage);
        } else {
          // Path B: Llama 3.3 vía Together (sin streaming nativo en este SDK,
          // emitimos chunks artificiales tras la respuesta para mantener UX).
          const flatSystem = system
            .map((b) => (b.type === "text" ? b.text : ""))
            .filter(Boolean)
            .join("\n\n");
          const llamaResp = await llamaChat({
            messages: [
              { role: "system", content: flatSystem },
              { role: "user", content: userMessage },
            ],
            model: MODEL_LLAMA_33_70B,
            maxTokens: 600,
            temperature: 0.7,
          });
          finalText = llamaResp.text;
          // Stream artificial: enviar palabras una a una con micro-delay
          // para que el typewriter del front no se sienta abrupto.
          const words = finalText.split(/(\s+)/);
          for (const w of words) {
            if (w) {
              send("chunk", { text: w });
              // Yield al event loop sin bloquear demasiado
              await new Promise((r) => setTimeout(r, 6));
            }
          }
          usage = {
            inputTokens: llamaResp.usage.inputTokens,
            outputTokens: llamaResp.usage.outputTokens,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
          };
          costUsd = llamaResp.costUsd;
        }

        send("usage", {
          ...usage,
          costUsd,
          model,
          provider,
        });
        send("done", { text: finalText });

        // Audit log (AiUsage se eliminó en el pivot)
        await db.auditLog
          .create({
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
          })
          .catch(() => {});
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
