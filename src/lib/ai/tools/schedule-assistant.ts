/**
 * Tools del asistente conversacional post-upload.
 *
 * Estas 3 tools forman el flow de "subí un ZIP, ¿cuándo lo publico?":
 *   1. analyze_uploaded_batch  → resumen narrativo del batch para arrancar la conversación
 *   2. propose_schedule        → reparto DETERMINISTA de fechas a partir de NL parameters
 *   3. apply_schedule          → ejecuta el reschedule masivo + activa el batch
 *
 * Las 3 son intencionalmente más estrictas que `analyze_batch` /
 * `suggest_schedule` / `confirm_batch_schedule` que ya existen. El LLM ya no
 * inventa fechas: solo INTERPRETA la intención del user y rellena los args
 * de `propose_schedule`. Las fechas concretas las calcula este código.
 *
 * Reusa endpoints:
 *   - /api/posts/bulk?action=reschedule (vía llamada interna a Prisma — más
 *     limpio que un fetch self-loop sin sesión)
 *   - confirmBatch() del batch-processor para crear los PublishJobs
 */
import { db } from "@/lib/db";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import type { ToolDefinition, ToolHandler } from "./registry";

/** Opciones por defecto para formatInTimeZone — siempre locale español. */
const TZ_OPTS = { locale: es } as const;

// ───────────────────────────────────────────────────────────────────────
// Helpers — parsing de fechas en timezone del business
// ───────────────────────────────────────────────────────────────────────

/**
 * Devuelve la fecha "ahora" expresada como Y/M/D en una timezone IANA.
 * Útil para calcular "mañana" partiendo de la hora local del business,
 * no del servidor (que está en UTC).
 */
function todayInTz(tz: string): { y: number; m: number; d: number } {
  const now = new Date();
  const ymd = formatInTimeZone(now, tz, "yyyy-MM-dd").split("-");
  return {
    y: Number(ymd[0]),
    m: Number(ymd[1]),
    d: Number(ymd[2]),
  };
}

/**
 * Parsea "HH:MM" y devuelve {hour, minute}. Permite formatos como "9:00",
 * "09:00", "21:00". Lanza si está mal formado.
 */
function parseHourMinute(hhmm: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) {
    throw new Error(`Hora inválida "${hhmm}". Usa formato HH:MM (ej. "12:00", "21:30").`);
  }
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Hora fuera de rango "${hhmm}". hour 0-23, minute 0-59.`);
  }
  return { hour, minute };
}

/**
 * Suma N días a una fecha Y/M/D usando UTC arithmetic (evita DST issues).
 * Devuelve nuevo {y,m,d}.
 */
function addDaysYmd(
  ymd: { y: number; m: number; d: number },
  n: number,
): { y: number; m: number; d: number } {
  const d = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + n));
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
  };
}

/**
 * Día de la semana (0=domingo, 6=sábado) de Y/M/D.
 */
function weekdayOf(ymd: { y: number; m: number; d: number }): number {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
}

/**
 * Combina Y/M/D + hour:minute en una timezone y devuelve un Date UTC.
 * Usa date-fns-tz para resolver el offset DST correctamente.
 */
function combineDateTimeInTz(
  ymd: { y: number; m: number; d: number },
  hour: number,
  minute: number,
  tz: string,
): Date {
  // Construimos un string ISO "naive" (sin tz) y dejamos que fromZonedTime
  // lo interprete en la TZ deseada. Esto es más fiable que jugar con
  // Date.UTC y getTimezoneOffset() — DST puede mover ±1h.
  const isoNaive = `${ymd.y.toString().padStart(4, "0")}-${ymd.m
    .toString()
    .padStart(2, "0")}-${ymd.d.toString().padStart(2, "0")}T${hour
    .toString()
    .padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
  return fromZonedTime(isoNaive, tz);
}

/**
 * Etiqueta corta en castellano para una fecha+hora ya combinada.
 * Ej: "Mar 9 jun · 12:00"
 */
function formatDayLabel(d: Date, tz: string): string {
  const dayName = formatInTimeZone(d, tz, "EEE", TZ_OPTS)
    .replace(".", "")
    .toLowerCase();
  // Capitalize first letter
  const dayShort = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dom = formatInTimeZone(d, tz, "d", TZ_OPTS);
  const month = formatInTimeZone(d, tz, "MMM", TZ_OPTS)
    .replace(".", "")
    .toLowerCase();
  const hm = formatInTimeZone(d, tz, "HH:mm", TZ_OPTS);
  return `${dayShort} ${dom} ${month} · ${hm}`;
}

