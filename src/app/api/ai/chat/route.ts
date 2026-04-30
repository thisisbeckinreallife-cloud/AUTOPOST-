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
import { getOpenAI, isOpenAIAvailable, MODEL_CHAT } from "@/lib/ai/openai";
import { loadBrandVoiceContext } from "@/lib/ai/brand-voice";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import {
  getToolDefinitions,
  executeTool,
  type ToolContext,
} from "@/lib/ai/tools/registry";

const bodySchema = z.object({
  // .nullish() acepta string, undefined Y null — el cliente envía null la
  // primera vez (antes de tener un chatId asignado) y JSON serializa null,
  // no undefined. Sin nullish() Zod rechaza con "Expected string, received null"
  // → 400 "Validation" → la UI lo pintaba como burbuja vacía.
  chatId: z.string().nullish(),
  businessId: z.string().min(1),
  message: z.string().min(1).max(4000),
  batchId: z.string().nullish(),
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

  const { businessId, message } = parsed.data;
  // batchId puede venir como null/undefined; lo normalizamos a undefined
  // para que el resto del código (que asume string|undefined) no rompa.
  const batchId: string | undefined = parsed.data.batchId ?? undefined;
  let chatId: string | undefined = parsed.data.chatId ?? undefined;

  // Preferimos OpenAI gpt-4o-mini (más barato + tool calling fiable).
  // Fallback a Llama 3.3 70B vía Together si OpenAI no está configurado.
  const useOpenAI = isOpenAIAvailable();
  if (!useOpenAI && !isTogetherAvailable()) {
    return jsonError(
      "AI no disponible. Configura OPENAI_API_KEY o TOGETHER_API_KEY.",
      503,
    );
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

  // SDK OpenAI y Together son intercambiables — comparten interface
  // chat.completions.create. Elegimos uno u otro y guardamos el modelo.
  const client = useOpenAI ? getOpenAI() : getTogether();
  const model = useOpenAI ? MODEL_CHAT : MODEL_LLAMA_33_70B;
  if (!client) return jsonError("Cliente IA no inicializado", 503);

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response = await (client as any).chat.completions.create({
            model,
            messages,
            tools,
            temperature: 0.7,
            max_tokens: 1500,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const choice = (response as any).choices?.[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = choice?.message as
            | {
                content?: string | null;
                tool_calls?: Array<{
                  id?: string;
                  function: { name: string; arguments: string };
                }>;
              }
            | undefined;
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

          // Lista de tools válidos
          const validToolNames = new Set(
            getToolDefinitions().map((t) => t.name),
          );

          for (const call of calls) {
            const toolName = call.function.name;
            let input: unknown = {};
            try {
              input = JSON.parse(call.function.arguments || "{}");
            } catch {
              input = {};
            }

            // 🛡 Si el LLM alucina un tool inexistente, NO lo enviamos como
            // tool_call al cliente (no queremos chips falsos en la UI).
            // En su lugar, devolvemos al modelo un tool_result con guidance
            // para que recupere y responda en texto.
            if (!validToolNames.has(toolName)) {
              const guidance = `El tool "${toolName}" NO existe. Tools válidos: ${Array.from(validToolNames).join(", ")}. Responde al usuario en texto natural sin usar tools.`;
              messages.push({
                role: "tool",
                tool_call_id: call.id ?? "",
                content: JSON.stringify({ error: guidance }),
              });
              continue;
            }

            send("tool_call", { tool: toolName, input });
            try {
              const output = await executeTool(toolName, input, toolCtx);
              send("tool_result", { tool: toolName, output });
              toolCallsLog.push({ name: toolName, input, output });
              messages.push({
                role: "tool",
                tool_call_id: call.id ?? "",
                content: JSON.stringify(output),
              });
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : "tool failed";
              send("tool_result", { tool: toolName, error: errMsg });
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
        const rawMessage = err instanceof Error ? err.message : "Unknown error";
        const friendly = friendlyProviderError(rawMessage);
        send("error", { error: friendly, raw: rawMessage });
        console.error("[ai/chat] failed:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, no-transform, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      Pragma: "no-cache",
      Expires: "0",
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
    "# Quién eres",
    "Eres un editor senior con 15 años en agencias de social media. Hablas como un humano, no como un bot. Vas al grano. Das opiniones honestas — si una idea es mediocre, lo dices.",
    "",
    "# Cómo respondes",
    "- SIEMPRE responde primero en texto natural. La mayoría de preguntas no necesitan tools.",
    "- Solo invoca un tool cuando GENUINAMENTE necesites ejecutar una acción concreta (analizar un batch específico que el user mencionó por ID o que sabes que existe; guardar info nueva del perfil; analizar compatibilidad de un post real).",
    "- NUNCA inventes nombres de tools. Solo existen los listados en la sección 'Tools disponibles'.",
    "- Si el user pregunta algo conversacional ('¿puedo subir mi carpeta?', '¿qué formato uso?', '¿cuándo publico?'), respóndele directamente CON TEXTO, sin tool calls.",
    "- Habla en español natural, conciso, sin clichés tipo 'engagement', 'optimizar', 'maximizar alcance'.",
    "",
    "# Tools disponibles (úsalos solo cuando aplique)",
    "- `analyze_batch(batchId)` — solo si el user mencionó un batchId concreto o acaba de subir uno.",
    "- `suggest_schedule(...)` — solo cuando el user PIDE un calendario y ya hay un batch analizado.",
    "- `recommend_posting_time({platform, niche})` — solo si pregunta '¿cuándo publico en X?'.",
    "- `update_brand_profile({niche, tone, audience, taboos})` — cuando el user te DA info nueva. Llámalo INMEDIATAMENTE tras recibir esa info.",
    "- `analyze_format_compatibility({postId, platforms?})` — cuando el user pregunta '¿esto va bien en TikTok/IG/etc?', cuando muestra dudas sobre el formato, o cuando detectas que su post no encajará bien en alguna plataforma. Sé honesto: si el formato es inadecuado para una plataforma, dilo claramente y desaconséjala.",
    "",
    "# Cómo recomendar plataformas (CRÍTICO)",
    "Cuando el user pregunte por publicar algo o cuando veas que está a punto de publicar contenido que va a quedar mal en alguna plataforma, sé directo y honesto:",
    "- Si una imagen es horizontal y la quiere en TikTok → desaconséjalo: 'TikTok es vertical 9:16, una imagen horizontal va a quedar con bandas negras y la gente pasará de scroll. Mejor súbela a Instagram o LinkedIn.'",
    "- Si un video es muy largo (>60s) y la quiere en YouTube Shorts → desaconséjalo: 'Shorts solo acepta hasta 60s. Tu video pasa de eso. Considera publicarlo como video normal de YouTube o cortar.'",
    "- Si una imagen es cuadrada y la quiere en Pinterest → tip: 'Pinterest premia los pines verticales 2:3. Una imagen cuadrada se ve pero rinde mucho menos. Considera reencuadrar.'",
    "- Si el contenido NO encaja con la marca (formato incorrecto, calidad baja, ratio incorrecto) → dilo: 'Esto no va a generar buena imagen de marca en X plataforma porque...'",
    "Tu trabajo es protegerlos de publicar contenido que perjudique su marca. Llama `analyze_format_compatibility` cuando dudes.",
    "",
    "# Capacidades de upload",
    "El user puede subir un .zip directamente desde el chat con el botón 📎. Cuando suba, el sistema te enviará un mensaje sintético con el batchId. SIEMPRE confirma que lo recibiste, llama a `analyze_batch` con ese ID, y describe en LENGUAJE NATURAL qué encontraste (cuántos posts, qué tipos, ambigüedades). Después haz preguntas concretas para clarificar antes de proponer un calendario.",
    "",
    "# Cuando NO sabes algo",
    "Pregunta. No inventes datos, no inventes URLs, no inventes nombres de archivo. Si no tienes contexto suficiente, di '¿en qué batch?' o '¿qué plataformas te interesan?' antes de actuar.",
  ];

  // Detectar si el perfil está "vacío" (sin nicho ni tono ni audiencia) — caso primer uso
  const profileHasContent =
    ctx.profile &&
    (ctx.profile.niche || ctx.profile.tone || ctx.profile.targetAudience);

  if (profileHasContent && ctx.profile) {
    lines.push("", "# Perfil de la marca");
    if (ctx.profile.niche) lines.push(`Nicho: ${ctx.profile.niche}`);
    if (ctx.profile.tone) lines.push(`Tono: ${ctx.profile.tone}`);
    if (ctx.profile.targetAudience) lines.push(`Audiencia: ${ctx.profile.targetAudience}`);
    if (ctx.profile.taboos?.length) lines.push(`Tabús: ${ctx.profile.taboos.join(", ")}`);
    if (ctx.profile.notes) lines.push(`Notas: ${ctx.profile.notes}`);
  } else {
    // Sin perfil: pedirle al modelo que sea proactivo y ofrezca configurarlo
    lines.push(
      "",
      "# Perfil de la marca: vacío",
      "El usuario AÚN NO HA configurado su perfil de marca. En tu primera respuesta sustantiva (especialmente si es la primera del chat o si pide cualquier ayuda con captions/calendario/horarios):",
      "1. Pregúntale por su nicho concreto (ej: gastronomía mediterránea, fitness funcional, moda sostenible)",
      "2. Su tono de voz (ej: cercano, técnico, irreverente, premium)",
      "3. Su audiencia objetivo (edad, intereses, plataforma principal)",
      "4. Frases o palabras que NO quiere usar (tabús)",
      "Cuando te lo diga, llama update_brand_profile inmediatamente para guardarlo. No insistas si dice que no o que prefiere ir post a post — respeta su preferencia.",
    );
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

/**
 * Convierte errores crudos de los proveedores (Together.AI, Anthropic) en
 * mensajes legibles para mostrar al user. Detecta los casos comunes:
 * créditos agotados, rate limit, modelo no disponible, etc.
 */
function friendlyProviderError(raw: string): string {
  const lower = raw.toLowerCase();

  // Together.AI / Anthropic — créditos agotados
  if (
    lower.includes("credit_limit") ||
    lower.includes("credit limit exceeded") ||
    lower.includes("insufficient_quota") ||
    lower.includes("billing")
  ) {
    return "El servicio de IA está sin créditos. El admin de AutoPost debe recargar la cuenta de Together.AI (https://api.together.ai/settings/billing) o Anthropic. Inténtalo de nuevo en unos minutos.";
  }

  // Rate limit
  if (lower.includes("rate") && lower.includes("limit")) {
    return "Demasiadas peticiones a la IA en poco tiempo. Espera unos segundos e inténtalo de nuevo.";
  }

  // Auth de proveedor
  if (
    lower.includes("invalid api key") ||
    lower.includes("401") ||
    lower.includes("unauthorized")
  ) {
    return "El admin de AutoPost debe revisar la API key del proveedor de IA — está caducada o es inválida.";
  }

  // Modelo no encontrado
  if (lower.includes("model") && (lower.includes("not found") || lower.includes("does not exist"))) {
    return "El modelo de IA configurado ya no está disponible. El admin debe actualizar la configuración.";
  }

  // Timeout
  if (lower.includes("timeout") || lower.includes("etimedout")) {
    return "La IA tardó demasiado en responder. Inténtalo de nuevo — si persiste, prueba con un mensaje más corto.";
  }

  // Default — al menos cortamos el JSON crudo
  const safe = raw.length > 200 ? raw.slice(0, 200) + "…" : raw;
  return `La IA no pudo responder: ${safe}`;
}
