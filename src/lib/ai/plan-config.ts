/**
 * Configuración central de planes y costes de créditos por acción IA.
 *
 * Una sola fuente de verdad — referenciada por:
 *   - consumeCredit() al verificar/cobrar créditos
 *   - UI badges (mostrar coste antes de generar)
 *   - reset job mensual (saber cuántos créditos asignar)
 *   - Stripe webhook (mapear price_id → plan + credits)
 *
 * Los costes están en créditos (1 crédito = $0.10 retail).
 */
import type { PlanTier } from "@prisma/client";

export type AiActionType =
  | "caption"
  | "hashtags"
  | "image_schnell"
  | "image_dev"
  | "image_pro"
  | "quick_reel"
  | "pro_reel"
  | "cinematic_reel"
  | "chat_post"
  | "chat_reel"
  | "organize_zip"
  | "remix_carousel"
  | "remix_image"
  | "extract_palette"
  | "analyze_reference"
  | "brand_lora_train"
  | "voice_profile_refresh"
  | "trend_insights";

/**
 * Coste en créditos de cada acción IA.
 * Calibrado para margen 60-90% sobre coste real de provider (Anthropic + Together).
 */
export const CREDIT_COST: Record<AiActionType, number> = {
  caption: 1,                  // Sonnet + cache → $0.005 cost vs $0.10 retail = 20×
  hashtags: 1,                 // Llama 3.3 → $0.0003 vs $0.10 = 300×
  image_schnell: 1,            // FLUX schnell → $0.003 vs $0.10 = 33×
  image_dev: 3,                // FLUX dev → $0.015 vs $0.30 = 20×
  image_pro: 5,                // FLUX pro → $0.04 vs $0.50 = 12×
  quick_reel: 8,               // LTX/Hunyuan via fal.ai → $0.20 vs $0.80 = 4×
  pro_reel: 20,                // Kling 2.1 → $0.92 vs $2.00 = 2.2×
  cinematic_reel: 25,          // Sora 2 → $0.80 vs $2.50 = 3×
  chat_post: 4,                // caption + image_dev = 1+3 = 4 (atómico)
  chat_reel: 21,               // caption + pro_reel = 1+20 = 21 (atómico)
  organize_zip: 10,            // 30 captions + vision clustering, batch
  remix_carousel: 25,          // 5 imgs FLUX Kontext → $0.20 vs $2.50 = 12×
  remix_image: 5,              // 1 img FLUX Kontext → $0.04 vs $0.50 = 12×
  extract_palette: 0,          // gratis, prep step (Llama vision)
  analyze_reference: 0,        // gratis, prep step (Llama vision)
  brand_lora_train: 0,         // incluido en plan (no cobramos al user)
  voice_profile_refresh: 0,    // incluido en plan
  trend_insights: 0,           // incluido en plan
};

/**
 * Configuración de cada plan tier:
 *   - monthlyCredits: allotment al inicio de cada ciclo (caduca)
 *   - businessLimit: cuántas cuentas IG puede gestionar
 *   - includedReels: reels gratis del plan (cuota separada de créditos)
 *   - features: capabilities habilitadas
 */
