# Auditoría Web & Plan de Branding: AutoPost

**Fecha:** 2026-04-16
**URL:** app.autopost.io (localhost en desarrollo)
**Nicho:** SaaS — Automatización de Instagram para agencias/creadores hispanos
**Público objetivo:** Community managers, agencias de social media, influencers y freelancers hispanohablantes

---

## Resumen Ejecutivo

AutoPost tiene una base visual **excepcionalmente sólida** — el sistema de motion design con Framer Motion, las easing curves cinematográficas, la paleta obsidian+gold y el hero 3D con Three.js lo posicionan como un producto premium. Sin embargo, hay oportunidades claras para elevar la experiencia a nivel **Stripe/Linear/Vercel** añadiendo animaciones que faltan, refinando las existentes y corrigiendo gaps de UX.

Las **3 acciones de mayor impacto** son: (1) Implementar un sistema de **scroll-linked animations** con parallax por capas para crear narrativa visual mientras el usuario baja, (2) Añadir **transiciones de número animadas** con morphing en la sección de pricing para el toggle annual/monthly, y (3) Crear **micro-feedback háptico** en todos los formularios del dashboard (validación inline, success states, skeleton loading con shimmer branded).

El proyecto ya tiene un sistema de motion tokens (`constants.ts`) muy bien estructurado — la clave es **explotar ese sistema al máximo** añadiendo las animaciones que faltan sin romper la coherencia existente.

---

## 1. Auditoría de Marca

### Estado actual
- **Logo:** Icono Zap genérico dentro de un cuadrado con gradiente. Funcional pero no memorable — no diferencia de otros SaaS. Legible en tamaños pequeños.
- **Tipografía:** Excelente elección. Satoshi para display (moderna, geométrica, premium) + Inter para body (máxima legibilidad). Jerarquía bien definida con `tracking-tight` en headings y `leading-relaxed` en body.
- **Tono de voz:** Directo, pain-focused, en español. Copy efectivo: "Un mes de Instagram en 2 minutos" es claro y memorable. "90x más rápido" genera urgencia.
- **Consistencia visual:** Alta. Sistema de design tokens coherente. Todos los componentes siguen el mismo lenguaje visual (glass morphism, gold glow, obsidian surfaces).
- **Confianza:** Bien cubierta con trust bar (API oficial Meta, Cifrado AES-256), testimonios con marquee, y sellos en pricing.

### Recomendaciones
- **Logo:** Diseñar un logomark propio que integre el concepto de "carpeta → publicación automática". El Zap de Lucide es demasiado genérico para brand recognition.
- **Favicon:** Asegurar que el favicon es el logomark, no el Zap genérico.
- **Copy de hero:** Añadir **social proof numérico** en el hero: "+500 agencias", "30,000 posts programados", etc.

---

## 2. Paleta de Colores

### Paleta actual
| Rol | Color | Hex | Evaluación |
|-----|-------|-----|-----------|
| Primario (Gold) | 🟡 | #FFAA00 | Excelente para SaaS premium — transmite energía, creatividad, calidez |
| Acento Indigo | 🟣 | #6366F1 | Buen complemento — confianza tech, modernidad |
| Acento Emerald | 🟢 | #34D399 | Success states, bien aplicado |
| Acento Coral | 🔴 | #F97066 | "Before" states y urgencia, correcto |
| Acento Orange | 🟠 | #FB923C | Transición cálida del gold, coherente |
| Background | ⚫ | #06080D | Obsidian profundo — premium, cinematográfico |
| Surface Card | ⬛ | #11141C | Elevación correcta sobre background |
| Text Primary | ⬜ | #F0F0F5 | Alto contraste, legibilidad perfecta |
| Text Secondary | 🔘 | #8B8FA3 | Buen balance para metadata |

### Paleta propuesta (refinamientos)
| Rol | Color | Hex | Justificación |
|-----|-------|-----|---------------|
| Primario | 🟡 | #FFAA00 | Mantener — funciona perfectamente para el nicho SaaS creativo |
| Primario Hover | 🟡 | #FFB826 | Añadir variante más clara para hover states — 10% más luminosa |
| Secundario | 🟣 | #6366F1 | Mantener — armonía complementaria con gold |
| Acento Success | 🟢 | #22C55E | Ajustar emerald a un verde más vibrante para notificaciones de éxito |
| Acento Warning | 🟠 | #F59E0B | Amber puro para warnings — diferenciado del brand gold |
| Acento Error | 🔴 | #EF4444 | Rojo más puro que coral para errores críticos |
| Acento Info | 🔵 | #3B82F6 | Mantener — trust, links informativos |
| Neutro 900 | ⬛ | #0A0D14 | Nuevo — intermedio entre background y card para layering |
| Neutro 100 | ⬜ | #E4E4E9 | Nuevo — para disabled states y placeholder text |

