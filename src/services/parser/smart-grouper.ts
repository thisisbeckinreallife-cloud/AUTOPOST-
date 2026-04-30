/**
 * Smart-grouper: agrupa archivos sueltos en posts coherentes cuando el ZIP
 * no tiene estructura de carpetas clara.
 *
 * Dos capas:
 *   1. Heurística de nombres (gratis, instantánea):
 *      - Patrones tipo "post-A_1.jpg", "post-A_2.jpg" → mismo carrusel
 *      - "slide-1.jpg", "slide-2.jpg" → mismo carrusel
 *      - "1.jpg", "2.jpg", "3.jpg" → un único carrusel
 *      - "IMG_001.JPG", "IMG_002.JPG" (camera dump) → posts separados
 *      - Videos sueltos siempre = REELs individuales
 *      - .txt con nombre similar al prefijo del grupo = caption del grupo
 *
 *   2. Análisis visual con OpenAI gpt-4o-mini (opcional, llamado desde el
 *      chat tool `regroup_batch_with_ai`):
 *      - Para imágenes que la heurística deja sueltas, envía thumbnails
 *        a Vision para detectar coherencia visual (paleta, estilo, tema)
 *      - Devuelve grupos basados en similitud visual + texto OCR detectado
 *      - Coste: ~$0.0008 por imagen (gpt-4o-mini con detail:low)
 *
 * El parser principal (zip-parser.ts) llama solo a la capa 1 al subir el ZIP.
 * Si la heurística no agrupa bien, el user le dice al chat IA "agrupa mejor"
 * y el bot invoca el tool `regroup_batch_with_ai` que usa la capa 2.
 */

export interface FileEntry {
  filename: string;
  isImage: boolean;
  isVideo: boolean;
  isCaption: boolean; // .txt
}

export interface GroupedPost {
  /** Display name del grupo (e.g. "post-A", "carousel-slide-1-3") */
  groupKey: string;
  /** Tipo detectado heurísticamente */
  detectedType: "image" | "carousel" | "reel";
  /** Confianza de la heurística (0-1). <0.7 = el chat puede sugerir re-análisis */
  confidence: number;
  /** Razón de la agrupación (para mostrar al user) */
  reason: string;
  /** Archivos en orden propuesto */
  filenames: string[];
  /** Caption opcional asociado (.txt vinculado por nombre) */
  captionFile?: string;
}

// ─────────────────────────────────────────
// HEURÍSTICAS
// ─────────────────────────────────────────

/**
 * Patrones reconocidos:
 *
 * Grupo POR PREFIJO + sufijo numérico/letra:
 *   - "post-A_1.jpg", "post-A_2.jpg"        → grupo "post-A"
 *   - "carrusel-mayo_a.jpg", "..._b.jpg"   → grupo "carrusel-mayo"
 *   - "slide-1.jpg", "slide-2.jpg"          → grupo "slide"
 *
 * Grupo POR NUMERACIÓN PURA en root:
 *   - "1.jpg", "2.jpg", ..., "5.jpg" (≤10)  → un único carrusel "carrusel"
 *
 * Posts SEPARADOS:
 *   - "IMG_001.JPG", "IMG_002.JPG"          → posts separados (camera dump)
 *   - "DSC_xxxx.NEF"                        → posts separados
 *   - Nombres únicos sin patrón de grupo    → posts separados
 */

interface NamePattern {
  prefix: string;
  // Sufijo del file dentro del grupo (e.g. "1", "2", "a", "b")
  suffix: string;
  // Score de confianza: 1.0 = patrón fuerte, 0.5 = patrón débil
  confidence: number;
}

/**
 * Extrae prefijo + sufijo de un nombre de archivo.
 * Devuelve null si no coincide con ningún patrón conocido.
 */
function extractPattern(filename: string): NamePattern | null {
  // Quitar la extensión
  const base = filename.replace(/\.[^.]+$/, "");

  // Pattern 1: prefijo_NUM | prefijo-NUM (ej. "post-A_1", "slide-1", "foto_3")
  // Si el sufijo es NUM puro de 1-3 dígitos
  const m1 = base.match(/^(.+?)[_\-](\d{1,3})$/);
  if (m1) {
    return { prefix: m1[1], suffix: m1[2], confidence: 0.9 };
  }

  // Pattern 2: prefijo_LETTER (a, b, c... típico de Instagram carousel exports)
  const m2 = base.match(/^(.+?)[_\-]([a-z])$/i);
  if (m2 && m2[1].length >= 2) {
    return { prefix: m2[1], suffix: m2[2].toLowerCase(), confidence: 0.8 };
  }

  // Pattern 3: número puro (sin prefijo claro)
  const m3 = base.match(/^(\d{1,3})$/);
  if (m3) {
    return { prefix: "__numeric__", suffix: m3[1], confidence: 0.85 };
  }

  // Pattern 4: cámara digital — IMG_NNNN, DSC_NNNN, P10NNNN
  // Estos son secuencias del móvil, NO carruseles. Confidence baja.
  const m4 = base.match(/^(IMG|DSC|DSCN|P\d{0,2}|GOPR|MVI)[\s_-]?\d+$/i);
  if (m4) {
    return { prefix: "__camera_dump__", suffix: base, confidence: 0.1 };
  }

  return null;
}

