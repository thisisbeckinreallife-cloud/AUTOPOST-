/**
 * Reglas de formato por plataforma — lo que cada red social espera
 * para que un post genere buena imagen de marca y se vea bien.
 *
 * Se usa para:
 *   1. Validar antes de publicar (advertir al user)
 *   2. Enseñar al chat IA a recomendar plataformas adecuadas según
 *      el tipo de media subido (vía tool analyze_format_compatibility)
 *   3. Mostrar avisos en la UI del PostDetail cuando una plataforma
 *      target tiene contenido incompatible
 *
 * Severity:
 *   - "blocker": NO se puede publicar (la API rechaza). Bloquea publish.
 *   - "warning": se publicará pero queda mal (mala calidad, recortado,
 *     baja interacción esperada). Sólo aviso.
 *   - "tip": optimización opcional para mejorar resultado.
 */

export type Severity = "blocker" | "warning" | "tip";

export interface FormatIssue {
  platform:
    | "INSTAGRAM"
    | "FACEBOOK"
    | "TIKTOK"
    | "LINKEDIN"
    | "YOUTUBE"
    | "PINTEREST";
  severity: Severity;
  message: string;
  /** Sugerencia accionable para el user */
  recommendation?: string;
}

export interface MediaSpec {
  /** "image/jpeg" | "image/png" | "video/mp4" | etc. */
  mimeType: string;
  width?: number | null;
  height?: number | null;
  /** Segundos */
  durationSec?: number | null;
  /** Bytes */
  fileSize: number;
}

export type PostType = "IMAGE" | "CAROUSEL" | "REEL";

interface ValidationContext {
  postType: PostType;
  mediaAssets: MediaSpec[];
  hasCaption: boolean;
  caption: string;
}

// ─────────────────────────────────────────
// PLATFORM RULES — números reales 2026
// ─────────────────────────────────────────

interface PlatformRule {
  platform: FormatIssue["platform"];
  displayName: string;
  /** Tipos de post aceptados nativamente */
  acceptedPostTypes: PostType[];
  /** Aspect ratios óptimos (W/H) */
  optimalAspectRatios: { ratio: number; label: string }[];
  /** Aspect ratios aceptables (no recortados) */
  acceptableAspectRange: { min: number; max: number };
  /** Resolución mínima (lado largo) */
  minDimension?: number;
  /** Duración video — segundos */
  videoMinSec?: number;
  videoMaxSec?: number;
  /** Tamaño max archivo MB */
  maxFileSizeMB: number;
  /** Caption max chars */
  captionMaxChars: number;
  /** Mime types aceptados */
  acceptedMime: { image: string[]; video: string[] };
}