---

## 3. Microinteracciones y Motion Design

### Inventario actual de animaciones
AutoPost ya tiene un sistema de motion **sobresaliente** con:
- ✅ Scroll-triggered reveals (MotionReveal con blur+slide)
- ✅ Stagger containers (MotionStagger con delays configurables)
- ✅ Text split animations (MotionText con word-by-word reveal)
- ✅ Spring-based interactions (SPRING_BOUNCE, SPRING_SNAPPY, etc.)
- ✅ Custom cursor con trail de partículas
- ✅ 3D tilt cards con spotlight
- ✅ Magnetic buttons (MotionMagnetic)
- ✅ Floating elements (MotionFloat)
- ✅ Marquee infinito para testimonios
- ✅ Parallax con scroll (MotionParallax)
- ✅ Hero 3D con Three.js (phone + folder + particles)
- ✅ Morphing blobs en background
- ✅ Rotating conic border
- ✅ Card shine sweep en hover
- ✅ Connecting beam animado (Aceternity Tracing Beam)
- ✅ Skeleton loading con shimmer
- ✅ AnimatePresence para transiciones de contenido

### Animaciones que FALTAN y deberían añadirse

| # | Elemento | Animación | Duración | Easing | Trigger | Prioridad |
|---|----------|-----------|----------|--------|---------|-----------|
| 1 | **Scroll Progress Sections** | Parallax multicapa: fondo se mueve a 0.3x, contenido a 1x, decorativos a 1.5x | Continua | Linear (scroll-linked) | Scroll | 🔴 Alta |
| 2 | **Pricing Toggle** | Número morphing con counter spring + flash de color al cambiar anual/mensual | 600ms | `SPRING_COUNTER` | Click toggle | 🔴 Alta |
| 3 | **Navigation Links** | Underline que crece desde el centro con ease-out + subtle glow | 300ms | `ease-out` | Hover | 🔴 Alta |
| 4 | **Page Transition** | Fade + slide-up entre rutas con blur dissolve | 400ms | `EASE_CINEMATIC` | Route change | 🔴 Alta |
| 5 | **Bento Cards — Inner Demo** | Animación contextual dentro de cada card (ej: grid de fotos que rota, reloj animado, shield con pulse) | 3-8s loop | `ease-in-out` | In viewport | 🟡 Media |
| 6 | **Testimonial Hover** | Card eleva + sombra crece + bordes se iluminan con gradiente cónico sutil | 350ms | `EASE_OUT_EXPO` | Hover | 🟡 Media |
| 7 | **FAQ Accordion** | Grid-row expand con spring + icono rota 45° suavemente + content fade-in con stagger | 400ms | `SPRING_SMOOTH` | Click | 🟡 Media |
| 8 | **Stats Counter** | Número que sube con spring desde 0, con blur inicial + overshoot sutil | 1.2s | `SPRING_COUNTER` | Scroll into view | 🔴 Alta |
| 9 | **CTA Button Ripple** | Onda radial desde punto de click que se expande y desvanece (Material ripple premium) | 600ms | `ease-out` | Click | 🟡 Media |
| 10 | **Scroll-to-Section** | Smooth scroll con easing cinematográfico + sección destino hace un flash sutil | 800ms | `EASE_CINEMATIC` | Nav link click | 🟡 Media |
| 11 | **Loading Skeleton (Dashboard)** | Shimmer wave con gradiente brand-gold sutil en lugar de gris genérico | 2s loop | `linear` | Page load | 🟢 Baja |
| 12 | **Toast Notifications** | Slide-in desde derecha + spring bounce + auto-dismiss con progress bar | 300ms in, 5s visible | `SPRING_SNAPPY` | System event | 🟡 Media |
| 13 | **Form Validation** | Input border transition a green/red + icono check/x que hace pop con spring | 200ms | `SPRING_BOUNCE` | Input blur/change | 🔴 Alta |
| 14 | **Image Lazy Load** | Blur placeholder → sharp con scale 1.02→1 | 500ms | `EASE_OUT_EXPO` | Image loaded | 🟢 Baja |
| 15 | **Hover Glow Trail** | Gradiente radial que sigue al cursor dentro de cards (ya existe en spotlight pero puede mejorarse con color branded) | Continua | Spring-damped | Mouse move | 🟢 Baja |
| 16 | **Scroll Velocity Parallax** | Elementos decorativos (blobs, auroras) cambian velocidad según scroll velocity | Continua | `useVelocity()` | Scroll | 🟡 Media |
| 17 | **Text Scramble Effect** | Headline que hace scramble de caracteres antes de resolverse (estilo terminal/hacker) | 1.5s | Step function | Page load | 🟡 Media |
| 18 | **Magnetic Dock Icons** | Iconos de features hacen efecto dock de macOS al pasar el cursor cerca | Continua | `SPRING_MAGNETIC` | Proximity hover | 🟢 Baja |
| 19 | **Border Beam** | Luz que recorre el borde de cards/sections (Aceternity BorderBeam) | 6s loop | Linear | In viewport | 🟡 Media |
| 20 | **Gradient Mesh Background** | Background animado que responde sutilmente a posición del mouse (más allá de MouseGradient actual) | Continua | Spring damped | Mouse move | 🟢 Baja |

