/**
 * Datos de comparativas SEO. Cada entrada es una landing page autocontenida
 * orientada a captar búsquedas con intent de comparación
 * ("autopost vs later", "autopost vs buffer"...).
 */
export type Competitor = "later" | "buffer" | "hootsuite";

export interface ComparatorRow {
  feature: string;
  autopost: boolean | string;
  competitor: boolean | string;
  highlight?: boolean;
}

export interface ComparisonData {
  slug: Competitor;
  name: string;
  tagline: string;
  pricing: string;
  intro: string;
  hookHeadline: string; // h1
  hookSub: string;
  rows: ComparatorRow[];
  killerFeatures: { title: string; desc: string }[];
  pros: string[];
  cons: string[];
  closingPitch: string;
}

const SHARED_AUTOPOST_KILLER: { title: string; desc: string }[] = [
  {
    title: "La carpeta es el calendario",
    desc: "Sueltas un ZIP con fotos, vídeos y .txt. AutoPost detecta carruseles, asocia el copy y programa 30 días. Sin numerar fotos. Sin pegar capciones a mano.",
  },
  {
    title: "Posts colaborativos automáticos",
    desc: "Un post, dos firmas. Aparece en dos feeds simultáneos vía la Collabs API oficial. Sin coordinaciones por email entre marcas.",
  },
  {
    title: "Lenguaje editorial",
    desc: "AutoPost trata cada cuenta como una revista: brigada, edición, sello, cabecera. Léxico propio que las agencias presumen ante sus clientes.",
  },
];

