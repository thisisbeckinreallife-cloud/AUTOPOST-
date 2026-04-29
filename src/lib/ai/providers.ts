/**
 * Provider router unificado — fachada simple para todo el código de la app.
 *
 * Reglas de routing:
 *   - Captions con voz de marca → Anthropic Claude Sonnet 4.5
 *   - Hashtags                 → Together Llama 3.3 70B (saves 70% vs Haiku)
 *   - Vision análisis          → Together Llama 3.2 90B Vision
 *   - Imágenes feed/carrusel   → Together FLUX.1 dev
 *   - Imágenes hero            → Together FLUX.1.1 pro
 *   - Imágenes rápidas         → Together FLUX.1 schnell
 *
 * Si Together no está configurado, los helpers de imagen/vision/hashtags
 * tiran un error explícito que las rutas convierten a 503.
 *
 * Si Anthropic no está configurado, captions devuelve 503 también.
 */
import {
  getAnthropic,
  isAiAvailable as isAnthropicAvailable,
  MODEL_CAPTION,
} from "@/lib/ai/anthropic";
import {
  getTogether,
  isTogetherAvailable,
  generateImage,
  llamaChat,
  analyzeImageWithVision,
  MODEL_FLUX_SCHNELL,
  MODEL_FLUX_DEV,
  MODEL_FLUX_PRO,
  MODEL_LLAMA_33_70B,
  MODEL_LLAMA_VISION,
  type FluxModel,
  type AspectRatio,
} from "@/lib/ai/together";

export {
  MODEL_CAPTION,
  MODEL_FLUX_SCHNELL,
  MODEL_FLUX_DEV,
  MODEL_FLUX_PRO,
  MODEL_LLAMA_33_70B,
  MODEL_LLAMA_VISION,
  type FluxModel,
  type AspectRatio,
};

/**
 * Capabilities disponibles según providers configurados.
 * Útil para el UI: "tu admin no tiene TOGETHER_API_KEY → desactivar botón
 * de generar imagen y mostrar tooltip explicativo".
 */
export function getProviderStatus() {
  return {
    anthropic: isAnthropicAvailable(),
    together: isTogetherAvailable(),
    capabilities: {
      caption: isAnthropicAvailable(),
      hashtags: isTogetherAvailable(),
      hashtagsLegacyAnthropic: isAnthropicAvailable(), // fallback si Together no está
      image: isTogetherAvailable(),
      vision: isTogetherAvailable(),
      video: isTogetherAvailable(),
    },
  };
}

/**
 * Re-exports para que el resto del código solo importe de @/lib/ai/providers.
 */
export const ai = {
  // Anthropic
  anthropic: getAnthropic,

  // Together
  together: getTogether,
  generateImage,
  llamaChat,
  analyzeImageWithVision,
};
