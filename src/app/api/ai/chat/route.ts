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

  const businessRecord = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, timezone: true },
  });
  if (!businessRecord) return jsonError("Business not found", 404);

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

  // Cargar últimos batches para inyectar al system prompt
  // (esto evita que el LLM invente batchIds inexistentes)
  const recentBatches = await db.uploadBatch.findMany({
    where: { businessId, status: { in: ["PARSED", "SCHEDULED", "PARTIALLY_SCHEDULED"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      originalFilename: true,
      status: true,
      totalPosts: true,
      validPosts: true,
      createdAt: true,
    },
  });

  const systemPrompt = buildSystemPrompt(ctx, batchId, {
    timezone: businessRecord.timezone ?? "Europe/Madrid",
    recentBatches: recentBatches.map((b) => ({
      id: b.id,
      filename: b.originalFilename,
      status: b.status,
      posts: b.validPosts ?? b.totalPosts ?? 0,
      createdAt: b.createdAt.toISOString(),
    })),
  });

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
        // Cache de tool calls de ESTE turno conversacional. Si el LLM
        // intenta llamar al mismo tool con los mismos args, devolvemos
        // el resultado cacheado en vez de re-ejecutar (ahorra coste +
        // evita la cascada de "Analizando batch · Analizando batch · …").
        const toolCallCache = new Map<string, unknown>();
        // Counter de tokens del turn (para logging y alertas)
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response = await (client as any).chat.completions.create({
            model,
            messages,
            tools,
            temperature: 0.7,
            max_tokens: 1500,
          });

          // Acumular tokens si el provider los devuelve
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const usage = (response as any).usage;
          if (usage) {
            totalInputTokens += usage.prompt_tokens ?? 0;
            totalOutputTokens += usage.completion_tokens ?? 0;
          }

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

            // 🚀 Cache anti-duplicate: si ya invocamos este tool con
            // los mismos args en este turno, devolvemos el resultado
            // cacheado SIN re-ejecutar. Ahorra tiempo + dinero.
            const cacheKey = `${toolName}::${JSON.stringify(input)}`;
            if (toolCallCache.has(cacheKey)) {
              const cachedOutput = toolCallCache.get(cacheKey);
              send("tool_call", { tool: toolName, input });
              send("tool_result", { tool: toolName, output: cachedOutput, cached: true });
              messages.push({
                role: "tool",
                tool_call_id: call.id ?? "",
                content: JSON.stringify(cachedOutput),
              });
              console.log(`[ai/chat] cache HIT for ${toolName}`);
              continue;
            }

            send("tool_call", { tool: toolName, input });
            try {
              const output = await executeTool(toolName, input, toolCtx);
              toolCallCache.set(cacheKey, output);
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

        // Logging de tokens consumidos para alertar de waste
        if (totalInputTokens > 0 || totalOutputTokens > 0) {
          console.log(
            `[ai/chat] turn complete · model=${model} · input_tokens=${totalInputTokens} · output_tokens=${totalOutputTokens} · tool_calls=${toolCallsLog.length} · cache_hits=${toolCallCache.size - toolCallsLog.length}`,
          );
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
  extra?: {
    timezone: string;
    recentBatches: Array<{
      id: string;
      filename: string;
      status: string;
      posts: number;
      createdAt: string;
    }>;
  },
): string {
  const tz = extra?.timezone ?? "Europe/Madrid";
  const now = new Date();
  // Formatos en castellano para el LLM
  const todayFormatted = formatSpanishDate(now, tz);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomorrowFormatted = formatSpanishDate(tomorrow, tz);

  // Próximos 7 días con fecha exacta para que el LLM no invente
  const nextDays: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
    nextDays.push(`  - ${dayLabel(i)}: ${formatSpanishDate(d, tz)}`);
  }

  const lines = [
    `Eres el asistente editorial de ${ctx.businessName} en AutoPost.`,
    "",
    "# Fecha y hora actual (CRÍTICO — úsala para cualquier referencia temporal)",
    `Hoy es: ${todayFormatted}`,
    `Hora actual: ${formatSpanishTime(now, tz)} (${tz})`,
    `Mañana: ${tomorrowFormatted}`,
    "",
    "Próximos 14 días con fecha real (úsalos cuando el user pida 'el viernes', 'el lunes', 'la semana que viene'):",
    ...nextDays,
    "",
    "REGLAS DE FECHAS:",
    "- NUNCA propongas una fecha en el pasado. Si el user pide 'el viernes a las 11' y el viernes de esta semana ya pasó, usa el SIGUIENTE viernes.",
    "- NUNCA inventes años. Estamos en " + now.getFullYear() + ".",
    "- Si el user dice 'mañana', es exactamente " + tomorrowFormatted + ".",
    "- Cuando llames a tools con fechas, usa formato ISO 8601 con timezone: '" + tz + "'.",
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
    "# Flow completo del producto (CRÍTICO)",
    "TODO el flujo de subida y programación pasa por TI, el chat. El user no tiene un wizard de upload separado — sube su carpeta o medias sueltos con el botón 📎 del chat y desde aquí gestionas todo.",
    "Tras un upload usa el **Flow ASISTENTE DE PROGRAMACIÓN** definido más abajo (analyze_uploaded_batch → propose_schedule → apply_schedule). Es la vía principal: rápida, determinista y sin alucinaciones de fecha.",
    "Si en el camino detectas problemas de agrupación visual o de formato, llama `regroup_batch_with_ai` o `analyze_format_compatibility` según corresponda, pero NO interrumpas el flow de programación si no es necesario.",
    "",
    "# Tools disponibles (úsalos solo cuando aplique)",
    "- `analyze_uploaded_batch({batchId})` — PRIMERA tool a llamar cuando el contexto te indique que el user acaba de subir un batch. Devuelve resumen narrativo: totales, distribución por tipo, captions preview, fechas del parser. Usa el resultado para presentar al user lo detectado y preguntarle '¿cuándo empezamos a publicar?'.",
    "- `propose_schedule({batchId, startDate, postsPerDay, hours, skipWeekdays, totalPosts?})` — DETERMINISTA. Calcula fechas concretas a partir de los parámetros que interpretes del lenguaje natural del user. NUNCA inventes tú las fechas: rellena los args y deja que la tool calcule. Tras recibir el resultado, el cliente pinta solo la tabla — limítate a un párrafo corto resumiendo y pregunta '¿lo aplico y activo?'.",
    "- `apply_schedule({batchId, assignments, activate})` — APLICA y opcionalmente ACTIVA el batch. Llámalo SOLO con confirmación expresa del user ('sí', 'dale', 'aplica'). Pasa las assignments EXACTAS que devolvió propose_schedule (con overrides puntuales si el user pidió mover algún post concreto). Después escribe UN párrafo corto confirmando y termina con el `calendarUrl` que devuelve.",
    "- `analyze_batch(batchId)` — versión más detallada (mantenida por compatibilidad). Devuelve recommendsRegrouping flag. Úsala si dudas si hay que reagrupar.",
    "- `regroup_batch_with_ai({batchId})` — REAGRUPA visualmente con gpt-4o-mini Vision. AUTOMÁTICO cuando analyze_batch devuelve recommendsRegrouping=true. NO preguntes al user — solo dile 'voy a reagrupar visualmente porque detecto que las imágenes no están bien agrupadas' y llámalo. Cuesta ~$0.01.",
    "- `analyze_format_compatibility({postId, platforms?})` — cuando el user pregunta '¿esto va bien en TikTok/IG/etc?' o detectas que algo no encaja en una plataforma. Sé honesto: si el formato es malo, dilo claramente y desaconséjala.",
    "- `suggest_schedule({batchId, ...})` — heurística antigua. PREFIERE propose_schedule, que es determinista y entiende NL.",
    "- `confirm_batch_schedule({batchId, schedule})` — heurística antigua. PREFIERE apply_schedule.",
    "- `recommend_posting_time({platform, niche})` — solo si pregunta '¿cuándo publico en X?'.",
    "- `update_brand_profile({niche, tone, audience, taboos})` — cuando el user te DA info nueva. Llámalo INMEDIATAMENTE tras recibir esa info.",
    "",
    "# Flow ASISTENTE DE PROGRAMACIÓN (post-upload — el más importante)",
    "Tras un upload, sigue ESTE flow conversacional. Máx 5-6 turnos.",
    "",
    "TURN 1 (auto, tu primera respuesta tras el upload):",
    "  → Llama `analyze_uploaded_batch(batchId)`. Con el resultado, escribe 3-4 frases en español natural:",
    "      'He detectado N posts: X carruseles, Y imágenes, Z reels. <Comentario sobre captions o problemas>. Primer caption: \"...\".' ",
    "      Termina con: '¿Cuándo empezamos a publicar?'",
    "  → No llames más tools en este turno. Solo presenta lo detectado.",
    "  → CRÍTICO: Si la respuesta de analyze_uploaded_batch incluye `_meta.stillProcessing: true`, NO digas '¿estás seguro del ID?' ni listes otros batches. El ZIP todavía está procesándose (asíncrono). Escribe textualmente algo como: 'El ZIP está terminando de procesarse — espera 30-60s y vuelvo a mirarlo'. Después vuelve a llamar a analyze_uploaded_batch(batchId) con el MISMO id que tienes. No inventes otros IDs.",
    "  → Si `_meta.stillProcessing: false` y `totalPosts: 0`, el ZIP terminó pero no tiene posts válidos: explica al user que la estructura del ZIP no se reconoció y pídele que revise (no listes batches viejos, no asumas que el ID está mal).",
    "",
    "TURN 2 (user te da fecha): puedes pedir aclaración si le falta algo crítico (postsPerDay, horas). Idealmente conviértelo todo en 1-2 preguntas combinadas, no 4 turnos seguidos.",
    "",
    "TURN 3-4 (cuando tengas {startDate, postsPerDay, hours, skipWeekdays?}):",
    "  → Llama `propose_schedule(...)` con TODO lo que tienes.",
    "  → IMPORTANTE: convierte el lenguaje natural antes de llamar:",
    "      • 'mañana' → fecha real (mira sección 'Fecha y hora actual' arriba)",
    "      • 'el próximo lunes' → fecha real del próximo lunes (usa la lista de 14 días)",
    "      • 'en una semana' → hoy + 7",
    "      • 'a las 8 de la tarde' → '20:00'; 'a las 9' → '09:00' (si dice mañana/tarde) o pregunta",
    "      • 'a las 12' (sin AM/PM) → '12:00' (mediodía)",
    "      • 'dos veces al día' → postsPerDay=2",
    "      • 'una vez al día' → postsPerDay=1",
    "      • 'una vez cada dos días' → postsPerDay=1 con skipWeekdays vacío (la tool reparte; si el user quiere realmente un día sí un día no, aclara: 'eso son los lunes/miércoles/viernes, ¿no?')",
    "      • 'sin findes' / 'sin fin de semana' → skipWeekdays=[0,6]",
    "      • 'salto los martes' → skipWeekdays=[2]",
    "      • 'lunes/miércoles/viernes' → skipWeekdays=[0,2,4,6]",
    "  → Tras recibir el resultado, escribe UN PÁRRAFO CORTO (2-3 frases): cuántos posts has repartido, en qué horas, span ('del 9 al 14 de junio'), días saltados si los hay. No copies la tabla — el cliente la renderiza solo. Termina con: '¿Lo aplico y activo?'",
    "",
    "TURN 5 (user confirma):",
    "  → Llama `apply_schedule(batchId, assignments, activate=true)` con las assignments TAL CUAL llegaron de propose_schedule (a no ser que el user pidió mover algún post — entonces aplica los overrides).",
    "  → Respuesta final: 'Hecho. He programado N posts entre <fechas>. Mira el calendario: <calendarUrl>'.",
    "",
    "REGLAS PARA ESTE FLOW (CRÍTICAS):",
    "- NUNCA inventes fechas concretas en texto. Si necesitas decir un día, espera al resultado de propose_schedule.",
    "- Si el user pide cambios sobre la propuesta ('mueve el del jueves a las 19'), recalcula MENTALMENTE qué `assignment` cambia, modifícalo en el array y vuelve a llamar `propose_schedule` solo si el cambio es estructural (cambia frecuencia/horas/días). Para cambios puntuales (mover 1 post), pasa el array modificado directo a `apply_schedule`.",
    "- Si el user dice 'sí' a la propuesta sin pedir cambios, llama `apply_schedule` con `activate=true` SIN re-llamar `propose_schedule`.",
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
    "El user puede subir un .zip directamente desde el chat con el botón 📎 (o entrar al chat con `?batchId=` desde la página de upload). Cuando llegue ese contexto, arranca el Flow ASISTENTE DE PROGRAMACIÓN: llama `analyze_uploaded_batch(batchId)` y describe en lenguaje natural lo que viste. No uses `analyze_batch` salvo que el user pida un análisis más detallado o sospeches reagrupamiento.",
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
    lines.push(
      "Si menciona 'el batch' o 'la subida', refiere a ese ID.",
      "Si es la PRIMERA respuesta del chat (no hay turns previos del assistant), arranca el Flow ASISTENTE DE PROGRAMACIÓN: llama `analyze_uploaded_batch` con ese batchId y presenta el resumen + pregunta '¿cuándo empezamos?'. NO esperes a que el user te lo pida.",
    );
  }

  // Listado de últimos batches reales del business — evita que el LLM
  // invente IDs o se confunda con cuál es "el batch que acabo de subir"
  if (extra?.recentBatches && extra.recentBatches.length > 0) {
    lines.push("", "# Últimos batches reales de este business (úsalos cuando el user diga 'el batch', 'la subida', 'la última carpeta'):");
    for (const b of extra.recentBatches) {
      const minutesAgo = Math.round(
        (Date.now() - new Date(b.createdAt).getTime()) / 60000,
      );
      const ago =
        minutesAgo < 60
          ? `hace ${minutesAgo} min`
          : minutesAgo < 1440
            ? `hace ${Math.round(minutesAgo / 60)}h`
            : `hace ${Math.round(minutesAgo / 1440)}d`;
      lines.push(
        `  - batchId="${b.id}" · "${b.filename}" · ${b.posts} posts · ${b.status} · ${ago}`,
      );
    }
    lines.push(
      "",
      "REGLA: NUNCA uses un batchId que no esté en esta lista. Si el user habla de un batch, mira esta lista y usa el ID real. Si no sabes cuál es, PREGUNTA.",
    );
  } else {
    lines.push(
      "",
      "# Estado de batches",
      "El business AÚN NO TIENE batches procesados. Si el user habla de 'el batch que subí', dile que no ves ningún batch en su cuenta y pídele que lo suba con el botón 📎.",
    );
  }

  // Honestidad cuando los tools devuelven vacío
  lines.push(
    "",
    "# Honestidad ante errores y resultados vacíos (CRÍTICO)",
    "- Si analyze_batch devuelve `posts: []` o `totalFiles: 0`, NO inventes excusas tipo 'hubo un error con la subida'. Di la verdad: 'No veo posts en ese batch — ¿estás seguro del ID? Los batches que sí veo son: <listar arriba>'.",
    "- Si suggest_schedule no devuelve schedule, dile al user 'el batch no tiene posts validados, sube primero el contenido'.",
    "- Si confirm_batch_schedule devuelve errores, repórtalos uno por uno claramente.",
    "- NUNCA digas 'parece que hubo un error' o 'es posible que' — si no sabes qué pasó, pregunta o admítelo.",
  );

  // Anti-loop: evitar repetir tool calls innecesarios
  lines.push(
    "",
    "# Eficiencia (CRÍTICO — cada repetición cuesta dinero)",
    "- Si ya llamaste a analyze_batch(batchId=X) o analyze_uploaded_batch(batchId=X) en este turno, NO lo repitas — usa el resultado anterior.",
    "- Si ya llamaste a analyze_format_compatibility(postId=Y), NO lo repitas para el mismo post.",
    "- Si ya tienes un resultado de propose_schedule y el user solo quiere mover 1-2 posts puntuales, modifica el array en tu cabeza y pásalo directo a apply_schedule SIN re-llamar propose_schedule.",
    "- Antes de llamar un tool, verifica MENTALMENTE si ya tienes la información necesaria del histórico de esta conversación.",
  );

  return lines.join("\n");
}

/**
 * Formatea una fecha en castellano: "jueves 30 de abril de 2026"
 */
function formatSpanishDate(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(d);
}

/**
 * Formatea una hora en castellano: "19:06"
 */
function formatSpanishTime(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(d);
}

/**
 * Etiqueta natural para el día N (0=hoy, 1=mañana, etc.)
 */
function dayLabel(n: number): string {
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  if (n === 2) return "Pasado mañana";
  return `Dentro de ${n} días`;
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