// ───────────────────────────────────────────────────────────────────────
// Tool 1: analyze_uploaded_batch
// ───────────────────────────────────────────────────────────────────────
//
// Resumen narrativo del batch recién subido — pensado para arrancar la
// conversación con "He detectado N posts, tipo X/Y/Z, primer caption …".
// Más liviano que analyze_batch: no devuelve recommendsRegrouping ni
// detección de problemas, solo lo justo para que el AI escriba 2-3
// frases bonitas y haga la pregunta "¿cuándo empezamos?".

export const analyzeUploadedBatchTool: ToolDefinition = {
  name: "analyze_uploaded_batch",
  description:
    "Resumen narrativo de un batch recién subido. Devuelve totales, distribución por tipo, fechas auto-asignadas por el parser (que serán sobrescritas por propose_schedule), y preview de los primeros 3 captions. Úsalo SIEMPRE como PRIMERA acción cuando recibas el contexto 'el user acaba de subir el batch X' — antes de preguntar nada. Con el resultado, presenta al user lo que detectaste y pregúntale '¿cuándo empezamos a publicar?'.",
  parameters: {
    type: "object",
    properties: {
      batchId: {
        type: "string",
        description: "ID del UploadBatch que se acaba de subir",
      },
    },
    required: ["batchId"],
  },
};

export const analyzeUploadedBatchHandler: ToolHandler<
  { batchId: string },
  {
    batchId: string;
    totalPosts: number;
    distribution: { IMAGE: number; CAROUSEL: number; REEL: number };
    withoutCaption: number;
    withWarnings: number;
    parserDateRange: {
      earliest: string | null; // ISO
      latest: string | null; // ISO
      note: string; // explicación: estas fechas las sobrescribiremos
    };
    captionsPreview: Array<{
      sourceFolderName: string;
      postType: string;
      mediaCount: number;
      captionStart: string;
    }>;
  }
> = async (input, ctx) => {
  const batch = await db.uploadBatch.findFirst({
    where: { id: input.batchId, businessId: ctx.businessId },
    include: {
      postDrafts: {
        where: { status: { in: ["DRAFT", "VALIDATED", "READY"] } },
        orderBy: { sourceFolderName: "asc" },
        select: {
          sourceFolderName: true,
          postType: true,
          caption: true,
          publishAt: true,
          _count: { select: { mediaAssets: true } },
        },
      },
    },
  });

  if (!batch) {
    throw new Error(
      `Batch ${input.batchId} no encontrado o pertenece a otro negocio`,
    );
  }

  const distribution = { IMAGE: 0, CAROUSEL: 0, REEL: 0 };
  let withoutCaption = 0;
  let withWarnings = 0;
  let earliest: Date | null = null;
  let latest: Date | null = null;

  for (const p of batch.postDrafts) {
    distribution[p.postType] = (distribution[p.postType] ?? 0) + 1;
    if (p.caption.trim().length === 0) withoutCaption++;
    if (!earliest || p.publishAt < earliest) earliest = p.publishAt;
    if (!latest || p.publishAt > latest) latest = p.publishAt;
  }

  // `parseWarnings` puede ser Array o Object { ... }; contamos solo si es array
  if (Array.isArray(batch.parseWarnings)) {
    withWarnings = batch.parseWarnings.length;
  }

  const captionsPreview = batch.postDrafts.slice(0, 3).map((p) => {
    const cap = p.caption.trim();
    const start = cap.length > 0 ? cap.split(/\s+/).slice(0, 12).join(" ") : "";
    return {
      sourceFolderName: p.sourceFolderName,
      postType: p.postType,
      mediaCount: p._count.mediaAssets,
      captionStart: start + (cap.split(/\s+/).length > 12 ? "…" : ""),
    };
  });

  return {
    batchId: batch.id,
    totalPosts: batch.postDrafts.length,
    distribution,
    withoutCaption,
    withWarnings,
    parserDateRange: {
      earliest: earliest ? earliest.toISOString() : null,
      latest: latest ? latest.toISOString() : null,
      note: "Estas fechas vienen del parser (suelen ser hoy o mañana 10:00 por defecto). Las sobrescribirá propose_schedule con la programación real que decida el user.",
    },
    captionsPreview,
  };
};