export const comparisons: Record<Competitor, ComparisonData> = {
  later: {
    slug: "later",
    name: "Later",
    tagline: "Visual planner con grid drag-drop",
    pricing: "$25–$80/mes · desde 1 cuenta",
    intro:
      "Later es uno de los schedulers consumer-friendly más conocidos. Tiene visual planner sólido y hashtag suggestions decente, pero arrastra una UI sobrecargada y publica una caja por post — agotador a partir de 30 posts/mes.",
    hookHeadline: "AutoPost vs Later.",
    hookSub:
      "Later programa post a post. AutoPost programa carpeta a carpeta. Si gestionas más de una cuenta, la diferencia se nota a partir del segundo lunes del mes.",
    rows: [
      { feature: "Subida masiva por carpeta/ZIP", autopost: true, competitor: false, highlight: true },
      { feature: "Detección automática de carruseles", autopost: true, competitor: false, highlight: true },
      { feature: "Extracción copy desde .txt", autopost: true, competitor: false, highlight: true },
      { feature: "Posts colaborativos (Collabs)", autopost: true, competitor: true },
      { feature: "Visual feed planner (grid)", autopost: "Próximo", competitor: true },
      { feature: "Hashtag suggestions", autopost: "Próximo (AI nativa)", competitor: true },
      { feature: "Multi-canal (TikTok, X, LinkedIn)", autopost: "Roadmap Q3", competitor: "IG + TikTok" },
      { feature: "Stories scheduling", autopost: false, competitor: true },
      { feature: "Programación por carpeta", autopost: true, competitor: false, highlight: true },
      { feature: "API oficial de Meta", autopost: true, competitor: true },
      { feature: "Branding editorial", autopost: true, competitor: false, highlight: true },
      { feature: "Plan agencia con multi-cliente", autopost: "Desde $79/mes", competitor: "Desde $80/mes" },
      { feature: "Precio entrada", autopost: "$15/mes (Solo)", competitor: "$25/mes" },
    ],
    killerFeatures: SHARED_AUTOPOST_KILLER,
    pros: [
      "UI familiar para creadores que vienen de Instagram nativo",
      "Hashtag suggestions integradas",
      "Histórico largo en el sector",
    ],
    cons: [
      "Programa post a post — fricción a escala",
      "Lógica de carpeta inexistente",
      "Visual planner cargado, lento con muchos posts",
      "Pricing de entrada alto vs alternativas modernas",
    ],
    closingPitch:
      "Si publicas 5 posts al mes, Later vale. Si gestionas 5 cuentas con 30 posts cada una, la diferencia entre 'programar uno a uno' y 'programar la carpeta entera' son 10 horas/mes.",
  },

  buffer: {
    slug: "buffer",
    name: "Buffer",
    tagline: "Multi-canal con free tier generoso",
    pricing: "$6–$120/mes · 8 redes sociales",
    intro:
      "Buffer cubre 8 redes y tiene free tier. Su análisis básico está bien implementado. Pero la UX es la misma desde 2014: una caja por post. AI caption muy genérico. Sin lógica de carpeta. Sin Collabs IG.",
    hookHeadline: "AutoPost vs Buffer.",
    hookSub:
      "Buffer es un editor de cajas. AutoPost es un editor de revistas. Cuando lo que publicas tiene voz, la diferencia importa más que el número de redes.",
    rows: [
      { feature: "Subida masiva por carpeta/ZIP", autopost: true, competitor: false, highlight: true },
      { feature: "Detección automática de carruseles", autopost: true, competitor: false, highlight: true },
      { feature: "Extracción copy desde .txt", autopost: true, competitor: false, highlight: true },
      { feature: "Posts colaborativos (Collabs)", autopost: true, competitor: false, highlight: true },
      { feature: "Multi-canal (8 redes)", autopost: "IG · TikTok/LinkedIn/X roadmap Q3", competitor: true },
      { feature: "Free tier permanente", autopost: true, competitor: true },
      { feature: "AI caption generator", autopost: "Próximo (voz de marca)", competitor: "Genérico" },
      { feature: "Analytics + reports", autopost: "Próximo (PDF editorial)", competitor: true },
      { feature: "API oficial de Meta", autopost: true, competitor: true },
      { feature: "Branding editorial", autopost: true, competitor: false, highlight: true },
      { feature: "Voz de marca en AI", autopost: "Sí (Claude entrenado con tus .txt)", competitor: false, highlight: true },
      { feature: "Precio entrada Pro", autopost: "$29/mes", competitor: "$15/mes" },
    ],
    killerFeatures: SHARED_AUTOPOST_KILLER,
    pros: [
      "8 redes desde el día uno",
      "Free tier muy generoso",
      "Análisis básico bien implementado",
    ],
    cons: [
      "Una caja por post — agotador a escala",
      "Sin lógica de carpeta ni detección de carruseles",
      "AI caption genérico, sin voz propia",
      "UI legacy desde hace una década",
    ],
    closingPitch:
      "Buffer cubre todo a medias. AutoPost cubre Instagram en profundidad — y trata cada cliente como una marca con voz, no como una pila de posts. Si lo que publicas tiene autoría, AutoPost importa más que el conteo de redes.",
  },

  hootsuite: {
    slug: "hootsuite",
    name: "Hootsuite",
    tagline: "Enterprise heredado con workflows complejos",
    pricing: "$99–$399/mes · enterprise",
    intro:
      "Hootsuite es la herramienta enterprise heredada del sector. SSO, equipos grandes, reportería sólida. Pero la UI parece de 2014, el pricing es hostil para agencias pequeñas y la curva de aprendizaje es brutal.",
    hookHeadline: "AutoPost vs Hootsuite.",
    hookSub:
      "Hootsuite es para empresas con departamento legal. AutoPost es para agencias que cobran por la calidad del calendario, no por el número de licencias.",
    rows: [
      { feature: "Subida masiva por carpeta/ZIP", autopost: true, competitor: false, highlight: true },
      { feature: "Detección automática de carruseles", autopost: true, competitor: false, highlight: true },
      { feature: "Extracción copy desde .txt", autopost: true, competitor: false, highlight: true },
      { feature: "Posts colaborativos (Collabs)", autopost: true, competitor: true },
      { feature: "Multi-canal", autopost: "IG ya · 4 más roadmap", competitor: "20+ redes" },
      { feature: "SSO empresarial", autopost: false, competitor: true },
      { feature: "White-label agencia", autopost: "Roadmap Q5", competitor: true },
      { feature: "API pública + webhooks", autopost: "Roadmap Q5", competitor: true },
      { feature: "Curva de aprendizaje", autopost: "Suelta una carpeta", competitor: "2 semanas" },
      { feature: "Branding editorial", autopost: true, competitor: false, highlight: true },
      { feature: "Precio entrada", autopost: "$15/mes", competitor: "$99/mes" },
      { feature: "Plan agencia", autopost: "$79/mes", competitor: "$249/mes+" },
    ],
    killerFeatures: SHARED_AUTOPOST_KILLER,
    pros: [
      "Cobertura enterprise: SSO, equipos, permisos granulares",
      "20+ redes",
      "Reportería avanzada nativa",
    ],
    cons: [
      "UI obsoleta, poca atención a UX moderna",
      "Pricing hostil para agencias pequeñas y creadores",
      "Sin lógica de carpeta — flujo manual",
      "Curva de aprendizaje brutal",
    ],
    closingPitch:
      "Hootsuite cuesta $99/mes para empezar y necesitas un onboarding de 2 semanas. AutoPost cuesta $15 y se aprende sola — sueltas la carpeta. Para agencias que crecen, la diferencia es cash flow y velocidad.",
  },
};

export const competitorSlugs = Object.keys(comparisons) as Competitor[];
