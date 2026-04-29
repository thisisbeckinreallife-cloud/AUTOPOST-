/**
 * Construcción del prompt cacheable que define la voz editorial de cada negocio.
 *
 * Estrategia:
 *   - Sacamos los últimos 30 captions publicados como ejemplos few-shot.
 *   - Construimos un bloque "system" estable: instrucciones + ejemplos.
 *   - Marcamos ese bloque con `cache_control: { type: "ephemeral" }` para
 *     que las próximas peticiones (en los siguientes 5 min) lean del caché
 *     a ~10% del precio de input.
 *
 * El bloque sólo se invalida cuando el negocio publica un nuevo post o
 * el usuario pulsa "Refrescar voz" — disparamos `bumpBrandVoiceCache(businessId)`.
 *
 * El tamaño objetivo del bloque es 5–15k tokens (≈ 30 captions de 300 palabras
 * + instrucciones), suficiente para que el caché compense el coste de creación.
 */
import { db } from "@/lib/db";
import type { Anthropic } from "@anthropic-ai/sdk";

const MAX_EXAMPLES = 30;
const MAX_CHARS_PER_EXAMPLE = 1200;

export interface BrandVoiceContext {
  businessId: string;
  businessName: string;
  examples: string[];
}

/**
 * Carga los últimos N captions publicados de un negocio.
 * Se filtra por status PUBLISHED para no contaminar la voz con drafts
 * abandonados.
 */
export async function loadBrandVoiceContext(
  businessId: string,
): Promise<BrandVoiceContext> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) throw new Error("Business not found");

  const drafts = await db.postDraft.findMany({
    where: {
      businessId,
      status: "PUBLISHED",
      caption: { not: "" },
    },
    select: { caption: true },
    orderBy: { publishedAt: "desc" },
    take: MAX_EXAMPLES,
  });

  const examples = drafts
    .map((d) => d.caption.slice(0, MAX_CHARS_PER_EXAMPLE).trim())
    .filter((c) => c.length > 20);

  return {
    businessId: business.id,
    businessName: business.name,
    examples,
  };
}

/**
 * Construye los bloques `system` para una petición de generación de caption.
 *
 * Los bloques se devuelven en orden estable para que el caché coincida:
 *   [0] instrucciones generales (estables, no cacheables solas pero forman parte del prefix)
 *   [1] ejemplos del negocio (estable durante 5 min, cacheable)
 *
 * `cache_control` marca el FINAL del prefix cacheable. Todo desde el principio
 * hasta el bloque marcado es candidato a caché. La pieza volátil (brief del
 * usuario, channel, etc.) va en `messages` después.
 */
export function buildCaptionSystemBlocks(
  ctx: BrandVoiceContext,
): Anthropic.Messages.TextBlockParam[] {
  const intro = `Eres el redactor editorial de ${ctx.businessName}.
Generas captions de Instagram que mantienen la voz, ritmo y léxico de la marca.

# Reglas de oro
- Devuelve SÓLO el caption en texto plano, sin etiquetas markdown ni comillas envolventes.
- Imita el ritmo, longitud y tono de los ejemplos. No copies frases textuales.
- Si los ejemplos usan emojis con moderación, tú igual; si no los usan, evítalos.
- Termina con un CTA suave o pregunta cuando el patrón de la marca lo haga.
- Idioma: español neutro o el que predomine en los ejemplos.
- Longitud: aproximadamente la mediana de los ejemplos. Nunca pases de 2200 caracteres.
- No incluyas hashtags al final salvo que los ejemplos lo hagan habitualmente.

# Cómo trabajar el brief
- El usuario te pasará un brief breve y, opcionalmente, un canal (feed, reel, story).
- Tu trabajo es traducir ese brief a la voz de la marca, no inventar hechos nuevos.
- Si el brief es ambiguo, prioriza tono editorial y dejas el gancho abierto.`;

  const examplesBlock =
    ctx.examples.length === 0
      ? `# Ejemplos publicados\n(Aún no hay captions publicados. Usa un tono editorial sobrio, italic-friendly, sin clichés de marketing.)`
      : `# Ejemplos publicados (${ctx.examples.length})

Estos son captions REALES de la marca, ordenados de más reciente a más antiguo.
Aprende su léxico, longitud y ritmo.

${ctx.examples
  .map((c, i) => `## Ejemplo ${i + 1}\n${c}`)
  .join("\n\n---\n\n")}`;

  return [
    { type: "text", text: intro },
    {
      type: "text",
      text: examplesBlock,
      cache_control: { type: "ephemeral" },
    },
  ];
}

/**
 * Bloques system para hashtags. Más cortos — Haiku no necesita tanto contexto.
 */
export function buildHashtagSystemBlocks(
  ctx: BrandVoiceContext,
): Anthropic.Messages.TextBlockParam[] {
  const intro = `Eres un estratega de hashtags para Instagram. Trabajas para ${ctx.businessName}.

# Reglas
- Devuelve SÓLO un JSON con la forma: {"primary": string[], "secondary": string[]}
- "primary": 8 hashtags de nicho, comunidad pequeña pero relevante (entre 10K y 500K posts).
- "secondary": 12 hashtags de cola larga, descriptivos del contenido específico.
- Sin tope de #generic ni #love. Hashtags concretos.
- En el idioma predominante de los captions de la marca.
- Sin punto final, sin numeración, sólo el array.`;

  const examplesText =
    ctx.examples.length === 0
      ? `# Voz\n(Sin ejemplos previos — usa hashtags editoriales sobrios.)`
      : `# Captions recientes para entender el nicho\n\n${ctx.examples
          .slice(0, 10)
          .map((c, i) => `${i + 1}. ${c.slice(0, 280)}`)
          .join("\n")}`;

  return [
    { type: "text", text: intro },
    {
      type: "text",
      text: examplesText,
      cache_control: { type: "ephemeral" },
    },
  ];
}