// ───────────────────────────────────────────────────────────────────────
// Tool 2: propose_schedule (DETERMINISTA)
// ───────────────────────────────────────────────────────────────────────
//
// A diferencia de suggest_schedule (que usa heurísticas internas), esta
// tool acepta TODOS los parámetros de programación explícitos y calcula
// fechas concretas. El AI solo interpreta lenguaje natural → params.
//
// La idea es que el AI nunca diga "te lo programo el viernes 15 a las 19"
// inventándose la fecha. Llama esta tool, recibe `assignments` con las
// fechas verificadas, y se las muestra al user. Cero alucinación temporal.

export const proposeScheduleTool: ToolDefinition = {
  name: "propose_schedule",
  description:
    "Calcula in-memory las fechas concretas de publicación de cada post del batch. NO escribe a BD — solo propone. Llámalo cuando el user te haya dado start, frecuencia y horas. Tras recibir el resultado, presenta la tabla al user (el cliente la pinta sola) y pregunta '¿lo aplico?'. NUNCA inventes fechas tú: el cálculo es determinista. Si el user dice 'una vez cada dos días', tradúcelo a postsPerDay=1 y skipWeekdays vacío (la tool se encarga de espaciar). Si el user dice 'lunes/miércoles/viernes', pasa skipWeekdays=[0,2,4,6] (skip de domingo, martes, jueves, sábado). Lo importante: dale TODO lo que el user te dijo.",
  parameters: {
    type: "object",
    properties: {
      batchId: {
        type: "string",
        description: "ID del UploadBatch a programar",
      },
      startDate: {
        type: "string",
        description:
          "Fecha ISO (YYYY-MM-DD) desde la que empezar. 'Mañana' = fecha de mañana en la zona del business. Si la calculaste partiendo de 'hoy' o 'mañana', usa la fecha REAL de la sección 'Fecha y hora actual' del system prompt, NO te la inventes.",
      },
      postsPerDay: {
        type: "number",
        description:
          "Posts por día (1-5). Si el user dice 'dos veces al día' usa 2; 'uno al día' usa 1; 'cada dos días' usa 1 (espaciado lo hace skipWeekdays o el reparto natural).",
      },
      hours: {
        type: "array",
        items: { type: "string" },
        description:
          "Horas locales del business en formato HH:MM. Ej: ['12:00', '21:00']. La longitud DEBE ser >= postsPerDay; si el user solo dio una hora y postsPerDay=2, duplica o pregunta.",
      },
      skipWeekdays: {
        type: "array",
        items: { type: "number" },
        description:
          "Días de la semana en los que NO publicar (0=domingo, 1=lunes, ..., 6=sábado). 'Sin findes' = [0, 6]. 'Salto los martes' = [2]. Vacío si publica todos los días.",
      },
      totalPosts: {
        type: "number",
        description:
          "(opcional) Si lo conoces, número total de posts a programar. Si lo omites, la tool lee el conteo real del batch.",
      },
    },
    required: ["batchId", "startDate", "postsPerDay", "hours"],
  },
};

export interface ScheduleAssignment {
  postId: string;
  sourceFolderName: string;
  postType: string;
  publishAt: string; // ISO UTC
  dayLabel: string; // "Lun 9 jun · 12:00"
}

export const proposeScheduleHandler: ToolHandler<
  {
    batchId: string;
    startDate: string;
    postsPerDay: number;
    hours: string[];
    skipWeekdays?: number[];
    totalPosts?: number;
  },
  {
    batchId: string;
    timezone: string;
    assignments: ScheduleAssignment[];
    skippedDays: number; // cuántos días se saltaron por skipWeekdays
    summary: {
      totalPosts: number;
      firstAt: string | null;
      lastAt: string | null;
      span: string; // "del 9 jun al 14 jun"
    };
  }
