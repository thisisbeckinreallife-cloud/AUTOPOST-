"use client";

import * as React from "react";

export type Lang = "en" | "es" | "fr" | "pt";

type Dict = Record<string, string>;

const DICT: Record<Lang, Dict> = {
  en: {
    "masthead.vol": "VOL. 02 · ISSUE 04",
    "masthead.date": "APRIL · MMXXVI",
    "masthead.est": "EST. 2024 · MADRID / LISBOA",
    "nav.product": "Product",
    "nav.manifesto": "Manifesto",
    "nav.pricing": "Pricing",
    "nav.customers": "Customers",
    "nav.journal": "Journal",
    "nav.signin": "Sign in",
    "nav.try": "Try free",
    "hero.kicker": "№ 01 · A SOFTWARE COMPANION",
    "hero.beta": "limited beta",
    "hero.h1": "A month of <i>posts,</i>\nwritten by <wave>breakfast.</wave>",
    "hero.lede":
      "Autopost writes a full week of social posts <em>in your brand voice</em> and schedules them across Instagram, LinkedIn, X, and TikTok — from a single brief, in under five minutes.",
    "hero.cta.primary": "Start the trial →",
    "hero.cta.secondary": "90-second tour",
    "hero.cta.note": "14 days. No card. Cancels itself if forgotten.",
    "hero.badge.l1": "SAVE · 14H/WK",
    "hero.badge.l2": "HUMAN-IN-LOOP",
    "hero.quote": '"We replaced an agency\n<s>and a calendar</s> with\none tool."',
    "hero.quote.role": "HEAD OF BRAND · LOMA STUDIO",
    "spread.title": "HOW IT WORKS · A SHORT STORY IN THREE PAGES",
    "spread.step": "STEP",
    "spread.note":
      'There is no "AI Engine". There is a small tool that listens. — The makers.',
    "spread.p1.title": "The brief",
    "spread.p1.cap": "It starts with a sentence, written like a note to a friend.",
    "spread.p2.title": "The drafts",
    "spread.p2.cap":
      "Autopost answers in your voice. Variants per channel — pick, edit, ignore.",
    "spread.p3.title": "The week",
    "spread.p3.cap":
      "Each post finds its slot. The calendar fills itself, like a kitchen brigade.",
    "brief.label": "BRIEF · 14:32",
    "brief.body":
      "Launch the SS26 capsule.\nEditorial tone. No hype.\nA carousel for Instagram\nand a thread for LinkedIn.\n\nReferences attached.\nThanks.",
    "brief.received": "received",
    "draft.variant": "VARIANT",
    "draft.draft": "DRAFT",
    "draft.invoice": "✓ in voice",
    "draft.kept": "3 OF 4 KEPT",
    "draft.send": "SEND →",
    "week.rest": "— rest day",
    "week.summary": "4 SLOTS · +22% PROJECTED REACH",
    "week.shipped": "shipped",
    "ticker.1": "posts that think",
    "ticker.2": "your voice, your hours back",
    "ticker.3": "2,184 brands",
    "ticker.4": "shipped in afternoons",
    "d1.t": "Threads, no rush.",
    "d1.b":
      "The SS26 capsule was born from a conversation with three weavers in Bizkaia.",
    "d2.t": "Why we made SS26 backwards",
    "d2.b":
      "We started with the material. Not the moodboard. Three months with the weavers. Zero briefs.",
    "d3.t": "5 lessons from a slow launch",
    "d3.b": "1/ Material first. Always.\n2/ Conversations beat moodboards.",
    "day.mon": "MON",
    "day.tue": "TUE",
    "day.wed": "WED",
    "day.thu": "THU",
    "day.fri": "FRI",
    "day.sat": "SAT",
    "day.sun": "SUN",
    "wp1.t": "Threads, no rush",
    "wp2.t": "Why SS26",
    "wp3.t": "5 lessons",
    "wp4.t": "POV: workshop",
    "dash.date": "MON · APR 27",
    "sb.today": "Today",
    "sb.calendar": "Calendar",
    "sb.composer": "Composer",
    "sb.library": "Library",
    "sb.performance": "Performance",
    "sb.inbox": "Inbox",
    "home.kicker": "TODAY · APRIL 27",
    "home.greet.a": "Good morning,",
    "home.greet.b": "Lucía.",
    "home.greet.sub": "Four posts in queue.",
    "kpi.posts": "Posts this year",
    "kpi.saved": "Saved this week",
    "kpi.eng": "Engagement · 30d",
    "kpi.reach": "Reach · 30d",
    "today.title": "Today",
    "today.scheduled": "4 SCHEDULED",
    "state.live": "Live now",
    "state.ready": "Ready",
    "state.gen": "Generating",
    "tp1.t": "Threads, no rush — SS26 carousel",
    "tp2.t": "5 lessons from a slow launch",
    "tp3.t": "Why we made SS26 backwards",
    "tp4.t": "POV: a day in the workshop with María",
    "sug.label": "SUGGESTION",
    "sug.body": "Friday at 18:30 is empty. Repurpose Q1 retro into a thread?",
    "sug.now": "Draft now",
    "sug.later": "Later",
    "ch.label": "CHANNELS",
    "focal.cap": "Posts find their own slots.",
    "focal.label": "A WEEK · AUTO-SCHEDULED",
  },

  es: {
    "masthead.vol": "VOL. 02 · NÚMERO 04",
    "masthead.date": "ABRIL · MMXXVI",
    "masthead.est": "FUNDADO 2024 · MADRID / LISBOA",
    "nav.product": "Producto",
    "nav.manifesto": "Manifiesto",
    "nav.pricing": "Precios",
    "nav.customers": "Clientes",
    "nav.journal": "Diario",
    "nav.signin": "Entrar",
    "nav.try": "Prueba gratis",
    "hero.kicker": "№ 01 · UN COMPAÑERO DE SOFTWARE",
    "hero.beta": "beta limitada",
    "hero.h1": "Una semana de <i>posts,</i>\nescrita antes del <wave>café.</wave>",
    "hero.lede":
      "Autopost escribe una semana entera de posts <em>con tu voz de marca</em> y los programa en Instagram, LinkedIn, X y TikTok — desde un solo brief, en menos de cinco minutos.",
    "hero.cta.primary": "Empieza la prueba →",
    "hero.cta.secondary": "Tour de 90 segundos",
    "hero.cta.note": "14 días. Sin tarjeta. Se cancela sola si la olvidas.",
    "hero.badge.l1": "AHORRA · 14H/SEM",
    "hero.badge.l2": "HUMANO EN EL CIRCUITO",
    "hero.quote":
      '"Cambiamos la agencia\n<s>y el calendario</s>\npor una sola herramienta."',
    "hero.quote.role": "HEAD OF BRAND · LOMA STUDIO",
    "spread.title": "CÓMO FUNCIONA · UNA HISTORIA EN TRES PÁGINAS",
    "spread.step": "PASO",
    "spread.note":
      'No hay "Motor IA". Hay una pequeña herramienta que escucha. — Los autores.',
    "spread.p1.title": "El brief",
    "spread.p1.cap": "Empieza con una frase, escrita como una nota a un amigo.",
    "spread.p2.title": "Los borradores",
    "spread.p2.cap":
      "Autopost responde con tu voz. Variantes por canal — elige, edita, ignora.",
    "spread.p3.title": "La semana",
    "spread.p3.cap":
      "Cada post encuentra su hueco. El calendario se llena solo, como una brigada de cocina.",
    "brief.label": "BRIEF · 14:32",
    "brief.body":
      "Lanza la cápsula SS26.\nTono editorial. Sin hype.\nCarrusel para Instagram\ny un thread para LinkedIn.\n\nReferencias adjuntas.\nGracias.",
    "brief.received": "recibido",
    "draft.variant": "VARIANTE",
    "draft.draft": "BORRADOR",
    "draft.invoice": "✓ con tu voz",
    "draft.kept": "3 DE 4 ELEGIDAS",
    "draft.send": "ENVIAR →",
    "week.rest": "— día de descanso",
    "week.summary": "4 HUECOS · +22% ALCANCE PREVISTO",
    "week.shipped": "publicado",
    "ticker.1": "posts que piensan",
    "ticker.2": "tu voz, tus horas de vuelta",
    "ticker.3": "2.184 marcas",
    "ticker.4": "publicados en una tarde",
    "d1.t": "Hilos sin prisa.",
    "d1.b":
      "La cápsula SS26 nació de una conversación con tres tejedores de Bizkaia.",
    "d2.t": "Por qué hicimos SS26 al revés",
    "d2.b":
      "Empezamos por el material. No por el moodboard. Tres meses con los tejedores. Cero briefs.",
    "d3.t": "5 lecciones de un lanzamiento lento",
    "d3.b":
      "1/ Material primero. Siempre.\n2/ Las conversaciones le ganan al moodboard.",
    "day.mon": "LUN",
    "day.tue": "MAR",
    "day.wed": "MIÉ",
    "day.thu": "JUE",
    "day.fri": "VIE",
    "day.sat": "SÁB",
    "day.sun": "DOM",
    "wp1.t": "Hilos sin prisa",
    "wp2.t": "Por qué SS26",
    "wp3.t": "5 lecciones",
    "wp4.t": "POV: taller",
    "dash.date": "LUN · 27 ABR",
    "sb.today": "Hoy",
    "sb.calendar": "Calendario",
    "sb.composer": "Composer",
    "sb.library": "Biblioteca",
    "sb.performance": "Rendimiento",
    "sb.inbox": "Bandeja",
    "home.kicker": "HOY · 27 DE ABRIL",
    "home.greet.a": "Buenos días,",
    "home.greet.b": "Lucía.",
    "home.greet.sub": "Cuatro posts en cola.",
    "kpi.posts": "Posts este año",
    "kpi.saved": "Ahorrado esta semana",
    "kpi.eng": "Engagement · 30d",
    "kpi.reach": "Alcance · 30d",
    "today.title": "Hoy",
    "today.scheduled": "4 PROGRAMADOS",
    "state.live": "En directo",
    "state.ready": "Listo",
    "state.gen": "Generando",
    "tp1.t": "Hilos sin prisa — SS26 carrusel",
    "tp2.t": "5 lecciones de un lanzamiento lento",
    "tp3.t": "Por qué hicimos SS26 al revés",
    "tp4.t": "POV: día en el taller con María",
    "sug.label": "SUGERENCIA",
    "sug.body":
      "El viernes a las 18:30 está vacío. ¿Reusamos la retro Q1 como thread?",
    "sug.now": "Crear ahora",
    "sug.later": "Más tarde",
    "ch.label": "CANALES",
    "focal.cap": "Los posts encuentran su hueco.",
    "focal.label": "UNA SEMANA · AUTO-PROGRAMADA",
  },

  fr: {
    "masthead.vol": "VOL. 02 · NUMÉRO 04",
    "masthead.date": "AVRIL · MMXXVI",
    "masthead.est": "FONDÉ 2024 · MADRID / LISBONNE",
    "nav.product": "Produit",
    "nav.manifesto": "Manifeste",
    "nav.pricing": "Tarifs",
    "nav.customers": "Clients",
    "nav.journal": "Journal",
    "nav.signin": "Se connecter",
    "nav.try": "Essai gratuit",
    "hero.kicker": "№ 01 · UN COMPAGNON LOGICIEL",
    "hero.beta": "beta limitée",
    "hero.h1":
      "Une semaine de <i>posts,</i>\nécrite au <wave>petit-déjeuner.</wave>",
    "hero.lede":
      "Autopost rédige une semaine entière de posts <em>dans la voix de votre marque</em> et les programme sur Instagram, LinkedIn, X et TikTok — depuis un seul brief, en moins de cinq minutes.",
    "hero.cta.primary": "Commencer l'essai →",
    "hero.cta.secondary": "Visite de 90 secondes",
    "hero.cta.note": "14 jours. Sans carte. S'annule seul si oublié.",
    "hero.badge.l1": "GAGNEZ · 14H/SEM",
    "hero.badge.l2": "HUMAIN DANS LA BOUCLE",
    "hero.quote":
      '"On a remplacé une agence\n<s>et un calendrier</s>\npar un seul outil."',
    "hero.quote.role": "DIRECTRICE DE MARQUE · LOMA STUDIO",
    "spread.title": "COMMENT ÇA MARCHE · UNE HISTOIRE EN TROIS PAGES",
    "spread.step": "ÉTAPE",
    "spread.note":
      'Il n\'y a pas de "moteur IA". Il y a un petit outil qui écoute. — Les auteurs.',
    "spread.p1.title": "Le brief",
    "spread.p1.cap":
      "Cela commence par une phrase, écrite comme un mot à un ami.",
    "spread.p2.title": "Les brouillons",
    "spread.p2.cap":
      "Autopost répond dans votre voix. Variantes par canal — choisir, modifier, ignorer.",
    "spread.p3.title": "La semaine",
    "spread.p3.cap":
      "Chaque post trouve sa place. Le calendrier se remplit seul, comme une brigade de cuisine.",
    "brief.label": "BRIEF · 14:32",
    "brief.body":
      "Lancer la capsule SS26.\nTon éditorial. Pas de hype.\nUn carrousel pour Instagram\net un thread pour LinkedIn.\n\nRéférences en pièce jointe.\nMerci.",
    "brief.received": "reçu",
    "draft.variant": "VARIANTE",
    "draft.draft": "BROUILLON",
    "draft.invoice": "✓ dans votre voix",
    "draft.kept": "3 SUR 4 GARDÉS",
    "draft.send": "ENVOYER →",
    "week.rest": "— jour de repos",
    "week.summary": "4 CRÉNEAUX · +22% PORTÉE PRÉVUE",
    "week.shipped": "publié",
    "ticker.1": "posts qui pensent",
    "ticker.2": "votre voix, vos heures retrouvées",
    "ticker.3": "2 184 marques",
    "ticker.4": "expédiés en un après-midi",
    "d1.t": "Fils sans hâte.",
    "d1.b":
      "La capsule SS26 est née d'une conversation avec trois tisserands de Biscaye.",
    "d2.t": "Pourquoi nous avons fait SS26 à l'envers",
    "d2.b":
      "Nous avons commencé par la matière. Pas par le moodboard. Trois mois avec les tisserands. Zéro brief.",
    "d3.t": "5 leçons d'un lancement lent",
    "d3.b":
      "1/ La matière d'abord. Toujours.\n2/ Les conversations battent les moodboards.",
    "day.mon": "LUN",
    "day.tue": "MAR",
    "day.wed": "MER",
    "day.thu": "JEU",
    "day.fri": "VEN",
    "day.sat": "SAM",
    "day.sun": "DIM",
    "wp1.t": "Fils sans hâte",
    "wp2.t": "Pourquoi SS26",
    "wp3.t": "5 leçons",
    "wp4.t": "POV: atelier",
    "dash.date": "LUN · 27 AVR",
    "sb.today": "Aujourd'hui",
    "sb.calendar": "Calendrier",
    "sb.composer": "Composer",
    "sb.library": "Bibliothèque",
    "sb.performance": "Performance",
    "sb.inbox": "Boîte",
    "home.kicker": "AUJOURD'HUI · 27 AVRIL",
    "home.greet.a": "Bonjour,",
    "home.greet.b": "Lucía.",
    "home.greet.sub": "Quatre posts en file.",
    "kpi.posts": "Posts cette année",
    "kpi.saved": "Économisé cette semaine",
    "kpi.eng": "Engagement · 30j",
    "kpi.reach": "Portée · 30j",
    "today.title": "Aujourd'hui",
    "today.scheduled": "4 PROGRAMMÉS",
    "state.live": "En direct",
    "state.ready": "Prêt",
    "state.gen": "Génération",
    "tp1.t": "Fils sans hâte — carrousel SS26",
    "tp2.t": "5 leçons d'un lancement lent",
    "tp3.t": "Pourquoi nous avons fait SS26 à l'envers",
    "tp4.t": "POV: une journée à l'atelier avec María",
    "sug.label": "SUGGESTION",
    "sug.body": "Vendredi 18:30 est vide. Recycler la rétro Q1 en thread ?",
    "sug.now": "Rédiger",
    "sug.later": "Plus tard",
    "ch.label": "CANAUX",
    "focal.cap": "Les posts trouvent leur place.",
    "focal.label": "UNE SEMAINE · AUTO-PROGRAMMÉE",
  },

  pt: {
    "masthead.vol": "VOL. 02 · NÚMERO 04",
    "masthead.date": "ABRIL · MMXXVI",
    "masthead.est": "FUNDADO 2024 · MADRID / LISBOA",
    "nav.product": "Produto",
    "nav.manifesto": "Manifesto",
    "nav.pricing": "Preços",
    "nav.customers": "Clientes",
    "nav.journal": "Diário",
    "nav.signin": "Entrar",
    "nav.try": "Testar grátis",
    "hero.kicker": "№ 01 · UM COMPANHEIRO DE SOFTWARE",
    "hero.beta": "beta limitada",
    "hero.h1":
      "Uma semana de <i>posts,</i>\nescrita ao <wave>pequeno-almoço.</wave>",
    "hero.lede":
      "Autopost escreve uma semana inteira de posts <em>com a voz da tua marca</em> e agenda-os no Instagram, LinkedIn, X e TikTok — a partir de um único brief, em menos de cinco minutos.",
    "hero.cta.primary": "Começar o teste →",
    "hero.cta.secondary": "Tour de 90 segundos",
    "hero.cta.note": "14 dias. Sem cartão. Cancela-se sozinho se esquecido.",
    "hero.badge.l1": "POUPA · 14H/SEM",
    "hero.badge.l2": "HUMANO NO CIRCUITO",
    "hero.quote":
      '"Trocámos a agência\n<s>e o calendário</s>\npor uma só ferramenta."',
    "hero.quote.role": "HEAD OF BRAND · LOMA STUDIO",
    "spread.title": "COMO FUNCIONA · UMA HISTÓRIA EM TRÊS PÁGINAS",
    "spread.step": "PASSO",
    "spread.note":
      'Não há "Motor de IA". Há uma pequena ferramenta que escuta. — Os autores.',
    "spread.p1.title": "O brief",
    "spread.p1.cap":
      "Começa com uma frase, escrita como um bilhete para um amigo.",
    "spread.p2.title": "Os rascunhos",
    "spread.p2.cap":
      "O Autopost responde na tua voz. Variantes por canal — escolhe, edita, ignora.",
    "spread.p3.title": "A semana",
    "spread.p3.cap":
      "Cada post encontra o seu lugar. O calendário enche-se sozinho, como uma brigada de cozinha.",
    "brief.label": "BRIEF · 14:32",
    "brief.body":
      "Lança a cápsula SS26.\nTom editorial. Sem hype.\nCarrossel para Instagram\ne uma thread para LinkedIn.\n\nReferências anexas.\nObrigada.",
    "brief.received": "recebido",
    "draft.variant": "VARIANTE",
    "draft.draft": "RASCUNHO",
    "draft.invoice": "✓ na tua voz",
    "draft.kept": "3 DE 4 GUARDADAS",
    "draft.send": "ENVIAR →",
    "week.rest": "— dia de descanso",
    "week.summary": "4 SLOTS · +22% ALCANCE PREVISTO",
    "week.shipped": "publicado",
    "ticker.1": "posts que pensam",
    "ticker.2": "a tua voz, as tuas horas de volta",
    "ticker.3": "2.184 marcas",
    "ticker.4": "publicados numa tarde",
    "d1.t": "Threads sem pressa.",
    "d1.b":
      "A cápsula SS26 nasceu de uma conversa com três tecelões de Biscaia.",
    "d2.t": "Porque fizemos SS26 ao contrário",
    "d2.b":
      "Começámos pelo material. Não pelo moodboard. Três meses com os tecelões. Zero briefs.",
    "d3.t": "5 lições de um lançamento lento",
    "d3.b":
      "1/ Material primeiro. Sempre.\n2/ Conversas ganham aos moodboards.",
    "day.mon": "SEG",
    "day.tue": "TER",
    "day.wed": "QUA",
    "day.thu": "QUI",
    "day.fri": "SEX",
    "day.sat": "SÁB",
    "day.sun": "DOM",
    "wp1.t": "Threads sem pressa",
    "wp2.t": "Porquê SS26",
    "wp3.t": "5 lições",
    "wp4.t": "POV: atelier",
    "dash.date": "SEG · 27 ABR",
    "sb.today": "Hoje",
    "sb.calendar": "Calendário",
    "sb.composer": "Composer",
    "sb.library": "Biblioteca",
    "sb.performance": "Desempenho",
    "sb.inbox": "Caixa",
    "home.kicker": "HOJE · 27 DE ABRIL",
    "home.greet.a": "Bom dia,",
    "home.greet.b": "Lucía.",
    "home.greet.sub": "Quatro posts em fila.",
    "kpi.posts": "Posts este ano",
    "kpi.saved": "Poupado esta semana",
    "kpi.eng": "Engagement · 30d",
    "kpi.reach": "Alcance · 30d",
    "today.title": "Hoje",
    "today.scheduled": "4 AGENDADOS",
    "state.live": "Ao vivo",
    "state.ready": "Pronto",
    "state.gen": "A gerar",
    "tp1.t": "Threads sem pressa — carrossel SS26",
    "tp2.t": "5 lições de um lançamento lento",
    "tp3.t": "Porque fizemos SS26 ao contrário",
    "tp4.t": "POV: dia no atelier com a María",
    "sug.label": "SUGESTÃO",
    "sug.body":
      "Sexta às 18:30 está vazia. Reaproveitar a retro Q1 como thread?",
    "sug.now": "Criar agora",
    "sug.later": "Mais tarde",
    "ch.label": "CANAIS",
    "focal.cap": "Os posts encontram o seu lugar.",
    "focal.label": "UMA SEMANA · AUTO-AGENDADA",
  },
};