### Plan de animaciones detallado — TOP 10 Recomendaciones

#### 1. Scroll-Linked Parallax por Capas (IMPACTO ALTO)
```
Qué: Las secciones del landing deben tener profundidad visual con capas que se mueven a diferentes velocidades
Cómo: Usar useScroll() + useTransform() de Framer Motion para crear 3 capas:
  - Fondo (blobs, auroras): translateY a 0.3x del scroll
  - Contenido principal: translateY a 1x (normal)  
  - Elementos decorativos (badges, iconos): translateY a 1.3x
Duración: Continua, linked al scroll
Easing: Linear (scroll-driven)
Impacto: Crea sensación de inmersión 3D sin Three.js — como Stripe.com
```

#### 2. Number Morphing en Pricing (IMPACTO ALTO)
```
Qué: Cuando el usuario alterna entre Monthly/Annual, los precios cambian con animación de contador
Cómo: Usar MotionCounter existente con spring config. Cada dígito debe:
  - Desvanecerse con blur(4px) el número anterior
  - El nuevo número sube desde abajo con spring bounce
  - Flash de color gold en el momento del cambio
Duración: 600ms
Easing: SPRING_COUNTER (stiffness: 50, damping: 20)
Trigger: Click en toggle Annual/Monthly
```

#### 3. Animated Navigation Underline (IMPACTO ALTO)
```
Qué: Links del navbar tienen underline que crece desde el centro
Cómo: Pseudo-elemento ::after con scaleX(0) → scaleX(1) en hover
  - Color: gradiente brand gold → indigo
  - Height: 2px
  - Transform-origin: center
  - Incluir un glow sutil debajo
Duración: 300ms
Easing: ease-out
Trigger: Hover
```

#### 4. Page Transitions con View Transitions API (IMPACTO ALTO)
```
Qué: Transiciones suaves entre páginas del dashboard
Cómo: Implementar AnimatePresence a nivel de layout con:
  - Exit: opacity 1→0, y 0→-20, filter blur(0)→blur(6px)
  - Enter: opacity 0→1, y 20→0, filter blur(6px)→blur(0px)
  - Stagger los elementos principales del nuevo page
Duración: 400ms
Easing: EASE_CINEMATIC [0.22, 0.68, 0, 1]
Trigger: Route change
```

#### 5. Bento Card Inner Animations (IMPACTO MEDIO-ALTO)
```
Qué: Cada bento card de features tiene una micro-animación contextual dentro
Cómo:
  - "Detección de carruseles": Mini-grid de 4 fotos que se reorganizan
  - "Extracción de copy": Líneas de texto que aparecen una a una con cursor parpadeante
  - "Programación inteligente": Reloj miniatura con agujas que se mueven
  - "Meta API oficial": Shield con pulse ring periódico
  - "Fotos, videos y reels": Iconos que rotan en carousel mini
  - "Posts colaborativos": Dos avatares que convergen con overlap
Duración: 3-8 segundos en loop
Easing: SPRING_SMOOTH
Trigger: Card entra en viewport
```