> = async (input, ctx) => {
  // 1. Validaciones tempranas
  const postsPerDay = Math.floor(Number(input.postsPerDay));
  if (!Number.isFinite(postsPerDay) || postsPerDay < 1 || postsPerDay > 5) {
    throw new Error(
      `postsPerDay debe estar entre 1 y 5 (recibí ${input.postsPerDay}).`,
    );
  }
  if (!Array.isArray(input.hours) || input.hours.length === 0) {
    throw new Error("hours no puede estar vacío. Pasa al menos una HH:MM.");
  }
  const parsedHours = input.hours.map(parseHourMinute);
  // Si dieron menos horas que postsPerDay, replicamos la última para que
  // no rompa — el AI debería haber preguntado pero somos tolerantes.
  while (parsedHours.length < postsPerDay) {
    parsedHours.push(parsedHours[parsedHours.length - 1]);
  }
  parsedHours.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  const skipSet = new Set<number>(
    (input.skipWeekdays ?? []).filter(
      (n) => Number.isInteger(n) && n >= 0 && n <= 6,
    ),
  );
  if (skipSet.size === 7) {
    throw new Error(
      "skipWeekdays no puede incluir los 7 días — ¿qué día publicaría?",
    );
  }

  // 2. Resolver business + timezone + drafts del batch
  const business = await db.business.findUnique({
    where: { id: ctx.businessId },
    select: { timezone: true },
  });
  const tz = business?.timezone || "Europe/Madrid";

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

  if (drafts.length === 0) {
    throw new Error(
      `Batch ${input.batchId} no tiene drafts programables (DRAFT/VALIDATED/READY).`,
    );
  }

  // 3. Resolver startDate. Aceptamos "YYYY-MM-DD" o ISO completo.
  //    Si la fecha es pasada en la TZ del business, la movemos a mañana.
  let cursor: { y: number; m: number; d: number };
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.startDate.trim());
  if (isoMatch) {
    cursor = {
      y: Number(isoMatch[1]),
      m: Number(isoMatch[2]),
      d: Number(isoMatch[3]),
    };
  } else {
    // Fallback paranoico: intenta Date()
    const tryDate = new Date(input.startDate);
    if (isNaN(tryDate.getTime())) {
      throw new Error(
        `startDate inválida "${input.startDate}". Usa formato YYYY-MM-DD.`,
      );
    }
    const ymd = formatInTimeZone(tryDate, tz, "yyyy-MM-dd").split("-");
    cursor = { y: Number(ymd[0]), m: Number(ymd[1]), d: Number(ymd[2]) };
  }

  // Anti-pasado: si la fecha+primera hora ya es pasada, salta a mañana.
  // Esto previene el clásico "el LLM no sabe qué año es" → fecha 2023.
  const today = todayInTz(tz);
  const cursorStamp = cursor.y * 10000 + cursor.m * 100 + cursor.d;
  const todayStamp = today.y * 10000 + today.m * 100 + today.d;
  if (cursorStamp < todayStamp) {
    cursor = addDaysYmd(today, 1);
  } else if (cursorStamp === todayStamp) {
    // Mismo día: verificamos que la primera hora aún no haya pasado
    const firstSlot = combineDateTimeInTz(
      cursor,
      parsedHours[0].hour,
      parsedHours[0].minute,
      tz,
    );
    if (firstSlot.getTime() <= Date.now() + 5 * 60 * 1000) {
      cursor = addDaysYmd(today, 1);
    }
  }

  // 4. Distribuir N posts en días válidos (que no estén en skipSet)
  const totalPosts = input.totalPosts ?? drafts.length;
  const N = Math.min(totalPosts, drafts.length);

  const assignments: ScheduleAssignment[] = [];
  let skippedDays = 0;
  let safety = 0;
  const MAX_DAYS = 365; // hard-stop para evitar bucles infinitos

  let i = 0;
  while (i < N && safety < MAX_DAYS) {
    safety++;
    // ¿Es un día skippeado?
    if (skipSet.has(weekdayOf(cursor))) {
      skippedDays++;
      cursor = addDaysYmd(cursor, 1);
      continue;
    }
    // Asignar hasta postsPerDay slots de este día
    for (let s = 0; s < postsPerDay && i < N; s++, i++) {
      const slot = parsedHours[s];
      const at = combineDateTimeInTz(cursor, slot.hour, slot.minute, tz);
      const d = drafts[i];
      assignments.push({
        postId: d.id,
        sourceFolderName: d.sourceFolderName,
        postType: d.postType,
        publishAt: at.toISOString(),
        dayLabel: formatDayLabel(at, tz),
      });
    }
    cursor = addDaysYmd(cursor, 1);
  }

  // 5. Resumen
  const firstAt = assignments[0]?.publishAt ?? null;
  const lastAt = assignments[assignments.length - 1]?.publishAt ?? null;
  let span = "";
  if (firstAt && lastAt) {
    const f = formatInTimeZone(new Date(firstAt), tz, "d MMM", TZ_OPTS)
      .replace(".", "")
      .toLowerCase();
    const l = formatInTimeZone(new Date(lastAt), tz, "d MMM", TZ_OPTS)
      .replace(".", "")
      .toLowerCase();
    span = f === l ? `el ${f}` : `del ${f} al ${l}`;
  }

  return {
    batchId: input.batchId,
    timezone: tz,
    assignments,
    skippedDays,
    summary: {
      totalPosts: assignments.length,
      firstAt,
      lastAt,
      span,
    },
  };
};