const PLATFORM_RULES: PlatformRule[] = [
  {
    platform: "INSTAGRAM",
    displayName: "Instagram",
    acceptedPostTypes: ["IMAGE", "CAROUSEL", "REEL"],
    optimalAspectRatios: [
      { ratio: 1, label: "cuadrado 1:1" },
      { ratio: 4 / 5, label: "vertical 4:5" },
      { ratio: 9 / 16, label: "Reel 9:16" },
    ],
    acceptableAspectRange: { min: 0.5625, max: 1.91 }, // 9:16 a 1.91:1
    minDimension: 320,
    videoMinSec: 3,
    videoMaxSec: 90,
    maxFileSizeMB: 100,
    captionMaxChars: 2200,
    acceptedMime: {
      image: ["image/jpeg", "image/png"],
      video: ["video/mp4", "video/quicktime"],
    },
  },
  {
    platform: "FACEBOOK",
    displayName: "Facebook",
    acceptedPostTypes: ["IMAGE", "CAROUSEL", "REEL"],
    optimalAspectRatios: [
      { ratio: 1, label: "cuadrado 1:1" },
      { ratio: 9 / 16, label: "Reel 9:16" },
    ],
    acceptableAspectRange: { min: 0.5625, max: 1.91 },
    minDimension: 600,
    videoMinSec: 3,
    videoMaxSec: 240,
    maxFileSizeMB: 240,
    captionMaxChars: 63206,
    acceptedMime: {
      image: ["image/jpeg", "image/png"],
      video: ["video/mp4", "video/quicktime"],
    },
  },
  {
    platform: "TIKTOK",
    displayName: "TikTok",
    acceptedPostTypes: ["REEL"], // SOLO video
    optimalAspectRatios: [{ ratio: 9 / 16, label: "vertical 9:16" }],
    acceptableAspectRange: { min: 0.5, max: 1.78 },
    minDimension: 540,
    videoMinSec: 3,
    videoMaxSec: 180,
    maxFileSizeMB: 287,
    captionMaxChars: 2200,
    acceptedMime: {
      image: [], // TikTok feed no acepta image-only via API
      video: ["video/mp4", "video/quicktime"],
    },
  },
  {
    platform: "LINKEDIN",
    displayName: "LinkedIn",
    acceptedPostTypes: ["IMAGE", "REEL"], // carrusel nativo no por API v5
    optimalAspectRatios: [
      { ratio: 1.91, label: "horizontal 1.91:1" },
      { ratio: 1, label: "cuadrado 1:1" },
    ],
    acceptableAspectRange: { min: 0.5625, max: 2.4 },
    minDimension: 552,
    videoMinSec: 3,
    videoMaxSec: 600,
    maxFileSizeMB: 200,
    captionMaxChars: 3000,
    acceptedMime: {
      image: ["image/jpeg", "image/png"],
      video: ["video/mp4"],
    },
  },
  {
    platform: "YOUTUBE",
    displayName: "YouTube Shorts",
    acceptedPostTypes: ["REEL"],
    optimalAspectRatios: [{ ratio: 9 / 16, label: "vertical 9:16" }],
    acceptableAspectRange: { min: 0.5, max: 1.78 },
    minDimension: 720,
    videoMinSec: 3,
    videoMaxSec: 60,
    maxFileSizeMB: 256,
    captionMaxChars: 5000,
    acceptedMime: {
      image: [],
      video: ["video/mp4", "video/quicktime"],
    },
  },
  {
    platform: "PINTEREST",
    displayName: "Pinterest",
    acceptedPostTypes: ["IMAGE", "CAROUSEL"], // Video pin requiere /v5/media (fase 2)
    optimalAspectRatios: [
      { ratio: 2 / 3, label: "vertical 2:3 (óptimo)" },
      { ratio: 9 / 16, label: "vertical 9:16" },
    ],
    acceptableAspectRange: { min: 0.5, max: 1.5 },
    minDimension: 600,
    maxFileSizeMB: 32,
    captionMaxChars: 800,
    acceptedMime: {
      image: ["image/jpeg", "image/png"],
      video: [], // por ahora no soportado
    },
  },
];

// ─────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────

