/**
 * Voice fingerprint trainer — analiza los captions publicados de un business
 * y extrae un perfil de voz estructurado (JSON) que la IA usa como contexto.
 *
 * Antes (Sprint 1-2): system prompt incluía los últimos 30 captions tal cual.
 * Ahora (Sprint 3): además del histórico, incluye el JSON destilado con
 * patrones explícitos (tono, longitud, CTA, emojis, frases prohibidas).
 *
 * Razón: con 10+ posts publicados, podemos extraer patrones más fiables que
 * el modelo "lea" entre líneas — guían su output con menos regens y mejor
 * tasa de éxito 1ª try (de 70% L2 → 85% L4 con LoRA).
 *
 * Uso:
 *   const profile = await trainVoiceFingerprint(businessId);
 *   // Guarda en BrandProfile.voiceProfile + actualiza level a L3
 */
import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getAnthropic, MODEL_CAPTION } from "@/lib/ai/anthropic";
import {
  isTogetherAvailable,
  llamaChat,
  MODEL_LLAMA_33_70B,
} from "@/lib/ai/together";

const MIN_POSTS_FOR_TRAINING = 10;
const MAX_POSTS_TO_ANALYZE = 60;

export interface VoiceProfile {
  // Tono detectado (uno de los 5 presets o "mixto")
  detectedTone: string;
  // Confianza 0-1 del tono detectado
  toneConfidence: number;
  // Longitud típica
  lengthStats: {
    median: number;
    p25: number;
    p75: number;
  };
  // Uso de emojis
  emojiUsage: {
    frequency: "none" | "rare" | "moderate" | "heavy";
    commonEmojis: string[]; // top 10
  };
  // Patrones de CTA
  ctaPatterns: string[]; // ["link en bio", "DM nos", "comenta abajo", ...]
  // Frases que se repiten
  recurringPhrases: string[]; // top 15
  // Estructura típica
  structurePattern: string; // ej "hook 1 línea + cuerpo 2-3 líneas + CTA"
  // Léxico evitado (detectado de rechazos + auto-detectado)
  taboos: string[];
  // Idioma
  language: string;
  // Versión del schema
  version: number;
  trainedAt: string; // ISO
  postsAnalyzed: number;
}

interface TrainResult {
  ok: boolean;
  profile?: VoiceProfile;
  level?: string;
  error?: string;
  reason?: string;
}

/**
 * Entrena el voice fingerprint a partir de los posts publicados de un business.
 * Si tiene menos de MIN_POSTS_FOR_TRAINING, devuelve ok=false con razón.
 */