/**
 * Convierte el sufijo a número ordinable.
 * "1" → 1, "a" → 1, "b" → 2, "10" → 10
 */
function suffixToOrder(suffix: string): number {
  const num = parseInt(suffix, 10);
  if (!isNaN(num)) return num;
  // Letra → ordinal: a=1, b=2, ...
  if (suffix.length === 1) {
    return suffix.toLowerCase().charCodeAt(0) - 96; // 'a' → 1
  }
  return 999;
}

/**
 * Agrupa archivos heurísticamente. No usa IA — solo nombres.
 * Devuelve grupos coherentes + warnings si algo es ambiguo.
 */
export function groupByHeuristic(files: FileEntry[]): {
  groups: GroupedPost[];
  unmatched: string[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const unmatched: string[] = [];

  // Separar por tipo
  const images = files.filter((f) => f.isImage);
  const videos = files.filter((f) => f.isVideo);
  const captions = files.filter((f) => f.isCaption);

  const groups: GroupedPost[] = [];

  // 1. Cada video suelto = un REEL individual
  for (const video of videos) {
    const baseName = video.filename.replace(/\.[^.]+$/, "");
    groups.push({
      groupKey: baseName,
      detectedType: "reel",
      confidence: 1.0,
      reason: "Video suelto → REEL",
      filenames: [video.filename],
    });
  }

  // 2. Detectar patrones en imágenes
  type PatternBucket = {
    prefix: string;
    items: Array<{ filename: string; suffix: string; confidence: number }>;
  };
  const buckets = new Map<string, PatternBucket>();
  const noPattern: string[] = [];

  for (const img of images) {
    const pattern = extractPattern(img.filename);
    if (!pattern) {
      noPattern.push(img.filename);
      continue;
    }
    if (pattern.prefix === "__camera_dump__") {
      // Tratar como post individual, NO carrusel
      noPattern.push(img.filename);
      continue;
    }
    if (!buckets.has(pattern.prefix)) {
      buckets.set(pattern.prefix, { prefix: pattern.prefix, items: [] });
    }
    buckets.get(pattern.prefix)!.items.push({
      filename: img.filename,
      suffix: pattern.suffix,
      confidence: pattern.confidence,
    });
  }

  // 3. Para cada bucket con 2+ items → carrusel; con 1 item → post individual
  for (const bucket of buckets.values()) {
    bucket.items.sort((a, b) => suffixToOrder(a.suffix) - suffixToOrder(b.suffix));

    if (bucket.items.length === 1) {
      // Solo 1 archivo con ese prefijo → post imagen individual
      groups.push({
        groupKey: bucket.items[0].filename.replace(/\.[^.]+$/, ""),
        detectedType: "image",
        confidence: 0.9,
        reason: "Imagen suelta → post individual",
        filenames: [bucket.items[0].filename],
      });
      continue;
    }

    if (bucket.items.length > 10) {
      warnings.push(
        `El grupo "${bucket.prefix}" tiene ${bucket.items.length} imágenes — Instagram solo acepta 10 en un carrusel. Las primeras 10 se agruparán juntas.`,
      );
    }

    const avgConfidence =
      bucket.items.reduce((s, i) => s + i.confidence, 0) / bucket.items.length;

    const isNumeric = bucket.prefix === "__numeric__";
    const groupKey = isNumeric
      ? `carrusel-${bucket.items[0].suffix}-${bucket.items[bucket.items.length - 1].suffix}`
      : bucket.prefix;

    groups.push({
      groupKey,
      detectedType: "carousel",
      confidence: avgConfidence,
      reason: isNumeric
        ? `Imágenes numeradas ${bucket.items[0].suffix}-${bucket.items[bucket.items.length - 1].suffix} → un único carrusel`
        : `Prefijo "${bucket.prefix}" + sufijos ordenados → carrusel`,
      filenames: bucket.items.slice(0, 10).map((i) => i.filename),
    });
  }

  // 4. Imágenes sin patrón → quedan unmatched, el user (o el chat IA) decide
  for (const fn of noPattern) {
    unmatched.push(fn);
    groups.push({
      groupKey: fn.replace(/\.[^.]+$/, ""),
      detectedType: "image",
      confidence: 0.5,
      reason: "Imagen sin patrón claro → post individual (puede ser carrusel — pide al chat IA agrupar)",
      filenames: [fn],
    });
  }

  // 5. Asignar captions .txt al grupo cuyo nombre coincida
  for (const cap of captions) {
    const capBase = cap.filename.replace(/\.[^.]+$/, "");
    // Ignorar caption.txt genérico (lo trata el parser principal)
    if (capBase.toLowerCase() === "caption") continue;

    // Buscar grupo cuyo groupKey contenga el nombre del .txt o viceversa
    const match = groups.find(
      (g) =>
        g.groupKey === capBase ||
        g.groupKey.startsWith(capBase) ||
        capBase.startsWith(g.groupKey),
    );
    if (match) {
      match.captionFile = cap.filename;
    } else {
      warnings.push(
        `Caption "${cap.filename}" no se ha podido vincular a ningún post automáticamente.`,
      );
    }
  }

  return { groups, unmatched, warnings };
}

// ─────────────────────────────────────────
// CAPA 2: ANÁLISIS VISUAL CON OPENAI VISION
// ─────────────────────────────────────────

/**
 * Para imágenes sueltas que la heurística no agrupó, usa OpenAI Vision
 * para detectar carruseles por similitud visual + texto OCR.
 *
 * Solo se invoca desde el chat IA cuando el user lo pide explícitamente
 * (vía tool regroup_batch_with_ai). NO se usa en parse del ZIP por defecto
 * para no incurrir en coste sin consentimiento.
 *
 * Estrategia:
 *   - Envía hasta 20 imágenes de golpe a gpt-4o-mini con detail:low
 *   - Le pide: "agrupa por coherencia visual y propon orden"
 *   - Devuelve grupos refinados
 */
export interface VisionGroupingInput {
  // URLs públicas (R2) de las imágenes a analizar
  images: Array<{
    url: string;
    filename: string;
    /** Si la heurística ya las agrupó, indica el grupo provisional */
    provisionalGroup?: string;
  }>;
}

export interface VisionGroupingOutput {
  groups: Array<{
    groupKey: string;
    detectedType: "image" | "carousel";
    confidence: number;
    reason: string;
    /** filenames en orden propuesto por la IA */
    filenames: string[];
    captionDraft?: string;
  }>;
  warnings: string[];
}

const VISION_PROMPT = `Eres un editor de social media. Te paso imágenes de un usuario que las subió como un montón sin organizar. Tu tarea: identificar qué imágenes pertenecen al MISMO carrusel (story coherente, paleta de colores similar, tipografía/marca consistente, secuencia visual o textual obvia) y cuáles son posts independientes.

Reglas:
- Un carrusel típico tiene 2-10 imágenes con coherencia visual fuerte (misma plantilla, mismo fondo, secuencia "slide 1 / slide 2..." o continuidad de mensaje)
- Imágenes muy distintas entre sí (paletas, contenido, tema) → posts independientes
- Si detectas texto en imagen tipo "1/5", "swipe →", "parte 2" → asume que pertenecen al mismo carrusel
- Si dudas, prefiere posts independientes a un carrusel forzado
- Para cada grupo, sugiere el ORDEN óptimo (slide 1, 2, 3...) basado en el contenido

Devuelve JSON estricto:
{
  "groups": [
    {
      "groupKey": "string descriptivo corto (ej. 'tutorial-receta-pasta', 'antes-despues-cocina')",
      "detectedType": "image" | "carousel",
      "confidence": 0.0-1.0,
      "reason": "1 frase explicando por qué los agrupaste así",
      "filenames": ["en orden propuesto"],
      "captionDraft": "(opcional) caption sugerido en español natural si detectas el tema claramente"
    }
  ],
  "warnings": ["string", ...]
}`;

export async function groupWithVision(
  input: VisionGroupingInput,
): Promise<VisionGroupingOutput> {
  const { getOpenAI } = await import("@/lib/ai/openai");
  const client = getOpenAI();
  if (!client) {
    return {
      groups: [],
      warnings: ["OpenAI no configurado — no se puede analizar visualmente"],
    };
  }

  if (input.images.length === 0) {
    return { groups: [], warnings: [] };
  }

  if (input.images.length > 20) {
    // Limitar a 20 para no romper context window
    input.images = input.images.slice(0, 20);
  }

  try {
    const messages = [
      { role: "system" as const, content: VISION_PROMPT },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: `Analiza estas ${input.images.length} imágenes y agrúpalas. Los nombres de archivo son para tu referencia, no los uses para agrupar — fíjate solo en el contenido visual.\n\nArchivos:\n${input.images
              .map((i, idx) => `${idx + 1}. ${i.filename}`)
              .join("\n")}`,
          },
          ...input.images.map((img) => ({
            type: "image_url" as const,
            image_url: { url: img.url, detail: "low" as const },
          })),
        ],
      },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content ?? "";
    if (!content) {
      return {
        groups: [],
        warnings: ["Vision no devolvió contenido"],
      };
    }

    let parsed: VisionGroupingOutput;
    try {
      parsed = JSON.parse(content) as VisionGroupingOutput;
    } catch {
      return {
        groups: [],
        warnings: ["Vision devolvió JSON malformado"],
      };
    }

    // Filtrar grupos válidos (groups que referencien filenames inexistentes
    // se descartan)
    const validFilenames = new Set(input.images.map((i) => i.filename));
    const validGroups = (parsed.groups ?? [])
      .map((g) => ({
        ...g,
        filenames: g.filenames.filter((f) => validFilenames.has(f)),
      }))
      .filter((g) => g.filenames.length > 0);

    return {
      groups: validGroups,
      warnings: parsed.warnings ?? [],
    };
  } catch (err) {
    return {
      groups: [],
      warnings: [
        `Error en análisis visual: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }
}