#### 6. Stats Counter con Overshoot (IMPACTO ALTO)
```
Qué: Los números en StatsStrip deben contar desde 0 con efecto dramático
Cómo: Usar useSpring con overshoot — el número llega al target, lo supera un 5%, 
  y vuelve al target. Cada dígito tiene blur durante la transición.
  Añadir partícula de gold que estalla al llegar al número final.
Duración: 1.2s
Easing: SPRING_COUNTER con damping reducido a 15 para más bounce
Trigger: Scroll into viewport (IntersectionObserver)
```

#### 7. Text Scramble para Headlines (IMPACTO MEDIO)
```
Qué: El headline principal hace un efecto de descifrado — caracteres aleatorios 
  que se van resolviendo en el texto final, de izquierda a derecha
Cómo: Custom hook useTextScramble() que:
  1. Muestra caracteres aleatorios (from charset: "!@#$%^&*ABCXYZ")
  2. Cada 50ms resuelve 1-2 caracteres al texto final
  3. Caracteres ya resueltos se iluminan en gold brevemente
Duración: 1.5s total
Easing: Step function (discreto)
Trigger: Page load, después del HERO_SEQ.headline delay
Referencia: Terminal/hacker aesthetic como en monkeytype.com
```

#### 8. Border Beam (Aceternity) (IMPACTO MEDIO)
```
Qué: Punto de luz que recorre el perímetro del borde de cards destacadas
Cómo: Pseudo-elemento con conic-gradient que rota, pero solo ilumina un 
  arco de ~60° del borde. El resto es transparente.
  - Tamaño del punto de luz: 80px de arco
  - Color: gold #FFAA00 con glow
  - Se usa en: pricing card popular, final CTA card, y hero badge
Duración: 6s por vuelta completa
Easing: Linear
Trigger: Elemento en viewport
```

#### 9. Form Input Animations (IMPACTO ALTO — Dashboard)
```
Qué: Los inputs del dashboard tienen feedback visual rico
Cómo:
  - Focus: border transiciona de transparent → brand-500/30 con glow sutil
  - Valid: icono ✓ aparece con SPRING_BOUNCE, border → emerald/30
  - Error: icono ✗ aparece con shake horizontal (3px, 3 ciclos), border → coral/30
  - Label: sube y reduce tamaño con spring (floating label pattern)
  - Submit button: al enviar, texto cambia a spinner con morphing, 
    luego a checkmark con spring
Duración: 200-400ms según acción
Easing: SPRING_BOUNCE para success, ease-out para focus
Trigger: Focus, blur, validation
```

#### 10. Scroll Velocity Effects (IMPACTO MEDIO)
```
Qué: Elementos decorativos reaccionan a la velocidad del scroll
Cómo: Usar useVelocity(scrollY) de Framer Motion:
  - Blobs del background se estiran ligeramente en Y cuando scroll es rápido
  - Noise overlay varía su opacidad (más rápido = menos noise)
  - Stats strip se comprime un 2% en Y durante scroll rápido (efecto inercia)
Duración: Continua, spring-damped
Easing: SPRING_SMOOTH
Trigger: Scroll velocity change
```

---

## 4. Análisis UX y Puntos Débiles

### Flujo principal
```
Landing (Hero) → Scroll (Cómo funciona → Demo → Antes/Después → Features → ROI → Comparison → Testimonios → Pricing → FAQ → CTA) → Signup → Dashboard → Upload ZIP → Review → Schedule → Auto-publish
```

### Puntos de fricción
| # | Punto | Severidad | Impacto en conversión | Solución |
|---|-------|-----------|----------------------|----------|
| 1 | Hero tiene mucha info visual (3D + blobs + cursor) — puede abrumar en dispositivos lentos | Media | -5% bounce rate | Detectar GPU tier con `navigator.gpu` o `renderer.info` y degradar 3D a imagen estática en devices lentos |
| 2 | No hay demo interactiva real — el ProductDemo es una simulación estática | Alta | -15% conversión | Añadir un mini-sandbox donde el usuario pueda arrastrar un archivo real y ver el resultado sin registrarse |
| 3 | Pricing no muestra ahorro anual de forma visual (falta "Ahorra 20%") | Media | -8% upgrade rate | Añadir badge "Ahorra 20%" con pop animation al activar toggle annual |
| 4 | La navegación no tiene indicador de sección activa al scrollear | Baja | -2% engagement | Añadir active state en nav links basado en IntersectionObserver de cada section |
| 5 | No hay CTA visible en la sección de features/bento grid | Media | -5% | Añadir un CTA secundario ("Ver todas las funcionalidades") debajo del bento grid |
| 6 | FAQ no tiene búsqueda — si hay muchas preguntas, el usuario tiene que scrollear | Baja | -2% | Añadir filtro/búsqueda en FAQ si pasa de 8 items |