interface I18nValue {
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
}

const I18nContext = React.createContext<I18nValue>({
  lang: "es",
  t: (k) => k,
  setLang: () => {},
});

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  defaultLang?: Lang;
}> = ({ children, defaultLang = "es" }) => {
  const [lang, setLangState] = React.useState<Lang>(defaultLang);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("ap-lang") as Lang | null;
      if (stored && stored in DICT) setLangState(stored);
    } catch {
      /* noop */
    }
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("ap-lang", l);
    } catch {
      /* noop */
    }
  }, []);

  const t = React.useCallback(
    (k: string) => DICT[lang]?.[k] ?? DICT.en[k] ?? k,
    [lang],
  );

  const value = React.useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => React.useContext(I18nContext);

export const LangSwitcher: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  const { lang, setLang } = useI18n();
  const langs: Lang[] = ["en", "es", "fr", "pt"];
  const muted = dark ? "rgba(241,236,226,0.45)" : "var(--ap-ink-4)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--ap-font-mono)",
        fontSize: 11,
        letterSpacing: "0.08em",
      }}
    >
      {langs.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span style={{ color: muted }}>·</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-label={`Cambiar idioma a ${l.toUpperCase()}`}
            aria-pressed={l === lang}
            style={{
              cursor: "pointer",
              color: l === lang ? "var(--ap-stamp)" : muted,
              borderBottom:
                l === lang
                  ? "1px solid var(--ap-stamp)"
                  : "1px solid transparent",
              // Touch target ≥44×44 vía padding interno; visual mantiene espaciado tight
              padding: "12px 6px 11px",
              margin: "-12px -2px -11px",
              textTransform: "uppercase",
              background: "transparent",
              border: 0,
              borderRadius: 0,
              fontFamily: "inherit",
              fontSize: "inherit",
              letterSpacing: "inherit",
              minWidth: 28,
              textAlign: "center",
            }}
          >
            {l}
          </button>
        </React.Fragment>
      ))}
    </span>
  );
};