export interface PlanConfig {
  tier: PlanTier;
  displayName: string;
  priceUsdMonth: number;
  monthlyCredits: number;
  businessLimit: number;
  postsLimitMonth: number | null; // null = ilimitado
  includedReels: number;          // reels mensuales en cuota separada
  brandDnaLevel: "L1" | "L2" | "L3" | "L4" | "L5";
  features: {
    visualLora: boolean;
    visualLoraRefreshFrequency: "monthly" | "quarterly" | "never";
    chatAi: boolean;
    referenceImages: boolean;
    carouselRemix: boolean;
    trendInsights: boolean;
    competitorMonitoring: number;     // 0 si no
    approvalWorkflow: boolean;
    editorialReports: boolean;
    multiClient: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
    sla: boolean;
    watermark: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  FREE: {
    tier: "FREE",
    displayName: "Free",
    priceUsdMonth: 0,
    monthlyCredits: 0, // Free usa trial credits one-shot, no recurring
    businessLimit: 1,
    postsLimitMonth: 30,
    includedReels: 0,
    brandDnaLevel: "L1",
    features: {
      visualLora: false,
      visualLoraRefreshFrequency: "never",
      chatAi: false,
      referenceImages: false,
      carouselRemix: false,
      trendInsights: false,
      competitorMonitoring: 0,
      approvalWorkflow: false,
      editorialReports: false,
      multiClient: false,
      whiteLabel: false,
      apiAccess: false,
      sla: false,
      watermark: true,
    },
  },
  PRO_SOLO: {
    tier: "PRO_SOLO",
    displayName: "Pro Solo",
    priceUsdMonth: 25,
    monthlyCredits: 250,
    businessLimit: 2,
    postsLimitMonth: null,
    includedReels: 0,
    brandDnaLevel: "L3",
    features: {
      visualLora: false,
      visualLoraRefreshFrequency: "never",
      chatAi: true,
      referenceImages: true,
      carouselRemix: true,
      trendInsights: true,
      competitorMonitoring: 0,
      approvalWorkflow: true,
      editorialReports: true,
      multiClient: false,
      whiteLabel: false,
      apiAccess: false,
      sla: false,
      watermark: false,
    },
  },
  PRO: {
    tier: "PRO",
    displayName: "Pro",
    priceUsdMonth: 49,
    monthlyCredits: 600,
    businessLimit: 5,
    postsLimitMonth: null,
    includedReels: 5,
    brandDnaLevel: "L4",
    features: {
      visualLora: true,
      visualLoraRefreshFrequency: "monthly",
      chatAi: true,
      referenceImages: true,
      carouselRemix: true,
      trendInsights: true,
      competitorMonitoring: 3,
      approvalWorkflow: true,
      editorialReports: true,
      multiClient: false,
      whiteLabel: false,
      apiAccess: false,
      sla: false,
      watermark: false,
    },
  },
  AGENCY: {
    tier: "AGENCY",
    displayName: "Agency",
    priceUsdMonth: 129,
    monthlyCredits: 1800,
    businessLimit: -1, // ilimitado
    postsLimitMonth: null,
    includedReels: 15,
    brandDnaLevel: "L4",
    features: {
      visualLora: true,
      visualLoraRefreshFrequency: "monthly",
      chatAi: true,
      referenceImages: true,
      carouselRemix: true,
      trendInsights: true,
      competitorMonitoring: 5,
      approvalWorkflow: true,
      editorialReports: true,
      multiClient: true,
      whiteLabel: false, // upsell +$15
      apiAccess: false,
      sla: false,
      watermark: false,
    },
  },
  SCALE: {
    tier: "SCALE",
    displayName: "Scale",
    priceUsdMonth: 299,
    monthlyCredits: 5000,
    businessLimit: -1,
    postsLimitMonth: null,
    includedReels: 100,
    brandDnaLevel: "L5",
    features: {
      visualLora: true,
      visualLoraRefreshFrequency: "monthly",
      chatAi: true,
      referenceImages: true,
      carouselRemix: true,
      trendInsights: true,
      competitorMonitoring: 15,
      approvalWorkflow: true,
      editorialReports: true,
      multiClient: true,
      whiteLabel: true,
      apiAccess: true,
      sla: true,
      watermark: false,
    },
  },
};

/**
 * Add-on packs (compra one-shot, créditos no caducan).
 */
export interface AddonPack {
  key: string;
  displayName: string;
  priceUsd: number;
  credits: number;
  bonusReels?: number; // Pack Estudio Reels añade reels separados
  description: string;
}

export const ADDON_PACKS: AddonPack[] = [
  {
    key: "sello",
    displayName: "Pack Sello",
    priceUsd: 9,
    credits: 100,
    description: "Entrada para casuales — 100 créditos.",
  },
  {
    key: "edicion",
    displayName: "Pack Edición",
    priceUsd: 29,
    credits: 400,
    description: "Mejor ratio precio/créditos — 400 créditos.",
  },
  {
    key: "tirada",
    displayName: "Pack Tirada",
    priceUsd: 79,
    credits: 1500,
    description: "Best value para agencies — 1500 créditos.",
  },
  {
    key: "estudio_reels",
    displayName: "Pack Estudio Reels",
    priceUsd: 59,
    credits: 100,
    bonusReels: 12,
    description: "Para video — 12 Pro Reels gratis + 100 créditos.",
  },
];

export function getPlan(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier];
}

export function getAddonPack(key: string): AddonPack | null {
  return ADDON_PACKS.find((p) => p.key === key) ?? null;
}

export function getCreditCost(action: AiActionType): number {
  return CREDIT_COST[action];
}

/**
 * Coste real estimado en USD por acción (para tracking de margen interno).
 * NO se expone al usuario — solo telemetría.
 */
export const REAL_COST_USD: Record<AiActionType, number> = {
  caption: 0.005,
  hashtags: 0.0003,
  image_schnell: 0.003,
  image_dev: 0.015,
  image_pro: 0.04,
  quick_reel: 0.20,
  pro_reel: 0.92,
  cinematic_reel: 0.80,
  chat_post: 0.020,
  chat_reel: 0.925,
  organize_zip: 0.15,
  remix_carousel: 0.20,
  remix_image: 0.04,
  extract_palette: 0.001,
  analyze_reference: 0.005,
  brand_lora_train: 8.0, // amortizado mensual
  voice_profile_refresh: 0.05,
  trend_insights: 0.20, // por mes
};

export function getRealCostUsd(action: AiActionType): number {
  return REAL_COST_USD[action];
}