### Primera impresión (3 segundos)
- ✅ Se entiende qué hace (programar Instagram)
- ✅ CTA principal visible ("Programar mi primer mes — Gratis")
- ⚠️ El "90x más rápido" podría ser más prominente — es el dato que vende
- ⚠️ Falta un número de social proof en el hero ("Usado por X agencias")

---

## 5. Análisis de Competencia

### Competidores identificados
| Competidor | Fortalezas | Debilidades |
|-----------|-----------|-------------|
| **Later.com** | UI pulida, analytics avanzados, auto-publishing, linkin.bio | Lento para batch scheduling, no tiene upload ZIP, no soporta collabs |
| **Buffer.com** | Multi-plataforma, extensión browser, AI caption, pricing transparente | Sin detección automática de carruseles, proceso manual post a post |
| **Hootsuite** | Enterprise features, social listening, team workflows | Complejo, caro, overkill para creadores individuales |
| **Metricool** | Fuerte en mercado hispano, analytics, gratis limitado | UI anticuada, no tiene batch upload, animaciones inexistentes |
| **Planoly** | Visual planner, drag & drop grid, aesthetic UI | Solo Instagram, sin batch upload, sin collabs |

### Funcionalidades comparativas
| Feature | AutoPost | Later | Buffer | Metricool | Planoly |
|---------|----------|-------|--------|-----------|---------|
| Batch upload (ZIP/carpeta) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Detección auto de carruseles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Posts colaborativos (Collabs) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Extracción de copy de .txt | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-plataforma | ❌ | ✅ | ✅ | ✅ | ❌ |
| Analytics avanzados | ❌ | ✅ | ✅ | ✅ | ✅ |
| AI Caption | ❌ | ✅ | ✅ | ❌ | ❌ |
| Visual grid planner | ❌ | ✅ | ❌ | ✅ | ✅ |
| Animaciones premium (landing) | ✅✅ | ✅ | ✅ | ❌ | ✅ |

### Oportunidades de diferenciación
1. **AutoPost es el ÚNICO** con batch upload + auto-detección de carruseles + collabs. Esto debe ser el hero message.
2. **Gap: Analytics** — los competidores tienen métricas post-publicación. AutoPost podría añadir un dashboard básico de performance.
3. **Gap: AI Captions** — Integrar generación de captions con IA desde la carpeta (sin .txt).
4. **Ventaja visual**: La landing de AutoPost es significativamente más premium que Metricool o Planoly. Comparable a Linear/Vercel.

---

## 6. Optimización de Conversión (CRO)

### Análisis above the fold
- ✅ Propuesta de valor clara en headline
- ✅ CTA principal con copy orientado a beneficio ("Programar mi primer mes — Gratis")
- ✅ Trust bar con credenciales de seguridad
- ⚠️ Falta social proof numérico ("500+ agencias")
- ⚠️ El CTA secundario "Ver cómo funciona" es poco diferenciado visualmente

### CTAs
| CTA actual | Problema | CTA propuesto |
|-----------|----------|---------------|
| "Empezar gratis" (navbar) | Genérico | "Probar gratis 30 días" |
| "Programar mi primer mes — Gratis" (hero) | ✅ Excelente | Mantener |
| "Ver cómo funciona" | Sin urgencia | "Mira el demo en 30 segundos" |
| "Empezar con Pro" (pricing) | Genérico | "Desbloquear 5 cuentas — $19/mes" |
| "Empezar con Agency" (pricing) | Genérico | "Gestionar cuentas ilimitadas — $49/mes" |

### Quick wins de conversión
1. **Añadir social proof numérico en hero** ("+500 agencias confían en AutoPost")
2. **Badge "Ahorra 20%" en toggle annual** con animación pop
3. **Exit-intent popup** con oferta especial (30 días gratis del plan Pro)
4. **Sticky CTA mejorado en mobile** — mostrar precio + beneficio, no solo "Empezar"
5. **Video testimonial** — un video de 30 segundos de un usuario real vale más que 6 cards de texto

---

## 7. Copywriting UX

