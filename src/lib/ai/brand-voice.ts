/**
 * Construcción del prompt cacheable que define la voz editorial de cada negocio.
 *
 * Estrategia:
 *   - Carga últimos 30 captions publicados como ejemplos few-shot.
 *   - Combina con BrandProfile simplificado (niche, tone, target, taboos).
 *   - Marca el bloque de ejemplos con `cache_control: { type: "ephemeral" }`
 *     para que peticiones consecutivas (5 min) lean del caché de Anthropic.
 *
 * Post-pivot: BrandProfile es plano (sin niveles L1-L5, sin LoRAs, sin voice
 * training). Solo metadata simple que el chat IA puede consultar y actualizar.
 */
import { db } from "@/lib/db";
import type { Anthropic } from "@anthropic-ai/sdk";

const MAX_EXAMPLES = 30;
const MAX_CHARS_PER_EXAMPLE = 1200;

export interface BrandVoiceContext {
  businessId: string;
  businessName: string;
  examples: string[];
  profile?: {
    niche?: string;
    tone?: string;
    targetAudience?: string;
    taboos?: string[];
    notes?: string;
  };
}

export async function loadBrandVoiceContext(
  businessId: string,
): Promise<BrandVoiceContext> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, brandProfile: true },
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

  const bp = business.brandProfile;
  return {
    businessId: business.id,
    businessName: business.name,
    examples,
    profile: bp
      ? {
          niche: bp.niche ?? undefined,
          tone: bp.tone ?? undefined,
          targetAudience: bp.targetAudience ?? undefined,
          taboos: Array.isArray(bp.taboos)
            ? (bp.taboos as string[])
            : undefined,
          notes: bp.notes ?? undefined,
        }
      : undefined,
  };
}

export function buildCaptionSystemBlocks(
  ctx: BrandVoiceContext,
): Anthropic.Messages.TextBlockParam[] {
  const intro = `Eres el redactor editorial de ${ctx.businessName}.
Generas captions de Instagram que mantienen la voz, ritmo y léxico de la marca.

# Reglas de oro
- Devuelve SÓLO el caption en texto plano, sin etiquetas markdown ni comillas envolventes.
- Imita el ritmo, longitud y tono de los ejemplos publicados.
- Si los ejemplos usan emojis con moderación, tú igual; si no los usan, evítalos.
- Termina con un CTA suave o pregunta cuando el patrón de la marca lo haga.
- Idioma: el predominante en los ejemplos.
- Longitud: aproximadamente la mediana de los ejemplos. Nunca pases de 2200 caracteres.
- No incluyas hashtags al final salvo que los ejemplos lo hagan habitualmente.

# Cómo trabajar el brief
- El usuario te pasará un brief breve y, opcionalmente, un canal (feed, reel, story).
- Tu trabajo es traducir ese brief a la voz de la marca, no inventar hechos nuevos.
- Si el brief es ambiguo, prioriza un tono editorial sobrio.`;

  const profileLines: string[] = [];
  if (ctx.profile) {
    const items: string[] = [];
    if (ctx.profile.niche) items.push(`Nicho: ${ctx.profile.niche}`);
    if (ctx.profile.tone) items.push(`Tono solicitado: ${ctx.profile.tone}`);
    if (ctx.profile.targetAudience)
      items.push(`Audiencia: ${ctx.profile.targetAudience}`);
    if (ctx.profile.taboos?.length)
      items.push(
        `Frases prohibidas: ${ctx.profile.taboos.map((t) => `"${t}"`).join(", ")}`,
      );
    if (ctx.profile.notes) items.push(`Notas: ${ctx.profile.notes}`);
    if (items.length > 0) {
      profileLines.push(`# Perfil de la marca`);
      profileLines.push(...items);
    }
  }

  const examplesBlock =
    ctx.examples.length === 0
      ? `# Ejemplos publicados\n(Aún no hay captions publicados. Usa un tono editorial sobrio, sin clichés de marketing.)`
      : `# Ejemplos publicados (${ctx.examples.length})

Captions REALES de la marca (más reciente a más antiguo). Aprende su ritmo
pero NO copies frases textualmente.

${ctx.examples
  .map((c, i) => `## Ejemplo ${i + 1}\n${c}`)
  .join("\n\n---\n\n")}`;

  const stableHead = [intro, profileLines.join("\n")]
    .filter(Boolean)
    .join("\n\n");

  return [
    { type: "text", text: stableHead },
    {
      type: "text",
      text: examplesBlock,
      cache_control: { type: "ephemeral" },
    },
  ];
}

/**
 * Bloques system para hashtags. Más cortos — Llama no necesita tanto contexto.
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