export function validatePostForPlatform(
  rule: PlatformRule,
  ctx: ValidationContext,
): FormatIssue[] {
  const issues: FormatIssue[] = [];

  // 1. Tipo de post
  if (!rule.acceptedPostTypes.includes(ctx.postType)) {
    const accepted = rule.acceptedPostTypes
      .map((t) => t.toLowerCase())
      .join(" o ");
    issues.push({
      platform: rule.platform,
      severity: "blocker",
      message: `${rule.displayName} no acepta posts de tipo "${ctx.postType.toLowerCase()}". Solo ${accepted}.`,
      recommendation: explainPostTypeAlternative(rule, ctx.postType),
    });
    // Si el tipo de post no es válido, el resto de checks no aplica
    return issues;
  }

  // 2. Caption length
  if (ctx.caption.length > rule.captionMaxChars) {
    issues.push({
      platform: rule.platform,
      severity: "warning",
      message: `Caption excede los ${rule.captionMaxChars} chars que ${rule.displayName} permite (${ctx.caption.length}). Se cortará al publicar.`,
      recommendation: `Acórtalo a ${rule.captionMaxChars} chars para que se vea entero.`,
    });
  }

  // 3. Cada media asset
  for (let i = 0; i < ctx.mediaAssets.length; i++) {
    const m = ctx.mediaAssets[i];
    const isImage = m.mimeType.startsWith("image/");
    const isVideo = m.mimeType.startsWith("video/");
    const labelN = ctx.mediaAssets.length > 1 ? ` #${i + 1}` : "";

    // Mime type
    const acceptedMimes = isImage
      ? rule.acceptedMime.image
      : rule.acceptedMime.video;
    if (acceptedMimes.length === 0) {
      issues.push({
        platform: rule.platform,
        severity: "blocker",
        message: `${rule.displayName} no acepta ${isImage ? "imágenes" : "videos"} sueltos${labelN}.`,
        recommendation: isImage && rule.acceptedMime.video.length > 0
          ? "Convierte la imagen en video corto (3-15s) para que TikTok/YT puedan subirla."
          : undefined,
      });
      continue;
    }
    if (!acceptedMimes.includes(m.mimeType)) {
      issues.push({
        platform: rule.platform,
        severity: "blocker",
        message: `Formato ${m.mimeType}${labelN} no soportado por ${rule.displayName}. Acepta: ${acceptedMimes.join(", ")}.`,
      });
      continue;
    }

    // Tamaño
    const fileSizeMB = m.fileSize / (1024 * 1024);
    if (fileSizeMB > rule.maxFileSizeMB) {
      issues.push({
        platform: rule.platform,
        severity: "blocker",
        message: `Archivo${labelN} pesa ${fileSizeMB.toFixed(1)} MB — ${rule.displayName} acepta máx ${rule.maxFileSizeMB} MB.`,
        recommendation: "Comprime el archivo o reduce calidad antes de subir.",
      });
    }

    // Aspect ratio
    if (m.width && m.height) {
      const ratio = m.width / m.height;
      const inRange =
        ratio >= rule.acceptableAspectRange.min &&
        ratio <= rule.acceptableAspectRange.max;
      if (!inRange) {
        issues.push({
          platform: rule.platform,
          severity: "blocker",
          message: `Aspect ratio ${ratio.toFixed(2)}${labelN} fuera del rango aceptable de ${rule.displayName} (${rule.acceptableAspectRange.min.toFixed(2)}–${rule.acceptableAspectRange.max.toFixed(2)}).`,
          recommendation: `Recorta a ${rule.optimalAspectRatios[0].label}.`,
        });
      } else {
        // Está en rango pero ¿es óptimo?
        const closestOpt = rule.optimalAspectRatios.reduce((best, opt) =>
          Math.abs(ratio - opt.ratio) < Math.abs(ratio - best.ratio) ? opt : best,
        );
        const distance = Math.abs(ratio - closestOpt.ratio);
        if (distance > 0.15) {
          issues.push({
            platform: rule.platform,
            severity: "warning",
            message: `Ratio ${ratio.toFixed(2)}${labelN} no es ideal en ${rule.displayName}. Se verá con bandas o recortado.`,
            recommendation: `Para el mejor look usa ${closestOpt.label} (${closestOpt.ratio.toFixed(2)}).`,
          });
        }
      }

      // Resolución mínima
      const longSide = Math.max(m.width, m.height);
      if (rule.minDimension && longSide < rule.minDimension) {
        issues.push({
          platform: rule.platform,
          severity: "warning",
          message: `Resolución ${m.width}×${m.height}${labelN} es baja para ${rule.displayName}. Mínimo recomendado: ${rule.minDimension}px lado largo.`,
          recommendation: "Sube versión de mayor calidad para evitar pixelado.",
        });
      }
    }

    // Duración video
    if (isVideo && m.durationSec != null) {
      if (rule.videoMinSec && m.durationSec < rule.videoMinSec) {
        issues.push({
          platform: rule.platform,
          severity: "blocker",
          message: `Video${labelN} dura ${m.durationSec.toFixed(1)}s — ${rule.displayName} requiere mínimo ${rule.videoMinSec}s.`,
        });
      }
      if (rule.videoMaxSec && m.durationSec > rule.videoMaxSec) {
        issues.push({
          platform: rule.platform,
          severity: "blocker",
          message: `Video${labelN} dura ${m.durationSec.toFixed(0)}s — ${rule.displayName} acepta máx ${rule.videoMaxSec}s.`,
          recommendation: `Recorta a ${rule.videoMaxSec}s o publica en otra plataforma con mayor duración.`,
        });
      }
    }
  }

  // Tips per platform
  if (rule.platform === "TIKTOK" && ctx.postType === "REEL") {
    const firstVideo = ctx.mediaAssets.find((m) => m.mimeType.startsWith("video/"));
    if (firstVideo?.width && firstVideo.height) {
      const ratio = firstVideo.width / firstVideo.height;
      if (ratio > 0.65) {
        issues.push({
          platform: "TIKTOK",
          severity: "tip",
          message:
            "TikTok premia mucho el video vertical 9:16 a pantalla completa. Tu video no es estrictamente vertical.",
          recommendation: "Reencuadra a 9:16 — el alcance orgánico será mucho mayor.",
        });
      }
    }
  }

  if (rule.platform === "PINTEREST") {
    const firstImage = ctx.mediaAssets.find((m) => m.mimeType.startsWith("image/"));
    if (firstImage?.width && firstImage.height) {
      const ratio = firstImage.width / firstImage.height;
      if (ratio > 0.85) {
        issues.push({
          platform: "PINTEREST",
          severity: "tip",
          message:
            "Pinterest favorece pines verticales. Tu imagen es cuadrada o horizontal.",
          recommendation: "Crea versión 2:3 (1000×1500) para máxima visibilidad.",
        });
      }
    }
  }

  return issues;
}

