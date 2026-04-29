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
import {
  buildVoiceFingerprintBlock,
  type VoiceProfile,
} from "@/lib/ai/voice-trainer";

const MAX_EXAMPLES = 30;
const MAX_CHARS_PER_EXAMPLE = 1200;

export interface BrandVoiceContext {
  businessId: string;
  businessName: string;
  examples: string[];
  /** L1-L5 — nivel actual de Brand DNA */
  level: string;
  /** Datos del questionnaire (L2 bootstrap) */
  bootstrap?: {
    tone?: string;
    description?: string;
    niche?: string;
    taboos?: string[];
  };
  /** Voice fingerprint entrenado (L3+) */
  voiceProfile?: VoiceProfile;
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
    level: bp?.level ?? "L1",
    bootstrap: bp
      ? {
          tone: bp.bootstrapTone ?? undefined,
          description: bp.bootstrapDescription ?? undefined,
          niche: bp.bootstrapNiche ?? undefined,
          taboos: Array.isArray(bp.bootstrapTaboos)
            ? (bp.bootstrapTaboos as string[])
            : undefined,
        }
      : undefined,
    voiceProfile: bp?.voiceProfile
      ? (bp.voiceProfile as unknown as VoiceProfile)
      : undefined,
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
- Imita el ritmo, longitud y tono del perfil de la marca.
- Si el perfil indica emojis con moderación, tú igual; si no los usan, evítalos.
- Termina con un CTA suave o pregunta cuando el patrón de la marca lo haga.
- Idioma: el detectado en el perfil de la marca.
- Longitud: aproximadamente la mediana indicada en el perfil. Nunca pases de 2200 caracteres.
- No incluyas hashtags al final salvo que el perfil lo haga habitualmente.

# Cómo trabajar el brief
- El usuario te pasará un brief breve y, opcionalmente, un canal (feed, reel, story).
- Tu trabajo es traducir ese brief a la voz de la marca, no inventar hechos nuevos.
- Si el brief es ambiguo, prioriza el tono detectado en el perfil.`;

  // Bootstrap (L2): usa los datos del questionnaire
  const bootstrapLines: string[] = [];
  if (ctx.bootstrap) {
    bootstrapLines.push(`# Bootstrap del onboarding`);
    if (ctx.bootstrap.description)
      bootstrapLines.push(`Descripción: ${ctx.bootstrap.description}`);
    if (ctx.bootstrap.tone)
      bootstrapLines.push(`Tono solicitado: ${ctx.bootstrap.tone}`);
    if (ctx.bootstrap.niche)
      bootstrapLines.push(`Nicho: ${ctx.bootstrap.niche}`);
    if (ctx.bootstrap.taboos?.length)
      bootstrapLines.push(
        `Frases prohibidas: ${ctx.bootstrap.taboos.map((t) => `"${t}"`).join(", ")}`,
      );
  }

  // Voice fingerprint (L3+): usa el JSON destilado del entrenamiento
  let fingerprintBlock = "";
  if (ctx.voiceProfile) {
    fingerprintBlock = buildVoiceFingerprintBlock(ctx.voiceProfile);
  }

  // Examples (siempre que haya): contexto de last-30 captions reales
  const examplesBlock =
    ctx.examples.length === 0
      ? ctx.voiceProfile || ctx.bootstrap
        ? `# Ejemplos publicados\n(Aún no hay captions publicados. Usa el perfil entrenado/bootstrap como guía.)`
        : `# Ejemplos publicados\n(Aún no hay captions publicados. Usa un tono editorial sobrio, italic-friendly, sin clichés de marketing.)`
      : `# Ejemplos publicados (${ctx.examples.length})

Captions REALES de la marca (más reciente a más antiguo). Aprende su ritmo
pero NO copies frases textualmente.

${ctx.examples
  .map((c, i) => `## Ejemplo ${i + 1}\n${c}`)
  .join("\n\n---\n\n")}`;

  // Cache breakpoint al final del bloque más estable (examples).
  // Bootstrap + fingerprint son estables también pero más cortos; los unimos
  // al intro que también es estable.
  const stableHead = [intro, bootstrapLines.join("\n"), fingerprintBlock]
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