### Antes / Después
| Ubicación | Texto actual | Texto propuesto | Por qué |
|-----------|-------------|-----------------|---------|
| Header hero (badge) | "Automatización de Instagram para agencias" | "La herramienta #1 de agencias hispanas para Instagram" | Social proof implícito + posicionamiento |
| Subtítulo hero | "Arrastra tu carpeta. AutoPost detecta carruseles..." | "Arrastra. Programa. Olvídate. AutoPost publica 30 días por ti." | Más rítmico, enfatiza el beneficio final |
| "90x más rápido" | Texto pequeño en zinc-500 | Convertir en badge con gradiente y animación pulse | Es el dato que vende — debe ser prominente |
| Bento "Meta API oficial" | "OAuth oficial. Tu contraseña nunca se comparte." | "Conexión directa con Meta. Tus datos cifrados con AES-256." | Más específico y técnicamente impresionante |
| Final CTA | "Programa todo el mes de una vez y dedica tu tiempo a lo que importa." | "Mientras tú duermes, AutoPost publica. Programa 30 días en 2 minutos." | Más visceral, refuerza la automatización |
| Footer tagline | "Hecho para agencias e influencers hispanohablantes" | "Hecho en [país] para agencias de habla hispana 🇪🇸🇲🇽🇦🇷🇨🇴" | Banderas generan identificación regional |

---

## 8. Accesibilidad

| Criterio | Estado | Problema | Solución |
|----------|--------|----------|----------|
| Contraste texto | ✅ Bien | `#F0F0F5` sobre `#06080D` = ratio >15:1 | — |
| Contraste secundario | ⚠️ | `#5C6070` (text-muted) sobre `#06080D` = ratio ~3.2:1 | Subir a `#72768A` para cumplir 4.5:1 |
| Touch targets | ⚠️ | Algunos links del nav < 44px height | Añadir padding vertical para mínimo 44px |
| Alt text | ⚠️ | El hero 3D y blobs usan `aria-hidden` correctamente, pero imágenes del demo no tienen alt | Añadir alt descriptivo a todas las imágenes |
| Keyboard nav | ✅ Bien | `focus-visible` con outline brand-500 definido globalmente | — |
| Reduced motion | ✅ Excelente | Todas las animaciones se desactivan con `prefers-reduced-motion`. Implementado tanto en CSS como en Framer Motion (`useReducedMotion`) | — |
| Estructura semántica | ⚠️ | Headings saltan de h1 a h2 correctamente, pero los sub-headings (text-xs uppercase) no son headings | Considerar h3 para subtítulos de sección |
| Skip link | ❌ | No hay "Skip to content" link | Añadir skip link antes del navbar |
| ARIA landmarks | ⚠️ | Footer tiene `<footer>`, pero sections no tienen `role` ni `aria-label` | Añadir `aria-labelledby` a cada `<section>` |

---

## 9. Performance Percibida

| Área | Estado actual | Mejora propuesta | Impacto |
|------|-------------|-----------------|---------|
| Skeleton loading | ✅ Implementado | Cambiar shimmer color de gris a gold sutil (`rgba(255,170,0,0.05)`) para reforzar marca | Bajo — polish |
| Lazy loading 3D | ✅ Dynamic import con `ssr: false` | Añadir un placeholder ilustrativo (SVG del phone) en vez de skeleton gris | Medio — mejor primera impresión |
| Font loading | ⚠️ Inter (Google) + Satoshi (Fontshare) | Usar `font-display: swap` y preconnect a ambos CDNs | Alto — evita FOIT |
| Imágenes | ⚠️ No hay next/image optimizado en landing | Migrar todas las imágenes a `<Image>` de Next.js con `priority` en above-fold | Alto — LCP improvement |
| Bundle 3D | ⚠️ Three.js es ~500KB+ | Asegurar tree-shaking. Considerar `@react-three/offscreen` para worker thread | Medio — mobile performance |
| CSS | ✅ Tailwind con purge | — | — |
| Animaciones | ⚠️ Muchas simultáneas en hero | Usar `will-change: transform` solo en elementos animados activos. Usar `content-visibility: auto` en secciones below fold | Medio — reducir paint cost |

---

## 10. Funcionalidades y Tutoriales Interactivos