// ───────────────────────────────────────────────────────────────────────
// Tool 3: apply_schedule
// ───────────────────────────────────────────────────────────────────────
//
// Aplica las assignments calculadas por propose_schedule. Hace dos cosas:
//   1. Update masivo de postDraft.publishAt vía Prisma (lo que /api/posts/bulk
//      hace internamente — lo replicamos aquí porque ya tenemos ctx + es
//      más limpio que un fetch self-loop sin sesión)
//   2. Si activate=true, llama a confirmBatch() del batch-processor para
//      crear los PublishJobs y meter los posts en la cola BullMQ
//
// Devuelve enlace al calendario para que el AI lo pinte como CTA.

export const applyScheduleTool: ToolDefinition = {
  name: "apply_schedule",
  description:
    "Aplica una programación previamente propuesta por propose_schedule. Llámalo SOLO cuando el user confirme expresamente ('sí', 'dale', 'aplica', 'adelante'). Si activate=true, también activa el batch (los posts pasan a SCHEDULED y se publicarán solos en su hora). Tras llamarlo, responde al user con UN PÁRRAFO CORTO confirmando el resultado y termina con el enlace al calendario que devuelve la tool.",
  parameters: {
    type: "object",
    properties: {
      batchId: {
        type: "string",
        description: "ID del UploadBatch al que pertenecen los assignments",
      },
      assignments: {
        type: "array",
        description:
          "Array EXACTO de assignments tal cual los devolvió propose_schedule (puede llevar overrides puntuales si el user pidió mover algún post). Cada item tiene postId + publishAt ISO.",
        items: {
          type: "object",
          properties: {
            postId: { type: "string" },
            publishAt: {
              type: "string",
              description: "ISO 8601 UTC del momento de publicación",
            },
          },
          required: ["postId", "publishAt"],
        },
      },
      activate: {
        type: "boolean",
        description:
          "Si true, además de actualizar fechas, llama a confirmBatch para crear los PublishJobs y activar el batch. Por defecto true cuando el user dice 'sí, aplica'.",
      },
    },
    required: ["batchId", "assignments"],
  },
};

export const applyScheduleHandler: ToolHandler<
  {
    batchId: string;
    assignments: Array<{ postId: string; publishAt: string }>;
    activate?: boolean;
  },
  {
    scheduled: number;
    failed: number;
    activated: boolean;
    errors: string[];
    calendarUrl: string;
    monthLabel: string; // "Junio 2026" para que el AI lo cite bonito
  }
