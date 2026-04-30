/**
 * POST /api/ai/chat
 *
 * Chat conversacional con la IA editorial. Stream SSE con eventos:
 *   event: text       → { delta: string }
 *   event: tool_call  → { tool: string, input: object }
 *   event: tool_result → { tool: string, output: object }
 *   event: done       → { messageId: string }
 *   event: error      → { error: string }
 *
 * Body:
 *   {
 *     chatId?: string,        // si null, crea uno nuevo
 *     businessId: string,
 *     message: string,        // mensaje del usuario
 *     batchId?: string,       // contexto opcional: "estamos hablando de este batch"
 *   }
 *
 * Flujo:
 *   1. Carga/crea AiChat
 *   2. Carga BrandProfile + últimos posts publicados (contexto)
 *   3. Carga histórico del chat
 *   4. Llama Llama 3.3 70B vía Together con tools available
 *   5. Si llama herramienta, ejecuta + reincorpora resultado al loop
 *   6. Stream cada delta + tool result al cliente
 *   7. Persiste mensajes en AiChatMessage
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  getTogether,
  isTogetherAvailable,
  MODEL_LLAMA_33_70B,
} from "@/lib/ai/together";
import { loadBrandVoiceContext } from "@/lib/ai/brand-voice";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import {
  getToolDefinitions,
  executeTool,
  type ToolContext,
} from "@/lib/ai/tools/registry";

const bodySchema = z.object({
  chatId: z.string().optional(),
  businessId: z.string().min(1),
  message: z.string().min(1).max(4000),
  batchId: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 6; // máximo número de tool-call rounds en una respuesta

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { businessId, message, batchId } = parsed.data;
  let chatId = parsed.data.chatId;

  if (!isTogetherAvailable()) {
    return jsonError("AI no disponible. Configura TOGETHER_API_KEY.", 503);
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) return jsonError("Business not found", 404);

  const rl = await checkAiRateLimit(businessId);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit", resetAt: rl.resetAt }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  // Crear/cargar chat
  if (!chatId) {
    const chat = await db.aiChat.create({
      data: {
        adminUserId: session.adminUserId,
        businessId,
        batchId: batchId ?? null,
        title: message.slice(0, 60),
      },
      select: { id: true },
    });
    chatId = chat.id;
  } else {
    const exists = await db.aiChat.findFirst({
      where: { id: chatId, adminUserId: session.adminUserId },
      select: { id: true },
    });
    if (!exists) return jsonError("Chat not found", 404);
  }

  // Persistir mensaje del usuario
  await db.aiChatMessage.create({
    data: { chatId, role: "user", content: message },
  });

  // Cargar histórico (últimos 20 mensajes)
  const history = await db.aiChatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { role: true, content: true, toolCalls: true },
  });

  // Cargar contexto de marca
  const ctx = await loadBrandVoiceContext(businessId);
  const systemPrompt = buildSystemPrompt(ctx, batchId);

  const client = getTogether();
  if (!client) return jsonError("Together no configurado", 503);

  const toolCtx: ToolContext = {
    adminUserId: session.adminUserId,
    businessId,
    chatId: chatId,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      const finalChatId = chatId as string;

      try {
        send("chat", { chatId: finalChatId });

        const messages: Array<{
          role: "system" | "user" | "assistant" | "tool";
          content: string;
          tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
          tool_call_id?: string;
        }> = [
          { role: "system", content: systemPrompt },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant" | "tool",
            content: m.content,
          })),
        ];

        const tools = getToolDefinitions().map((t) => ({
          type: "function" as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));

        let finalAssistantText = "";
        const toolCallsLog: Array<{ name: string; input: unknown; output: unknown }> = [];

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const response = await client.chat.completions.create({
            model: MODEL_LLAMA_33_70B,
            messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
            tools,
            temperature: 0.7,
            max_tokens: 1500,
          });

          const choice = response.choices?.[0];
          const msg = choice?.message;
          if (!msg) {
            send("error", { error: "No assistant response" });
            break;
          }

          const content = msg.content ?? "";
          const calls = msg.tool_calls ?? [];

          if (content) {
            // Stream el contenido como un solo delta (Together no streamea con tool calls)
            send("text", { delta: content });
            finalAssistantText += content;
          }

          if (calls.length === 0) {
            // No tool calls — respuesta final
            break;
          }

          // Ejecutar tool calls
          messages.push({
            role: "assistant",
            content,
            tool_calls: calls.map((c) => ({
              id: c.id ?? `call_${Math.random().toString(36).slice(2)}`,
              type: "function" as const,
              function: {
                name: c.function.name,
                arguments: c.function.arguments,
              },
            })),
          });

          for (const call of calls) {
            let input: unknown = {};
            try {
              input = JSON.parse(call.function.arguments || "{}");
            } catch {
              input = {};
            }
            send("tool_call", { tool: call.function.name, input });
            try {
              const output = await executeTool(call.function.name, input, toolCtx);
              send("tool_result", { tool: call.function.name, output });
              toolCallsLog.push({ name: call.function.name, input, output });
              messages.push({
                role: "tool",
                tool_call_id: call.id ?? "",
                content: JSON.stringify(output),
              });
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : "tool failed";
              send("tool_result", { tool: call.function.name, error: errMsg });
              messages.push({
                role: "tool",
                tool_call_id: call.id ?? "",
                content: JSON.stringify({ error: errMsg }),
              });
            }
          }
        }

        // Persistir respuesta del assistant
        await db.aiChatMessage.create({
          data: {
            chatId: finalChatId,
            role: "assistant",
            content: finalAssistantText,
            toolCalls: toolCallsLog.length
              ? (toolCallsLog as unknown as object)
              : undefined,
          },
        });

        await db.aiChat.update({
          where: { id: finalChatId },
          data: { updatedAt: new Date() },
        });

        send("done", { chatId: finalChatId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send("error", { error: message });
        console.error("[ai/chat] failed:", err);
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

function buildSystemPrompt(
  ctx: { businessName: string; profile?: { niche?: string; tone?: string; targetAudience?: string; taboos?: string[]; notes?: string }; examples: string[] },
  batchId?: string,
): string {
  const lines = [
    `Eres el asistente editorial de ${ctx.businessName} en AutoPost.`,
    "",
    "Tu trabajo:",
    "- Ayudar al usuario a programar contenido en redes sociales",
    "- Analizar batches subidos cuando los mencione (usa el tool analyze_batch)",
    "- Sugerir captions y hashtags con la voz de la marca",
    "- Recomendar mejores horarios por plataforma + nicho (usa recommend_posting_time)",
    "- Proponer calendarios completos (usa suggest_schedule)",
    "- Aprender sobre la marca conversando (usa update_brand_profile cuando el usuario te dé info nueva)",
    "",
    "Reglas:",
    "- Habla en español natural, conciso, sin clichés de marketing",
    "- Si el usuario te da info sobre su marca (nicho, tono, audiencia, frases prohibidas), llama update_brand_profile para guardarla",
    "- Si pregunta por un batch específico (ID en su mensaje o si tienes uno en contexto), usa analyze_batch",
    "- No inventes datos: si no sabes algo, pregúntalo",
    "- Cuando propongas un schedule, llama suggest_schedule y luego pregunta si confirmar",
  ];

  if (ctx.profile) {
    lines.push("", "# Perfil de la marca");
    if (ctx.profile.niche) lines.push(`Nicho: ${ctx.profile.niche}`);
    if (ctx.profile.tone) lines.push(`Tono: ${ctx.profile.tone}`);
    if (ctx.profile.targetAudience) lines.push(`Audiencia: ${ctx.profile.targetAudience}`);
    if (ctx.profile.taboos?.length) lines.push(`Tabús: ${ctx.profile.taboos.join(", ")}`);
    if (ctx.profile.notes) lines.push(`Notas: ${ctx.profile.notes}`);
  }

  if (ctx.examples.length > 0) {
    lines.push(
      "",
      `# Ejemplos de captions publicados (${ctx.examples.length})`,
      "Aprende el tono pero NO copies frases textuales:",
      ...ctx.examples.slice(0, 5).map((c, i) => `${i + 1}. ${c.slice(0, 280)}`),
    );
  }

  if (batchId) {
    lines.push("", `# Contexto: el usuario está hablando del batch ${batchId}`);
    lines.push("Si menciona 'el batch' o 'la subida', refiere a ese ID.");
  }

  return lines.join("\n");
}