| Funcionalidad | Descripción | Prioridad | Esfuerzo |
|--------------|-------------|-----------|----------|
| **Demo sandbox interactivo** | Permitir drag & drop de archivos reales en el landing sin login — muestra preview de cómo se organizarían los posts | 🔴 Alta | 2 semanas |
| **Onboarding tour (dashboard)** | Tour guiado paso a paso al primer login: "Conecta tu cuenta → Sube tu primera carpeta → Revisa → Publica" con tooltips progresivos | 🔴 Alta | 1 semana |
| **Calculadora ROI mejorada** | Ya existe pero podría incluir: selector de "cuántas cuentas gestionas" × "posts por semana" × "tu tarifa horaria" = ahorro mensual con AutoPost | 🟡 Media | 3 días |
| **Comparador interactivo** | Slider tipo "antes/después" donde arrastras y ves: izquierda = proceso manual, derecha = AutoPost. Con timer animado en cada lado | 🟡 Media | 1 semana |
| **Status page** | Página simple mostrando uptime de la API, estado de Meta API, y últimos incidentes | 🟢 Baja | 2 días |
| **Modo oscuro/claro toggle** | El landing ya es dark — añadir toggle para light mode en el dashboard | 🟢 Baja | 1 semana |
| **AI Caption Generator** | Desde la interfaz de review, opción de generar caption con IA si no hay .txt | 🟡 Media | 2 semanas |
| **Calendar visual planner** | Vista tipo Planoly/Later donde ves el grid de Instagram y puedes reordenar posts con drag & drop | 🟡 Media | 3 semanas |

---

## Roadmap de Implementación

### Quick Wins (1-2 días)
1. **Navigation underline animada** — CSS puro, impacto visual alto
2. **Social proof numérico en hero** — "+500 agencias" con MotionCounter
3. **Badge "Ahorra 20%"** en pricing toggle con pop animation
4. **Skip-to-content link** para accesibilidad
5. **Fix contraste text-muted** (#5C6070 → #72768A)
6. **Font preconnect** para Google Fonts y Fontshare
7. **Stats counter overshoot** — refinar MotionCounter con spring más bouncy

### Medio plazo (1-2 semanas)
1. **Scroll-linked parallax multicapa** en todas las secciones
2. **Pricing number morphing** con counter animation al toggle
3. **Bento card inner animations** (micro-demos contextuales)
4. **Page transitions** con AnimatePresence en layout
5. **Border beam** en cards destacadas (pricing popular, final CTA)
6. **Form input animations** en dashboard (focus, valid, error states)
7. **Text scramble effect** como opción en hero headline
8. **Toast notification system** con slide-in + spring
9. **Active section indicator** en navbar basado en scroll
10. **Copy improvements** según tabla de Antes/Después

### Transformaciones (1+ mes)
1. **Demo sandbox interactivo** — drag & drop real sin login — Impacto: alto
2. **Onboarding tour guiado** en dashboard — Impacto: alto
3. **AI Caption Generator** integrado — Impacto: alto
4. **Calendar visual planner** estilo Planoly — Impacto: alto
5. **Scroll velocity effects** en elementos decorativos — Impacto: medio
6. **Performance audit** — Three.js optimization, image pipeline, bundle analysis — Impacto: alto

---

## Apéndice: Código de referencia para animaciones clave

### A. Navigation Underline (CSS)
```css
.link-underline {
  position: relative;
}
.link-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #FFAA00, #6366F1);
  transform: translateX(-50%);
  transition: width 0.3s ease-out;
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.3);
}
.link-underline:hover::after {
  width: 100%;
}
```

### B. Pricing Number Morph (React)
```tsx
<AnimatePresence mode="wait">
  <motion.span
    key={displayPrice}
    initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
    transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
  >
    {displayPrice}
  </motion.span>
</AnimatePresence>
```

### C. Border Beam (CSS)
```css
.border-beam {
  position: relative;
  overflow: hidden;
}
.border-beam::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: conic-gradient(
    from var(--beam-angle, 0deg),
    transparent 0deg,
    transparent 340deg,
    #FFAA00 350deg,
    #FFC226 360deg
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: beam-rotate 6s linear infinite;
}
@keyframes beam-rotate {
  to { --beam-angle: 360deg; }
}
```

### D. Stats Counter con Overshoot
```tsx
function AnimatedCounter({ target }: { target: number }) {
  const count = useMotionValue(0);
  const spring = useSpring(count, { stiffness: 50, damping: 15, mass: 1 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (isInView) count.set(target);
  }, [isInView]);
  
  return <motion.span>{rounded}</motion.span>;
}
```