function explainPostTypeAlternative(rule: PlatformRule, postType: PostType): string {
  if (rule.platform === "TIKTOK" && postType === "IMAGE") {
    return "TikTok no acepta imágenes sueltas en el feed principal vía API. Conviértela en un video corto (foto + audio) o mejor publícala en Instagram/LinkedIn.";
  }
  if (rule.platform === "TIKTOK" && postType === "CAROUSEL") {
    return "TikTok no admite carruseles vía API oficial. Considera publicarlo como Reel o usar Instagram para el carrusel.";
  }
  if (rule.platform === "YOUTUBE" && postType !== "REEL") {
    return "YouTube Shorts solo acepta videos verticales. Si tu contenido es estático, mejor en Instagram/Pinterest/LinkedIn.";
  }
  if (rule.platform === "PINTEREST" && postType === "REEL") {
    return "Para Pinterest, mejor extrae un frame del video como imagen vertical 2:3 — los video pins requieren upload aparte que no soportamos aún.";
  }
  if (rule.platform === "LINKEDIN" && postType === "CAROUSEL") {
    return "LinkedIn no soporta carruseles nativos vía API — publicaremos solo la primera imagen + caption con nota explicando.";
  }
  return "Cambia el tipo de post o quita esta plataforma del destino.";
}

// ─────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────

export interface CompatibilityReport {
  platform: FormatIssue["platform"];
  recommended: boolean;
  issues: FormatIssue[];
  blockerCount: number;
  warningCount: number;
  tipCount: number;
}

/**
 * Genera un informe de compatibilidad para todas las plataformas
 * relevantes dado un post. Útil para que el chat IA recomiende.
 */
export function analyzePostCompatibility(
  ctx: ValidationContext,
  platforms?: FormatIssue["platform"][],
): CompatibilityReport[] {
  const targetPlatforms = platforms
    ? PLATFORM_RULES.filter((r) => platforms.includes(r.platform))
    : PLATFORM_RULES;

  return targetPlatforms.map((rule) => {
    const issues = validatePostForPlatform(rule, ctx);
    const blockerCount = issues.filter((i) => i.severity === "blocker").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const tipCount = issues.filter((i) => i.severity === "tip").length;

    return {
      platform: rule.platform,
      recommended: blockerCount === 0 && warningCount <= 1,
      issues,
      blockerCount,
      warningCount,
      tipCount,
    };
  });
}

/**
 * Valida un post para UNA plataforma específica — útil cuando el user
 * va a publicar y queremos bloquear blockers.
 */
export function getIssuesForPlatform(
  platform: FormatIssue["platform"],
  ctx: ValidationContext,
): FormatIssue[] {
  const rule = PLATFORM_RULES.find((r) => r.platform === platform);
  if (!rule) return [];
  return validatePostForPlatform(rule, ctx);
}