> = async (input, ctx) => {
  const activate = input.activate !== false; // default true
  const errors: string[] = [];

  // 1. Verificar batch + ownership
  const batch = await db.uploadBatch.findFirst({
    where: { id: input.batchId, businessId: ctx.businessId },
    select: { id: true, businessId: true, status: true },
  });
  if (!batch) {
    throw new Error(
      `Batch ${input.batchId} no encontrado o pertenece a otro negocio`,
    );
  }

  // 2. Resolver business (slug + tz) para construir el calendarUrl
  const business = await db.business.findUnique({
    where: { id: ctx.businessId },
    select: { slug: true, timezone: true },
  });
  if (!business) {
    throw new Error(`Business ${ctx.businessId} no encontrado`);
  }
  const tz = business.timezone || "Europe/Madrid";

  // 3. Cargar drafts mencionados + filtrar por ownership y estado válido
  const draftIds = input.assignments.map((a) => a.postId);
  const drafts = await db.postDraft.findMany({
    where: {
      id: { in: draftIds },
      businessId: ctx.businessId,
      batchId: input.batchId,
    },
    select: { id: true, status: true },
  });
  const draftMap = new Map(drafts.map((d) => [d.id, d]));
  const RESCHEDULABLE = new Set(["DRAFT", "VALIDATED", "READY", "SCHEDULED"]);

  // 4. Update masivo — uno por uno porque cada post tiene su propio publishAt.
  //    Prisma no acepta CASE WHEN en updateMany, así que vamos paralelos.
  const now = new Date();
  let scheduled = 0;

  const updateOps = input.assignments.map(async (a) => {
    const draft = draftMap.get(a.postId);
    if (!draft) {
      errors.push(`Post ${a.postId} no encontrado en este batch.`);
      return;
    }
    if (!RESCHEDULABLE.has(draft.status)) {
      errors.push(
        `Post ${a.postId} en estado ${draft.status} — no se puede reprogramar.`,
      );
      return;
    }
    const publishAt = new Date(a.publishAt);
    if (isNaN(publishAt.getTime())) {
      errors.push(`Post ${a.postId}: publishAt inválido (${a.publishAt}).`);
      return;
    }
    if (publishAt <= now) {
      errors.push(
        `Post ${a.postId}: publishAt (${a.publishAt}) está en el pasado.`,
      );
      return;
    }
    try {
      await db.postDraft.update({
        where: { id: a.postId },
        data: { publishAt },
      });
      // Audit log paralelo — útil para diagnosticar y para la UI de batches
      await db.auditLog.create({
        data: {
          businessId: ctx.businessId,
          adminUserId: ctx.adminUserId,
          action: "POST_UPDATED",
          entityType: "PostDraft",
          entityId: a.postId,
          detail: {
            publishAt: publishAt.toISOString(),
            source: "ai_schedule_assistant",
            batchId: input.batchId,
          },
        },
      });
      scheduled++;
    } catch (err) {
      errors.push(
        `Post ${a.postId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  await Promise.all(updateOps);

  // 5. Si activate=true, llama confirmBatch para crear los PublishJobs
  let activated = false;
  if (activate && scheduled > 0) {
    // El batch debe estar en PARSED o VALIDATION_FAILED. Si ya está
    // SCHEDULED/PARTIALLY_SCHEDULED, confirmBatch falla — pero igualmente
    // los posts ya están reprogramados, así que devolvemos activated=false
    // sin lanzar error.
    if (batch.status === "PARSED" || batch.status === "VALIDATION_FAILED") {
      try {
        const { confirmBatch } = await import(
          "@/services/scheduler/batch-processor"
        );
        const result = await confirmBatch(batch.id);
        activated = true;
        // Si confirmBatch encontró failures que no detectamos arriba, súmalos
        if (result.failed > 0) {
          errors.push(
            `${result.failed} posts fallaron al crear su PublishJob — revisa el panel de batches.`,
          );
        }
      } catch (err) {
        errors.push(
          `Error al activar batch: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else {
      // Ya estaba activado: no es error, lo marcamos como tal para que
      // el AI no diga "lo activé" si en realidad ya lo estaba
      activated = batch.status === "SCHEDULED" ||
        batch.status === "PARTIALLY_SCHEDULED";
    }
  }

  // 6. Construir calendarUrl apuntando al mes del primer post programado
  let monthParam = "";
  let monthLabel = "";
  const first = input.assignments[0];
  if (first) {
    const firstDate = new Date(first.publishAt);
    if (!isNaN(firstDate.getTime())) {
      monthParam = formatInTimeZone(firstDate, tz, "yyyy-MM");
      const monthRaw = formatInTimeZone(firstDate, tz, "MMMM yyyy", TZ_OPTS);
      monthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
    }
  }
  const calendarUrl = monthParam
    ? `/businesses/${business.slug}/posts?view=calendar&month=${monthParam}`
    : `/businesses/${business.slug}/posts?view=calendar`;

  return {
    scheduled,
    failed: input.assignments.length - scheduled,
    activated,
    errors,
    calendarUrl,
    monthLabel,
  };
};