export async function trainVoiceFingerprint(
  businessId: string,
): Promise<TrainResult> {
  const client = getAnthropic();
  const useTogether = !client && isTogetherAvailable();
  if (!client && !useTogether) {
    return {
      ok: false,
      error: "Configura ANTHROPIC_API_KEY o TOGETHER_API_KEY",
    };
  }

  const drafts = await db.postDraft.findMany({
    where: {
      businessId,
      status: "PUBLISHED",
      caption: { not: "" },
    },
    select: { caption: true, publishedAt: true, postType: true },
    orderBy: { publishedAt: "desc" },
    take: MAX_POSTS_TO_ANALYZE,
  });

  if (drafts.length < MIN_POSTS_FOR_TRAINING) {
    return {
      ok: false,
      reason: `Necesitas ${MIN_POSTS_FOR_TRAINING}+ posts publicados (tienes ${drafts.length}).`,
    };
  }

  const captions = drafts.map((d) => d.caption.trim()).filter(Boolean);

  // Stats numéricos previos al LLM (para ahorrar tokens)
  const lengths = captions.map((c) => c.length).sort((a, b) => a - b);
  const median = lengths[Math.floor(lengths.length / 2)];
  const p25 = lengths[Math.floor(lengths.length * 0.25)];
  const p75 = lengths[Math.floor(lengths.length * 0.75)];

  // Top emojis frecuentes (regex simple)
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  const emojiCounts = new Map<string, number>();
  for (const c of captions) {
    const found = c.match(emojiRegex) ?? [];
    for (const e of found) {
      emojiCounts.set(e, (emojiCounts.get(e) ?? 0) + 1);
    }
  }
  const totalEmojis = Array.from(emojiCounts.values()).reduce((a, b) => a + b, 0);
  const totalChars = captions.reduce((a, c) => a + c.length, 0);
  const emojiDensity = totalEmojis / Math.max(1, totalChars / 100); // emojis per 100 chars
  const emojiFreq: VoiceProfile["emojiUsage"]["frequency"] =
    emojiDensity < 0.1
      ? "none"
      : emojiDensity < 0.5
        ? "rare"
        : emojiDensity < 2
          ? "moderate"
          : "heavy";
  const commonEmojis = Array.from(emojiCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([e]) => e);

  // LLM analiza los captions y devuelve JSON con patrones cualitativos
  const systemPrompt = `Eres un analista experto de voz de marca para Instagram. Analizas captions y extraes patrones estructurales en formato JSON estricto.

Devuelves SÓLO un objeto JSON con esta forma exacta:

{
  "detectedTone": "formal_editorial" | "casual_cercano" | "irreverente" | "premium_luxury" | "tecnico" | "mixto",
  "toneConfidence": 0.0-1.0,
  "ctaPatterns": ["..."],          // formas de CTA usadas (max 8)
  "recurringPhrases": ["..."],     // frases que aparecen ≥3 veces (max 15)
  "structurePattern": "...",       // descripción de la estructura típica
  "taboos": ["..."],               // palabras/frases que NUNCA se usan en este léxico
  "language": "es" | "es-LATAM" | "ca" | "en" | "mixto"
}

Reglas:
- "ctaPatterns": frases tipo "link en bio", "DM nos", "comenta abajo".
  No inventes — sólo las que ves en los ejemplos.
- "recurringPhrases": frases (no palabras sueltas) que aparezcan textualmente
  3+ veces. No incluyas hashtags ni @menciones.
- "taboos": palabras/frases que NO aparecen pero que SERÍAN raras para esta voz
  (ej: una marca seria probablemente evita "imperdible" o "🤩").
  Lista 5-10 ejemplos plausibles basados en el tono.
- "structurePattern": describe en una frase la estructura típica
  (ej: "Hook breve + cuerpo descriptivo + CTA + hashtags al final").

Devuelve SÓLO el JSON. Sin markdown fences, sin explicación.`;

  const userPrompt = `Analiza estos ${captions.length} captions de la cuenta:

${captions.map((c, i) => `## ${i + 1}\n${c.slice(0, 800)}`).join("\n\n---\n\n")}`;

  let llmJson: Partial<VoiceProfile>;
  try {
    let text: string;
    if (client) {
      const response = await client.messages.create({
        model: MODEL_CAPTION,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      text = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
    } else {
      // Fallback Together Llama 3.3 con json_object mode
      const llamaResp = await llamaChat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: MODEL_LLAMA_33_70B,
        maxTokens: 1500,
        temperature: 0.3, // más determinista para análisis estructural
        jsonMode: true,
      });
      text = llamaResp.text.trim();
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ok: false, error: "La IA no devolvió JSON parseable" };
    }
    llmJson = JSON.parse(jsonMatch[0]);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AI call failed",
    };
  }

  const profile: VoiceProfile = {
    detectedTone: llmJson.detectedTone ?? "mixto",
    toneConfidence: typeof llmJson.toneConfidence === "number"
      ? Math.max(0, Math.min(1, llmJson.toneConfidence))
      : 0.5,
    lengthStats: { median, p25, p75 },
    emojiUsage: {
      frequency: emojiFreq,
      commonEmojis,
    },
    ctaPatterns: Array.isArray(llmJson.ctaPatterns)
      ? llmJson.ctaPatterns.slice(0, 8)
      : [],
    recurringPhrases: Array.isArray(llmJson.recurringPhrases)
      ? llmJson.recurringPhrases.slice(0, 15)
      : [],
    structurePattern: llmJson.structurePattern ?? "",
    taboos: Array.isArray(llmJson.taboos) ? llmJson.taboos.slice(0, 10) : [],
    language: llmJson.language ?? "es",
    version: 1,
    trainedAt: new Date().toISOString(),
    postsAnalyzed: captions.length,
  };

  // Persistir en BrandProfile + subir level a L3
  await db.brandProfile.upsert({
    where: { businessId },
    create: {
      businessId,
      level: "L3",
      voiceProfile: profile as unknown as object,
      voiceLastTrained: new Date(),
      voicePostCount: captions.length,
    },
    update: {
      level: "L3",
      voiceProfile: profile as unknown as object,
      voiceLastTrained: new Date(),
      voicePostCount: captions.length,
    },
  });

  return { ok: true, profile, level: "L3" };
}

/**
 * Construye un bloque de texto compacto para inyectar en el system prompt
 * de /api/ai/caption con el voice profile entrenado. Reemplaza la lista
 * de 30 captions cuando hay perfil L3+.
 */
export function buildVoiceFingerprintBlock(profile: VoiceProfile): string {
  const lines = [
    `# Perfil de voz entrenado (${profile.postsAnalyzed} posts analizados)`,
    "",
    `Tono detectado: ${profile.detectedTone} (confianza ${(profile.toneConfidence * 100).toFixed(0)}%)`,
    `Idioma: ${profile.language}`,
    `Longitud típica: ${profile.lengthStats.p25}-${profile.lengthStats.p75} chars (mediana ${profile.lengthStats.median})`,
    `Estructura: ${profile.structurePattern}`,
    "",
    `Emojis: ${profile.emojiUsage.frequency}${profile.emojiUsage.commonEmojis.length ? ` · habituales: ${profile.emojiUsage.commonEmojis.join(" ")}` : ""}`,
  ];

  if (profile.ctaPatterns.length) {
    lines.push("");
    lines.push(`CTAs habituales: ${profile.ctaPatterns.map((p) => `"${p}"`).join(", ")}`);
  }

  if (profile.recurringPhrases.length) {
    lines.push("");
    lines.push(`Frases recurrentes (úsalas con moderación, no copiar siempre):`);
    for (const p of profile.recurringPhrases) {
      lines.push(`  - "${p}"`);
    }
  }

  if (profile.taboos.length) {
    lines.push("");
    lines.push(`NUNCA usar estas palabras/frases: ${profile.taboos.map((t) => `"${t}"`).join(", ")}`);
  }

  return lines.join("\n");
}
