/* ==========================================================================
   AUTOPOST — i18n bilingüe ES/EN
   Diccionario plano + setLocale + persistencia localStorage + atajo L.
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'autopost-locale';
  const EVENT = 'localechange';

  const DICT = {
    es: {
      // Nav
      'nav.product':       'Producto',
      'nav.how':           'Cómo funciona',
      'nav.pricing':       'Precios',
      'nav.docs':          'Docs',
      'nav.signin':        'Entrar',
      'nav.cta':           'Comenzar',
      'nav.brand':         'Brand',
      'nav.landing':       'Landing',
      'nav.dashboard':     'Dashboard',

      // Hero
      'hero.eyebrow':      'Programación de redes con IA',
      'hero.headline.1':   'Tira la carpeta.',
      'hero.headline.2':   'El resto va solo.',
      'hero.sub':          'Sube una carpeta de posts. La IA detecta formato, sugiere hora y te monta el calendario. Tú apruebas.',
      'hero.cta.primary':  'Comenzar gratis',
      'hero.cta.ghost':    'Ver demo en vivo',
      'hero.stat1':        'posts publicados',
      'hero.stat2':        'carpeta procesada',
      'hero.stat3':        'redes conectadas',

      // Social marquee
      'social.title':      'Publica nativo en',

      // How it works
      'how.title':         'Tres pasos. Sin fricción.',
      'how.sub':           'Subes la carpeta. La IA la entiende. El calendario se publica solo.',
      'how.s1.label':      'Paso 01',
      'how.s1.title':      'Tira la carpeta',
      'how.s1.desc':       'Imágenes, vídeos, copys, drafts mezclados. Da igual el orden.',
      'how.s2.label':      'Paso 02',
      'how.s2.title':      'La IA interpreta',
      'how.s2.desc':       'Detecta formato (reel, carrusel, story), tema, tono y plataforma óptima.',
      'how.s3.label':      'Paso 03',
      'how.s3.title':      'Calendario que publica solo',
      'how.s3.desc':       'Apruebas el plan. Autopost publica en cada red en su momento óptimo.',

      // Bento
      'bento.title':       'Hace lo que llevas haciendo a mano. Mejor.',
      'bento.ai.label':    'Inteligencia',
      'bento.ai.title':    'IA que entiende tu marca',
      'bento.ai.desc':     'Detecta formato, sugiere franja horaria, escribe el copy en tu tono. Aprueba o ajusta.',
      'bento.fmt.title':   'Detección automática de formato',
      'bento.fmt.desc':    'Reel · carrusel · story · post estático. La IA lo agrupa solo.',
      'bento.copy.title':  'Copy IA en tu tono',
      'bento.copy.desc':   'Aprende de tus posts pasados. Genera, no inventa.',
      'bento.time.title':  'Mejor hora por plataforma',
      'bento.time.desc':   'Mapa de calor real, calculado sobre tus datos.',
      'bento.dnd.title':   'Drag & drop entre franjas',
      'bento.dnd.desc':    'Mueve un post de lunes a martes. Encaja, persiste.',
      'bento.multi.title': 'Multi-cuenta sin fricción',
      'bento.multi.desc':  'Una carpeta. Varios negocios. Cero copia-pega.',
      'bento.metrics.title':'Analytics que importan',
      'bento.metrics.desc':'Engagement, alcance, mejor hora. Sin vanity metrics.',

      // Compare
      'compare.title':     'Antes y después',
      'compare.before':    'Tu pantalla actual',
      'compare.after':     'Con Autopost',

      // Testimonials
      'tm.title':          'Equipos que ya delegaron publicar',

      // Pricing
      'pricing.title':     'Precios que escalan contigo',
      'pricing.sub':       'Cancela cuando quieras. Sin permanencia.',
      'pricing.monthly':   'Mensual',
      'pricing.yearly':    'Anual',
      'pricing.save':      'Ahorra 20%',
      'pricing.t1.name':   'Solo',
      'pricing.t1.desc':   'Para creators y emprendedores.',
      'pricing.t2.name':   'Pro',
      'pricing.t2.desc':   'Para social media managers y agencias pequeñas.',
      'pricing.t3.name':   'Studio',
      'pricing.t3.desc':   'Para agencias y equipos.',
      'pricing.cta':       'Empezar',

      // FAQ
      'faq.title':         'Preguntas frecuentes',
      'faq.q1':            '¿Mis publicaciones se hacen desde mi cuenta real?',
      'faq.a1':            'Sí. Autopost se conecta vía OAuth oficial a cada red. Las publicaciones aparecen como si las hubieras hecho tú desde la app.',
      'faq.q2':            '¿Puedo aprobar antes de que se publique?',
      'faq.a2':            'Por defecto sí. Cada post se queda en estado "Borrador IA" hasta que tú apruebas. También puedes activar autoaprobado para flujos confiables.',
      'faq.q3':            '¿Qué redes están soportadas?',
      'faq.a3':            'Instagram, TikTok, X, LinkedIn, YouTube Shorts, Threads y Facebook. Más cada trimestre.',
      'faq.q4':            '¿Mis datos se usan para entrenar modelos?',
      'faq.a4':            'No. Los assets que subes se procesan en sesión y no entran en ningún corpus de entrenamiento.',
      'faq.q5':            '¿Cuánto tarda en procesar una carpeta?',
      'faq.a5':            'Una carpeta de 30-50 assets tarda 8-12 segundos. Lo verás en vivo con el contador del hero.',

      // Footer
      'footer.product':    'Producto',
      'footer.resources':  'Recursos',
      'footer.company':    'Empresa',
      'footer.legal':      'Legal',
      'footer.status':     'Estado',
      'footer.rights':     'Todos los derechos reservados.',

      // Theme
      'theme.dark':        'Oscuro',
      'theme.light':       'Claro',

      // Auth (login)
      'auth.title':           'Bienvenido de vuelta',
      'auth.sub':             'Tu calendario sigue donde lo dejaste.',
      'auth.google':          'Continuar con Google',
      'auth.apple':           'Continuar con Apple',
      'auth.or':              'O con email',
      'auth.email':           'Email',
      'auth.email_placeholder':'maria@treintayocho.com',
      'auth.email_error':     'Introduce un email válido',
      'auth.password':        'Contraseña',
      'auth.password_error':  'Mínimo 6 caracteres',
      'auth.forgot':          '¿Olvidaste tu contraseña?',
      'auth.remember':        'Mantener sesión iniciada durante 30 días',
      'auth.submit':          'Entrar',
      'auth.no_account':      '¿No tienes cuenta?',
      'auth.start_free':      'Empieza gratis',
      'auth.back':            '← Volver',
      'auth.logout':          'Cerrar sesión',

      // Brand system
      'bs.title':          'Sistema de marca',
      'bs.sub':            'Identidad, voz, tipografía, color, motion. Un único documento navegable.',
      'bs.s.identity':     'Identidad',
      'bs.s.logo':         'Logo',
      'bs.s.color':        'Color',
      'bs.s.type':         'Tipografía',
      'bs.s.icons':        'Iconografía',
      'bs.s.grid':         'Grid + Spacing',
      'bs.s.shadow':       'Sombras + Radii',
      'bs.s.voice':        'Voz y tono',
      'bs.s.motion':       'Motion',

      // Dashboard
      'dash.upload':       'Subir',
      'dash.calendar':     'Calendario',
      'dash.detail':       'Detalle',
      'dash.analytics':    'Analytics',
      'dash.settings':     'Conexiones',
      'dash.upload.drop':  'Arrastra una carpeta aquí',
      'dash.upload.or':    'o haz click para seleccionar',
      'dash.upload.ai':    'Procesando con IA',
      'dash.cal.month':    'Mes',
      'dash.cal.week':     'Semana',
      'dash.cal.suggest':  'Sugerencia IA',
      'dash.detail.copy':  'Copy',
      'dash.detail.tags':  'Hashtags',
      'dash.detail.time':  'Hora óptima',
      'dash.detail.publish': 'Programar publicación',
      'dash.an.engagement':'Engagement',
      'dash.an.reach':     'Alcance',
      'dash.an.posts':     'Publicados',
      'dash.an.best':      'Mejor hora',
      'dash.set.connected':'Conectado',
      'dash.set.connect':  'Conectar',
    },
    en: {
      'nav.product':       'Product',
      'nav.how':           'How it works',
      'nav.pricing':       'Pricing',
      'nav.docs':          'Docs',
      'nav.signin':        'Sign in',
      'nav.cta':           'Get started',
      'nav.brand':         'Brand',
      'nav.landing':       'Landing',
      'nav.dashboard':     'Dashboard',

      'hero.eyebrow':      'AI-powered social scheduling',
      'hero.headline.1':   'Drop the folder.',
      'hero.headline.2':   'The rest is automatic.',
      'hero.sub':          'Upload a folder of posts. AI detects format, suggests timing, builds your calendar. You approve.',
      'hero.cta.primary':  'Start free',
      'hero.cta.ghost':    'See live demo',
      'hero.stat1':        'posts published',
      'hero.stat2':        'folder processed',
      'hero.stat3':        'networks connected',

      'social.title':      'Publish natively to',

      'how.title':         'Three steps. Zero friction.',
      'how.sub':           'You drop the folder. AI gets it. The calendar publishes itself.',
      'how.s1.label':      'Step 01',
      'how.s1.title':      'Drop the folder',
      'how.s1.desc':       'Images, videos, copy, drafts — all mixed. Order does not matter.',
      'how.s2.label':      'Step 02',
      'how.s2.title':      'AI interprets',
      'how.s2.desc':       'Detects format (reel, carousel, story), topic, tone and best platform.',
      'how.s3.label':      'Step 03',
      'how.s3.title':      'Calendar publishes itself',
      'how.s3.desc':       'You approve the plan. Autopost publishes on every network at the right time.',

      'bento.title':       'Replaces what you do by hand. Better.',
      'bento.ai.label':    'Intelligence',
      'bento.ai.title':    'AI that understands your brand',
      'bento.ai.desc':     'Detects format, suggests time slot, writes copy in your voice. You approve or tweak.',
      'bento.fmt.title':   'Automatic format detection',
      'bento.fmt.desc':    'Reel · carousel · story · static post. AI groups them for you.',
      'bento.copy.title':  'AI copy in your voice',
      'bento.copy.desc':   'Learns from your past posts. Generates, never invents.',
      'bento.time.title':  'Best time per platform',
      'bento.time.desc':   'Real heatmap calculated from your own data.',
      'bento.dnd.title':   'Drag & drop between slots',
      'bento.dnd.desc':    'Move a post from Monday to Tuesday. Snaps, persists.',
      'bento.multi.title': 'Multi-account, zero friction',
      'bento.multi.desc':  'One folder. Many businesses. Zero copy-paste.',
      'bento.metrics.title':'Metrics that matter',
      'bento.metrics.desc':'Engagement, reach, best hour. No vanity metrics.',

      'compare.title':     'Before and after',
      'compare.before':    'Your screen today',
      'compare.after':     'With Autopost',

      'tm.title':          'Teams that already delegated publishing',

      'pricing.title':     'Pricing that scales with you',
      'pricing.sub':       'Cancel anytime. No lock-in.',
      'pricing.monthly':   'Monthly',
      'pricing.yearly':    'Yearly',
      'pricing.save':      'Save 20%',
      'pricing.t1.name':   'Solo',
      'pricing.t1.desc':   'For creators and solo founders.',
      'pricing.t2.name':   'Pro',
      'pricing.t2.desc':   'For social media managers and small agencies.',
      'pricing.t3.name':   'Studio',
      'pricing.t3.desc':   'For agencies and teams.',
      'pricing.cta':       'Get started',

      'faq.title':         'Frequently asked',
      'faq.q1':            'Are posts published from my real account?',
      'faq.a1':            'Yes. Autopost connects via official OAuth on every network. Posts appear as if you posted them from the app.',
      'faq.q2':            'Can I approve before it publishes?',
      'faq.a2':            'By default, yes. Each post stays as "AI Draft" until you approve. You can also enable auto-approve for trusted flows.',
      'faq.q3':            'Which networks are supported?',
      'faq.a3':            'Instagram, TikTok, X, LinkedIn, YouTube Shorts, Threads and Facebook. More each quarter.',
      'faq.q4':            'Is my data used to train models?',
      'faq.a4':            'No. The assets you upload are processed in session and never enter any training corpus.',
      'faq.q5':            'How long does it take to process a folder?',
      'faq.a5':            'A 30-50 asset folder takes 8-12 seconds. You will see it live in the hero counter.',

      'footer.product':    'Product',
      'footer.resources':  'Resources',
      'footer.company':    'Company',
      'footer.legal':      'Legal',
      'footer.status':     'Status',
      'footer.rights':     'All rights reserved.',

      'theme.dark':        'Dark',
      'theme.light':       'Light',

      // Auth (login)
      'auth.title':           'Welcome back',
      'auth.sub':             'Your calendar is right where you left it.',
      'auth.google':          'Continue with Google',
      'auth.apple':           'Continue with Apple',
      'auth.or':              'Or with email',
      'auth.email':           'Email',
      'auth.email_placeholder':'maria@treintayocho.com',
      'auth.email_error':     'Enter a valid email',
      'auth.password':        'Password',
      'auth.password_error':  '6 characters minimum',
      'auth.forgot':          'Forgot password?',
      'auth.remember':        'Keep me signed in for 30 days',
      'auth.submit':          'Sign in',
      'auth.no_account':      'No account yet?',
      'auth.start_free':      'Start free',
      'auth.back':            '← Back',
      'auth.logout':          'Sign out',

      'bs.title':          'Brand system',
      'bs.sub':            'Identity, voice, type, color, motion. One navigable document.',
      'bs.s.identity':     'Identity',
      'bs.s.logo':         'Logo',
      'bs.s.color':        'Color',
      'bs.s.type':         'Type',
      'bs.s.icons':        'Iconography',
      'bs.s.grid':         'Grid + Spacing',
      'bs.s.shadow':       'Shadow + Radii',
      'bs.s.voice':        'Voice & tone',
      'bs.s.motion':       'Motion',

      'dash.upload':       'Upload',
      'dash.calendar':     'Calendar',
      'dash.detail':       'Detail',
      'dash.analytics':    'Analytics',
      'dash.settings':     'Connections',
      'dash.upload.drop':  'Drop a folder here',
      'dash.upload.or':    'or click to browse',
      'dash.upload.ai':    'Processing with AI',
      'dash.cal.month':    'Month',
      'dash.cal.week':     'Week',
      'dash.cal.suggest':  'AI suggestion',
      'dash.detail.copy':  'Copy',
      'dash.detail.tags':  'Hashtags',
      'dash.detail.time':  'Best time',
      'dash.detail.publish':'Schedule post',
      'dash.an.engagement':'Engagement',
      'dash.an.reach':     'Reach',
      'dash.an.posts':     'Published',
      'dash.an.best':      'Best hour',
      'dash.set.connected':'Connected',
      'dash.set.connect':  'Connect',
    },
  };

  function detectInitial() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  let current = detectInitial();

  function applyLocale(lang) {
    const dict = DICT[lang] || DICT.es;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const spec = el.getAttribute('data-i18n-attr');
      // format: "attr1:key1|attr2:key2"
      spec.split('|').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key && dict[key] !== undefined) {
          el.setAttribute(attr, dict[key]);
        }
      });
    });

    document.querySelectorAll('[data-locale-toggle]').forEach((el) => {
      el.textContent = lang.toUpperCase();
      el.setAttribute('aria-label', lang === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish');
    });
  }

  function setLocale(lang) {
    if (lang !== 'es' && lang !== 'en') return;
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLocale(lang);
    document.dispatchEvent(new CustomEvent(EVENT, { detail: { locale: lang } }));
  }

  function toggleLocale() {
    setLocale(current === 'es' ? 'en' : 'es');
  }

  // Public API
  window.I18N = {
    setLocale,
    toggleLocale,
    getLocale: () => current,
    t: (key) => (DICT[current] && DICT[current][key]) || key,
  };

  // Initial apply
  document.addEventListener('DOMContentLoaded', () => {
    applyLocale(current);
    document.querySelectorAll('[data-locale-toggle]').forEach((el) => {
      el.addEventListener('click', toggleLocale);
    });
  });

  // Keyboard shortcut: L
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      toggleLocale();
    }
  });
})();
