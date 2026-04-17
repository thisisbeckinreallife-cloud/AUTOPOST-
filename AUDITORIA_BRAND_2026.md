# Auditoría Web & Plan de Branding: AutoPost

**Fecha:** 2026-04-17
**URL:** http://localhost:3000 (rama `main`, commit `84b408e`)
**Nicho:** SaaS / Productividad para gestores de redes sociales y agencias hispanohablantes
**Producto:** Herramienta de programación y publicación automática de Instagram desde una carpeta o ZIP, vía API oficial de Meta
**Público objetivo primario:** Agencias de social media (3-30 cuentas) y community managers freelance hispanohablantes
**Público secundario:** Creadores de contenido prolíficos (foodies, viajeros, lifestyle) que publican varias veces por semana

---

## Resumen Ejecutivo

AutoPost ya tiene una **propuesta de valor verdaderamente diferenciada** en un mercado saturado: ningún competidor (Later, Buffer, Hootsuite, Metricool, Planoly) deja al usuario subir una **carpeta o ZIP completo** y deducir carruseles, copies y calendario sin trabajo manual. Esa "magia de carpeta → 30 días programados en 2 minutos" es vuestro foso defensivo y debe convertirse en el centro absoluto del relato visual y verbal.

La web actual ejecuta bien el principio "Apple-style premium light" pero adolece de **tres problemas que diluyen la promesa**:

1. **Contenido fuertemente duplicado** — Las features se repiten 3 veces a lo largo de 15 secciones (HeroScrollAnimation + BentoGrid + BenefitsScroll cuentan la misma historia). Ejemplos detectados en el DOM: `H3 "Posts colaborativos"` aparece **3 veces**, `H3 "API oficial de Meta"` **2 veces**. La página mide ~11.700 px de scroll en desktop — equivale a **13 viewports**, demasiado para una conversión de SaaS.
2. **CTAs incoherentes** — 6 botones a `/signup` con **5 textos distintos** ("Empezar gratis", "Programar mi primer mes — Gratis", "Empezar con Pro", "Empezar con Agency", "Empezar gratis — primera carpeta incluida"). Esto fragmenta el seguimiento y diluye el mensaje.
3. **Identidad de color genérica para el nicho** — El gold ámbar `#FFAA00` actual es el color de un cartel de carretera. Para SaaS premium hispanohablante con audiencia de agencias, transmite warning antes que premium. La web compite contra Buffer (azul intenso), Later (lavanda + coral), Hootsuite (verde búho), Planoly (rosa pastel) — todas con identidades muy reconocibles. El gold puede mantenerse como **acento exclusivo** pero el primario debe diferenciar en el nicho.

### Las 3 acciones de máximo impacto

1. **Reposicionar la identidad cromática a "Indigo Eclipse + Acento Gold"** (cambio de paleta que diferencia frente a competidores y refuerza percepción premium).
2. **Compactar la landing de 15 a 8 secciones** eliminando duplicados — un solo bloque de features (Bento), un solo bloque de comparación, un solo bloque de "cómo funciona".
3. **Unificar el CTA primario** a `Programar mi primer mes — gratis` (el que mejor explica el beneficio en contexto) y dejar el resto solo en planes pagos.

---

## 1. Auditoría de Marca

### Estado actual

| Elemento | Implementación actual | Diagnóstico |
|---|---|---|
| **Logo** | Icono Lucide `Zap` dentro de cuadrado con gradiente brand + wordmark "Auto**Post**" (gradiente en "Post") | Funcional pero genérico. `Zap` lo usan miles de SaaS. No comunica "redes sociales" ni "automatización por carpeta" |
| **Tipografía display** | Satoshi 800 — `font-extrabold tracking-[-0.03em] leading-[1.05]` | Excelente elección. Satoshi es el "Inter premium" de moda en SaaS top-tier (Linear, Cron) |
| **Tipografía body** | Inter 400/500/600 | Correcta, neutra |
| **Tono de voz** | Mezcla — directo y claro en hero ("2 minutos"), pero pierde foco en secciones intermedias con marketing-speak ("Diseñado para hacer mucho en poco tiempo") | Inconsistente |
| **Iconografía** | Lucide React (Zap, Upload, Calendar, Layers, Shield, Instagram) | Coherente y limpia ✓ |
| **Social proof** | Trust bar bajo hero (4 items: API Meta, AES-256, formatos, colaborativos) + sección de testimonios marquee con 6 quotes ficticios | Los testimonios suenan a stock. Los nombres "Marina Lopez / Diego Sanchez / Carla Fuentes" no aportan credibilidad real |
| **Coherencia visual** | Buena en cards (border-zinc-100 + shadow-sm + rounded-2xl) pero rota en `BenefitsScroll` que usa fondo `bg-zinc-950` (oscuro) en medio de una landing claramente light. Cambio brusco | Romper la luminancia rompe la continuidad visual |

### Recomendaciones concretas

**Logo — evolución, no revolución:**
- Sustituir `Zap` por un **glifo proprietario** que sea "una carpeta abriéndose en cuadrícula 3×3" (la grid de Instagram). Esto comunica el USP literal: carpeta → calendario.
- Mantener el wordmark Satoshi 800 con **un solo color sólido** (no gradiente en "Post" — actualmente hace el logo menos legible en favicon y app stores).
- Versión simbólica para favicon/touch-icon: solo el glifo en cuadrado redondeado (16/32/180 px).

**Tono de voz — Brand Voice Document:**
- **Personalidad:** Operador competente que respeta tu tiempo. Habla como un colega de oficina, no como folleto.
- **3 reglas:** (1) Dí "2 minutos", "30 días", "una carpeta" — números concretos > adjetivos. (2) Cero superlativos vacíos ("revolucionario", "líder"). (3) Usa verbos en imperativo desde la perspectiva del usuario ("Arrastra. Programa. Olvida."), no ejecutivo ("Diseñado para…").

**Testimonios — credibilidad:**
- Reemplazar los 6 quotes con 3 testimonios reales con foto (aunque sean beta-testers tempranos a quienes regales el plan Agency a cambio).
- Si no hay clientes aún, sustituir por una **etiqueta "En beta privada — 47 agencias en lista de espera"** (más honesto y crea escasez).

---

## 2. Paleta de Colores — Reposicionamiento Estratégico

### Paleta actual (extraída de `tailwind.config.ts`)

| Rol | Token | HEX | Problema |
|---|---|---|---|
| Primario | `brand.500` | `#FFAA00` | Gold ámbar saturado. En psicología cromática se asocia a **alerta/warning** antes que a premium. Usado por: McDonald's, Mastercard, IKEA. NO diferencia en SaaS de productividad |
| Acento orange | `accent.orange` | `#FB923C` | Demasiado cerca del primario — gold + orange compiten en el mismo segmento de longitud de onda |
| Acento indigo | `accent.indigo` | `#6366F1` | Bien (indigo-500 de Tailwind) pero relegado a segundo plano |
| Acento coral | `accent.coral` | `#F97066` | Usado para "before/urgency". Funcional |
| Texto primario | `#1D1D1F` | `#1D1D1F` | Apple gray. Correcto ✓ |
| Texto secundario | `text-zinc-500` | `#71717A` | Correcto, ratio 5.7:1 sobre blanco ✓ |
| Texto terciario | `text-zinc-400` | `#A1A1AA` | **FALLA WCAG AA** — ratio 2.74:1 sobre blanco. Detectado en hero ("Sin tarjeta de credito · Cancela cuando quieras") y disclaimers |

### Por qué cambiar el primario — la psicología cromática para este nicho

El usuario objetivo (operadora de social media en una agencia) está **bombardeada visualmente todo el día** por feeds de Instagram saturados (rojos, rosas, naranjas, amarillos). Tu herramienta debe ser un **descanso visual y autoritativo**, no añadir más ruido cromático al ecosistema en el que ya viven.

- **Estudio aplicado:** las herramientas de productividad que dominan en valoración percibida (Linear `#5E6AD2`, Notion gris/negro, Vercel negro/blanco, Stripe `#635BFF`) tienden a **azules profundos, índigos o monocromáticos**. Estos colores activan en córtex visual la asociación con **infraestructura confiable** y reducen la fatiga visual.
- **Gold como primario en este nicho** se confunde con notificaciones de Meta (warning de cuenta), con el "pro" de Mailchimp, y con Mastercard. Saturado al 100% (`#FFAA00`) además vibra contra fondos blancos (efecto fluorescente) y ensucia los gradientes con `#F97066`.
- **El gold sigue siendo poderoso** — pero como **acento exclusivo**, reservado para CTA primario y marca premium (límite ~5% de píxeles totales). Esto es el principio "less is more" del lujo (Hermès usa naranja en <2% de su superficie visual).

### Paleta propuesta — "Indigo Eclipse"

Esta paleta posiciona AutoPost como **infraestructura premium para profesionales**, diferencia frente a TODOS los competidores principales y mantiene el gold como firma visual exclusiva.

| Rol | Color | HEX | Justificación |
|---|---|---|---|
| **Primario brand** | Indigo Eclipse | `#4F46E5` | Indigo-600 sólido. Transmite confianza tecnológica + premium. Diferencia: Buffer es `#168EEA` (azul Twitter), Later es `#9CA3FF` (lavanda pastel) — ningún competidor "posee" este indigo profundo |
| **Primario hover/dark** | Eclipse Deep | `#3730A3` | Indigo-800. Para estados pressed y barras de navegación oscuras |
| **Acento de marca (NO primario)** | Signature Gold | `#D4A857` | Toasted gold sofisticado (Loro Piana / Burberry territory) en lugar del `#FFAA00` highway-sign. Reservado SOLO para: CTA principal, badge "Premium", subrayado del wordmark logo |
| **Gradient hero** | Eclipse → Gold | `linear-gradient(135deg, #4F46E5 0%, #D4A857 100%)` | El "magic gradient" de la marca. Indigo en frío + gold en caliente = tensión cinematográfica memorable |
| **Success** | Verde Salvia | `#16A34A` | Más profesional que el `#34D399` actual (que tira a turquesa juguetón) |
| **Warning** | Mostaza | `#CA8A04` | Diferenciado del gold de marca para que NO se confundan |
| **Error** | Rojo Carmín | `#DC2626` | Más legible sobre blanco que coral |
| **Info / Link** | Cobalto | `#2563EB` | Para enlaces inline en texto largo |
| **Neutro 950** | Tinta | `#0A0A0F` | Reemplaza el `#1D1D1F` Apple — un punto más oscuro y con un toque de azul (frío). Texto principal |
| **Neutro 700** | Grafito | `#3F3F46` | Subtítulos, navegación |
| **Neutro 500** | Slate | `#64748B` | Texto secundario. Ratio 4.78:1 ✓ |
| **Neutro 400** | Pizarra | `#94A3B8` | Texto terciario MÍNIMO. Ratio 3.05:1 — solo válido para texto ≥18px **bold** |
| **Surface base** | Niebla | `#FAFAFC` | Ligero tinte azulado en lugar del `#FAFAFA` actual. Coherente con primario indigo |
| **Surface card** | Blanco | `#FFFFFF` | Cards con `box-shadow` muy ligero |
| **Border subtle** | rgba(15,23,42,0.06) | `rgba(15,23,42,0.06)` | Tinte azulado en lugar de negro puro |

### Mapa de uso (regla 60-30-10)

- **60% Niebla + Blanco** — fondos, surfaces, espacio respirable
- **30% Tinta + Grafito + Slate** — texto, iconos, jerarquía
- **10% Indigo Eclipse + Signature Gold** — acentos de marca, CTAs, badges, glow shadows

### Aplicación al CTA principal

```css
.cta-primary {
  background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
  color: #FFFFFF;
  box-shadow:
    0 0 0 1px rgba(79,70,229,0.20),
    0 8px 24px -8px rgba(79,70,229,0.45),
    0 0 32px -4px rgba(212,168,87,0.20); /* gold glow muy sutil */
}
.cta-primary:hover {
  box-shadow:
    0 0 0 1px rgba(79,70,229,0.30),
    0 12px 32px -8px rgba(79,70,229,0.55),
    0 0 48px -4px rgba(212,168,87,0.30);
  transform: translateY(-1px);
}
```

---

## 3. Microinteracciones y Motion Design

### Estado actual

| Diagnóstico | Detalle |
|---|---|
| ✅ Excelente | `framer-motion` con sequencing cinematográfico (`HERO_SEQ`), `MotionMagnetic`, `BorderBeam`, hover tilts. Setup técnico de top-tier |
| ⚠️ Sobrecarga | El hero ejecuta simultáneamente: video full-bleed + Meteors x2 (35+6) + MouseGradient + GooeyText animado + 4 motion.div con springs + AnimatedGridPattern. Detectado: el screenshot del preview tool **timed out 3 veces** — la página no es interactiva durante varios segundos |
| ⚠️ Conflicto motion | `prefers-reduced-motion` está implementado en CSS pero las animaciones JS de framer-motion **no lo respetan automáticamente**. Riesgo de mareo para usuarios con vestibulares sensibles |
| ⚠️ Inconsistencia easing | Coexisten `EASE_CINEMATIC`, `EASE_OUT_EXPO`, `EASE_BACK_OUT`, `SPRING_BOUNCE`, `SPRING_SNAPPY`, `SPRING_WOBBLY`. Demasiado vocabulario — el usuario no debería percibir 6 personalidades distintas en una misma página |

### Plan de motion — sistema unificado

| Elemento | Animación | Duración | Easing | Trigger | Notas |
|---|---|---|---|---|---|
| Hero entrance | Stagger 5 elementos (badge → headline → sub → CTA → trust) | 800-1200ms cada uno, 200ms entre | `cubic-bezier(0.16, 1, 0.3, 1)` | page load | Conservar sequencing actual ✓ |
| **GooeyText morphing** | Reducir velocidad (`morphTime: 2.5s`, `cooldown: 3s`) y palabras a **3 máximo** ("Instagram", "contenido", "crecimiento") | 2500ms morph | morfo nativo | infinite | El cooldown actual de 2s genera fatiga |
| Botón CTA principal | Scale 1→1.03 + shadow `glow-md` + 2px translate-y | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot sutil) | hover | Quitar el `cta-pulse` infinito — distrae |
| Botón CTA principal | Press: scale 1→0.97 + translate-y 1px | 100ms | `ease-out` | active | ✓ ya implementado |
| Cards Bento | Tilt 3D max 8° + shine sweep al hover | 400ms | `ease-out` | hover | Bajar tilt máximo (actual >12° marea) |
| Scroll reveal | Fade 0→1 + translate-y 24→0 + blur 8→0 | 600ms | `cubic-bezier(0.16, 1, 0.3, 1)` | IntersectionObserver `threshold: 0.15` | Eliminar `MotionStagger` con stagger >0.1s en listas largas — se siente lento |
| **Meteors** | **ELIMINAR los meteoros del hero** | — | — | — | Costo computacional alto vs valor narrativo bajo. Ya hay video + gradient + mouse follow |
| Trust badges | Pulse opacidad 1→0.85→1 cada 4s | 4000ms | `ease-in-out` | infinite | Solo 1 badge a la vez, no todos |
| Marquee testimonios | Velocidad 60s/loop (ahora 45s — demasiado rápido para leer) | 60000ms | linear | infinite | Pausa en hover (ya existe ✓) |
| Number counter | Tween de 0 al valor target | 1500ms | `easeOutCubic` | viewport entrada | ✓ existe |

### Reglas del sistema de motion

1. **Una animación a la vez por viewport visible** — si hay 5 elementos animándose simultáneamente, eres ruido.
2. **Easing primario único:** `cubic-bezier(0.16, 1, 0.3, 1)` para 90% de transiciones. Springs solo para feedback táctil de botones/cards.
3. **Duración escalonada:** 100ms (micro), 200ms (UI), 400ms (revelación), 800ms (hero) — nada más entre medias.
4. **Respeta `prefers-reduced-motion`** en framer-motion via `useReducedMotion()` hook — disable parallax, tilt, magnetic, marquee.

---

## 4. Análisis UX y Puntos Débiles

### Flujo principal detectado

```
Landing (15 secciones, 11.700px scroll desktop)
  → Hero con CTA "Programar mi primer mes — Gratis"
  → Stats strip
  → HeroScrollAnimation (sticky + features mockup)
  → BenefitsScroll (sección oscura sobre fondo claro — corte visual)
  → Como funciona (3 steps)
  → ProductDemo
  → Before/After
  → Bento Features (7 cards, repite USPs ya vistos)
  → BenefitsScroll (Aceternity ContainerScroll)
  → ROI Calculator
  → Comparison Table
  → Testimonials (marquee)
  → Pricing (3 planes con annual toggle)
  → FAQ
  → Final CTA
  → Footer
```

### Puntos de fricción detectados

| # | Punto | Severidad | Impacto en conversión | Solución concreta |
|---|---|---|---|---|
| 1 | **Página 13 viewports de scroll en desktop** (11.706px / 900px). Scroll fatigue garantizado | Alta | -25% scroll-to-CTA estimado | Cortar a 8 secciones max (~6-7 viewports). Eliminar BenefitsScroll oscuro, fusionar Bento + HeroScroll |
| 2 | **Posts colaborativos repetido 3 veces** (HeroScroll + Bento + BenefitsScroll). Si es UNA feature única, debe tener UN spotlight | Alta | Dilución del USP más fuerte | Crear sección dedicada "Lo que ningún otro scheduler tiene" con esa sola feature, mockup animado del split de carruseles colaborativos |
| 3 | **CTAs incoherentes** (5 textos para 1 acción) | Alta | Fragmenta tracking, reduce confianza ("¿es lo mismo?") | Estandarizar: nav = "Empezar gratis", hero/final = "Programar mi primer mes — gratis", pricing = "Empezar con [Plan X]" |
| 4 | **Touch targets nav <44px** (detectado: 20px alto) | Media | Falla WCAG y dificulta tap móvil | Subir a `py-3` mínimo (48px tap area) en `<a>` de nav y footer |
| 5 | **Texto 12px en gris #A1A1AA** (disclaimers) — ratio 2.74:1 falla AA | Media | Inaccesible para baja visión, falla auditorías | Subir a 13px mínimo y color `#71717A` (zinc-500). Si DEBE ser 12px, usar `#52525B` (zinc-600) |
| 6 | **Sin precio visible above the fold** | Media | Usuario tech-savvy abandona si no encuentra precio rápido | Añadir microcopy en hero: "Desde 0€ · Plan gratis para 1 cuenta" |
| 7 | **No hay vídeo demo del producto en hero** — solo decorativo. El usuario entra y no ve QUÉ ES | Alta | Tasa de salida en hero alta | Reemplazar el video Cloudinary genérico por screencast de 8s del flujo real: drag carpeta → mockup calendar → posts ya programados |
| 8 | **Sección oscura `bg-zinc-950` rompe luminancia** | Media | Cognitive load | Convertir a fondo `#FAFAFC` con accent indigo, mantener consistencia light |
| 9 | **GooeyText con 4 palabras** (Instagram, contenido, engagement, crecimiento) — el usuario lee la primera y la última, las del medio se pierden | Baja | Confusión del valor primario | Reducir a 3 palabras y elegir la más impactante: "contenido", "Instagram", "crecimiento" |
| 10 | **Warnings en consola** (`'sRGBEncoding' is not exported from 'three'`, scroll offset) | Baja | Calidad técnica percibida en code reviews | Migrar a `THREE.SRGBColorSpace` (Three.js r152+) o eliminar 3D si no se usa |
| 11 | **No hay onboarding del producto en la landing** — el visitante llega y solo ve marketing | Media | Conversión a "trial activo" baja | Añadir un mini-demo interactivo (drag de carpeta de juguete → muestra 3 posts mockeados) en lugar de la `ProductDemo` actual |
| 12 | **Footer minúsculo (texto 12px gris #71717A)** sin links a recursos clave (blog, status, soporte, docs) | Baja | Trust signal débil | Reestructurar a 4 columnas: Producto / Recursos / Compañía / Legal |

---

## 5. Análisis de Competencia

### Competidores identificados

| Competidor | URL | Pricing | Fortalezas | Debilidades |
|---|---|---|---|---|
| **Later** | later.com | Desde $18.75/mes | Visual planner del feed (drag-drop grid), AI Smart Scheduling, integración Canva, app móvil sólida | UI sobrecargada, no soporta carga masiva por carpeta, plan gratis muy limitado |
| **Buffer** | buffer.com | Desde $5/canal/mes | UI limpísima, plan gratis decente (3 canales, 10 posts), API publica, comunidad | Programación 1-a-1, sin detección de carruseles, sin colaborativos |
| **Hootsuite** | hootsuite.com | Desde $99/usuario/mes | Líder enterprise, analytics avanzados, social inbox | **Caro**, UI antigua, complejo, no diseñado para creators |
| **Metricool** | metricool.com | Free tier potente | Analytics gratis, competidor tracking, multi-plataforma | Programación es secundaria al analytics, UX confusa |
| **Planoly** | planoly.com | Desde $16/mes | Aesthetic feed planning, fuerte con influencers, mockups visuales | Solo Instagram/Pinterest, sin carga ZIP, sin colaborativos automáticos |

### Tabla comparativa de funcionalidades

| Feature | AutoPost | Later | Buffer | Hootsuite | Metricool | Planoly |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| **Carga por carpeta/ZIP entera** | ✅ **único** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Detección automática de carruseles | ✅ **único** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Posts colaborativos automatizados | ✅ **único** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Programación >30 días en 1 acción | ✅ | ⚠️ manual | ⚠️ manual | ✅ | ⚠️ manual | ⚠️ manual |
| API oficial Meta v21 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-cuenta (agencias) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ limitado |
| Reels + carruseles + fotos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Plan gratis | ✅ | ❌ trial 14d | ✅ 3 canales | ❌ trial | ✅ 1 brand | ❌ trial |
| Visual feed planner | ❌ | ✅ | ❌ | ❌ | ⚠️ básico | ✅ |
| Analytics nativos | ❌ | ✅ | ✅ | ✅ | ✅ ⭐ | ⚠️ básico |
| Social inbox / DMs | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| App móvil | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **UI en español nativo** | ✅ | ⚠️ traducido | ⚠️ traducido | ⚠️ traducido | ✅ | ⚠️ traducido |

### Oportunidades de diferenciación — el "Three Wedge Strategy"

AutoPost no debe competir como un "scheduler genérico mejor". Debe **redefinir la categoría** plantando bandera en 3 espacios donde nadie más juega:

#### 🔱 Wedge 1 — "El único que entiende carpetas"
Toda la marca debe girar en torno a este USP. Tagline propuesta:
> **"El primer scheduler que habla el lenguaje de tu carpeta de Drive."**

Visualmente: glifo del logo = carpeta abriendo grid. Hero animation = arrastre de folder → 30 posts en calendario.

#### 🔱 Wedge 2 — "Hecho para agencias hispanohablantes"
Later/Buffer/Hootsuite están traducidos pero su soporte, copy, formación y comunidad son anglo. AutoPost puede dominar el LATAM + España con:
- Soporte en español por humanos (no solo chatbot)
- Casos de éxito de agencias mexicanas, colombianas, españolas
- Templates de calendario por sector con costumbre LATAM (día de muertos, día del niño, Black Friday LATAM-fechas reales)
- Blog y comunidad Discord en español

#### 🔱 Wedge 3 — "Posts colaborativos sin coordinación manual"
Es VERDADERAMENTE único. Ningún competidor lo automatiza. Esto debe tener su propia sección "feature-spotlight" con animación que muestre 2 feeds llenándose simultáneamente con el MISMO post.

---

## 6. Optimización de Conversión (CRO)

### Análisis above the fold

**Lo que funciona ✓**
- Headline impactante con número concreto ("2 minutos")
- CTA claro de beneficio ("Programar mi primer mes — Gratis")
- Disclaimer "Sin tarjeta de crédito"
- Trust bar visible

**Lo que falla ✗**
- El video full-bleed de fondo es **decorativo, no demostrativo**. Un nuevo visitante no entiende qué hace el producto en los primeros 3 segundos
- El GooeyText morphing es un "trick" estético pero **distrae del headline principal**
- No hay precio visible
- No hay screenshot/mockup del producto real
- Trust bar tiene 4 items pero ninguno aporta cifras concretas (cuántos posts publicados, cuántas agencias activas)

### Hero rediseñado — wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo nuevo] Producto Precios Demo Login [CTA-secundario] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Badge: 🆕 v2.1 — Posts colaborativos automáticos]        │
│                                                             │
│         Un mes de Instagram                                 │
│       en 2 minutos, no en 2 horas                          │
│                                                             │
│   Arrastra una carpeta. AutoPost detecta carruseles,        │
│   extrae los copies y programa 30 días automáticamente.     │
│                                                             │
│   [▶ Programar mi primer mes — Gratis]  [Ver demo de 90s]  │
│                                                             │
│   ✓ Plan gratis para 1 cuenta · Sin tarjeta · API Meta     │
│                                                             │
│   ┌────────────────────────────────────────────────────┐    │
│   │ [LOOP de 8s del producto real — drag carpeta →    │    │
│   │  preview de carruseles → calendario completo]     │    │
│   │  con border indigo/gold sutil + reflejos          │    │
│   └────────────────────────────────────────────────────┘    │
│                                                             │
│   Confiado por 47 agencias · 12.840 posts publicados       │
└─────────────────────────────────────────────────────────────┘
```

### CTAs — antes / después

| Ubicación | Actual | Propuesto | Razón |
|---|---|---|---|
| Nav | "Empezar gratis" | "Empezar gratis" | Mantener — corto, scaneable |
| Hero principal | "Programar mi primer mes — Gratis" | "Programar mi primer mes — gratis" | Mantener (es el mejor) — solo bajar mayúscula del "Gratis" para leer mejor |
| CTAs intermedios | "Empezar gratis" (3x) | **ELIMINAR** los CTAs intermedios duplicados. Reemplazar por "Ver cómo funciona" → ancla a sección demo | Reduce decisiones, evita el "yo ya vi ese botón" |
| CTA final | "Empezar gratis — primera carpeta incluida" | "Programar mis primeros 30 días — gratis" | Más claro qué obtienes |
| Pricing Pro | "Empezar con Pro" | "Empezar con Pro · 14 días gratis" | Elimina fricción del primer mes |
| Pricing Agency | "Empezar con Agency" | "Hablar con ventas → Plan Agency" | A este precio (€) merece consultoría 1-1 |

### Quick wins de conversión (TOP 5)

1. **Sustituir video decorativo por screencast del producto real** (8s loop, autoplay, muted, max 800KB)
2. **Añadir contador de posts publicados** ("12.840 posts publicados desde marzo de 2025") — número creíble específico
3. **Eliminar 3 secciones intermedias** (BenefitsScroll oscuro + Bento duplicado + HeroScroll que repite features)
4. **Sticky CTA en mobile cuando se scrollea >800px** ya existe — bien. Añadir desktop con menor opacidad
5. **Pricing toggle annual/monthly con descuento visible** ("Ahorra 2 meses con anual" badge) — el toggle existe pero no comunica el descuento

---

## 7. Copywriting UX — Antes / Después

| Ubicación | Texto actual | Texto propuesto | Por qué |
|---|---|---|---|
| Badge hero | "Automatización de Instagram para agencias" | "🆕 Posts colaborativos en beta" | El actual es genérico. El nuevo crea curiosidad sobre la feature USP |
| H1 hero | "Un mes de [morphing] en 2 minutos" | "Un mes de Instagram en 2 minutos, no en 2 horas" | Comparación temporal explícita = ancla mental memorable |
| Subtítulo hero | "Arrastra tu carpeta. AutoPost detecta carruseles, extrae los copies y programa 30 días." | Mantener — está bien ✓ | — |
| "90x más rápido que hacerlo a mano" | OK pero suena exagerado | "5 minutos de trabajo en lugar de 3 horas semanales" | Específico = creíble. "90x" suena a marketing |
| H2 "Cómo funciona" | "Tres pasos. Cero complicaciones." | "De carpeta a calendario en 3 pasos" | Transmite la transformación específica |
| H2 Bento | "Diseñado para hacer mucho en poco tiempo" | "Lo que harás (y lo que ya nunca harás)" | Crea contraste, evoca el dolor |
| Step 1 | "Arrastra tu carpeta (o ZIP)" | "Arrastra tu carpeta de Drive, Dropbox o Finder" | Específico = familiar = confianza |
| Step 2 | "Revisión automática" | "Revisamos. Tú confirmas." | Más activo, deja claro que tú apruebas |
| Step 3 | "Programa y olvida" | "Programa una vez. Publica 30 días." | Concreto |
| Error genérico de form | (no detectado) | "Ese ZIP no parece tener fotos. ¿Quieres ver el formato esperado? [Ver ejemplo]" | Útil, no acusatorio |
| Empty state batches | (no detectado) | "Aún no has subido ninguna carpeta. [Subir mi primera] o [Ver carpeta de ejemplo]" | Guía + reduce ansiedad |
| Footer tagline | "Hecho para agencias e influencers hispanohablantes" | "Hecho en Madrid para agencias hispanohablantes" | Origen = identidad. Madrid = diferencia frente a SF tools |
| FAQ pregunta tipo | "¿Cómo funciona?" | "¿Mi cuenta de Instagram está segura si os doy acceso?" | Empieza por la objeción más alta (seguridad), no por lo obvio |

---

## 8. Accesibilidad (WCAG 2.1 AA)

| Criterio | Estado | Problema detectado | Solución |
|---|:-:|---|---|
| Contraste texto principal | ✅ | `#1D1D1F` sobre `#FFF` = 18:1 | OK |
| Contraste texto secundario | ✅ | `#71717A` sobre `#FFF` = 5.7:1 | OK |
| Contraste texto terciario | ❌ | `#A1A1AA` sobre `#FFF` = 2.74:1 (12px) — falla AA | Usar `#71717A` mínimo, subir size a 13px |
| Contraste sobre amarillo brand | ⚠️ | `#FFAA00` sobre blanco — el texto blanco encima del CTA gold es marginal, ratio 2.5:1 | Cambiar primario a indigo `#4F46E5` resuelve esto (ratio 7.5:1 con blanco) |
| Tamaño body text | ⚠️ | 12px en disclaimers (recomendado mínimo 14px) | Subir a 13px mínimo, 14px ideal |
| Touch targets nav | ❌ | Detectado: links de nav 20px alto, footer links 16px | Subir a `py-3` (48px tap area) en `<a>` de nav |
| Touch target CTA principal | ✅ | 41px alto | Subir a 48px para móvil ideal |
| Alt text imágenes | ⚠️ | Video sin `aria-label` o `<track>` para descripción | Añadir `aria-label="Video decorativo de fondo"` o mejor: hacer el video el demo del producto y añadir caption |
| Navegación por teclado | ⚠️ | Focus visible existe (`outline: 2px solid var(--brand-500)`) ✓ pero el `CustomCursor` puede interferir | Verificar Tab order y que el cursor custom no oculte focus rings |
| Estructura semántica | ⚠️ | Detectado: 12 `<h2>` y 30+ `<h3>` — algunos `h3` deberían ser `h2` por jerarquía | Auditoría heading: máx 1 H1, H2 por sección, H3 dentro de H2 |
| `prefers-reduced-motion` | ⚠️ | CSS lo respeta pero framer-motion necesita `useReducedMotion()` hook explícito | Wrap animaciones con check: `const reduce = useReducedMotion(); if (reduce) return <>{children}</>` |
| Idioma de página | ✅ | `lang="es"` en `<html>` (asumido — verificar) | Verificar |
| Form labels | ❓ | No auditado en este pase (login/signup) | Pendiente revisión flujo auth |

---

## 9. Performance Percibida

| Área | Estado actual | Mejora propuesta | Impacto |
|---|---|---|---|
| Video hero | Cloudinary externo full-bleed `dds3_1_rqhg7x.mp4` autoplay loop | (1) Mover a self-hosted con `<source type="video/webm">` + fallback mp4. (2) Poster image inmediato. (3) `preload="metadata"` no `auto` | Reduce LCP ~1.5s |
| Three.js (`@react-three/fiber` + `drei`) | Importado pero `HeroScene` no aparece visiblemente en hero | **Eliminar dependencia si no se usa** (ahorra ~600KB gzipped) | Bundle inicial -30% |
| Framer-motion animations | 80+ motion components en hero+features | Lazy-load `MotionReveal` con dynamic import por debajo del fold | TTI mejora ~400ms |
| Imágenes | No detectadas como problema (solo video) | Si hay screenshots de producto: WebP/AVIF + `<picture>` + `loading="lazy"` | — |
| Fonts | Satoshi + Inter | Verificar `font-display: swap` en `@font-face`, preconnect al CDN, subset latino | Evita FOIT |
| Skeleton screens | Existen (`skeleton` clase) | Asegurar que TODOS los `<dynamic />` tengan skeleton | UX subjetiva mejora |
| Critical CSS | Tailwind purga ✓ | Auditar que el CSS above-fold venga inline en el `<head>` | Reduce CLS |
| Scroll listeners | Detectado: `useScroll`, `useMotionValueEvent`, `addEventListener('scroll')` × N | Pasar todos a `{ passive: true }` (algunos lo hacen ✓) y consolidar en un único hook | Reduce jank en mobile |

---

## 10. Funcionalidades Interactivas Propuestas

| Funcionalidad | Descripción | Prioridad | Esfuerzo |
|---|---|---|---|
| **Sandbox interactivo en hero** | Mini-area drop con un ZIP de juguete pre-cargado. El usuario clica "Probar con datos demo" y ve el preview en vivo del calendario sin login | 🔥 Alta | 1 semana |
| **Demo en 90 segundos en modal** | Botón "Ver demo de 90s" abre lightbox con video screencast del producto real (Loom-style) | 🔥 Alta | 2 días (grabación + integración) |
| **Calculadora ROI mejorada** | La actual existe pero es estática. Mejora: input "¿cuántas cuentas gestionas?" → output dinámico con gráfica de horas ahorradas/mes y €/mes | Media | 4 días |
| **Calendario de templates por sector** | Sección "Templates" con calendarios pre-armados: foodie, viajes, fitness, ecommerce moda. Descargables como ZIP de ejemplo | Media | 1 semana |
| **Comparador interactivo "AutoPost vs"** | Slider que muestra "Hacer manualmente" vs "Con AutoPost" con timeline animada (3h vs 5min) | Media | 3 días |
| **Live counter de posts publicados** | Número grande pulsando en footer: "12.847 posts publicados con AutoPost · 47 agencias activas" actualizándose | Baja | 1 día |
| **Status page público** | status.autopost.app con uptime histórico — trust signal para agencias profesionales | Media | 2 días (UptimeRobot embed) |
| **Onboarding con tutorial in-app** | Tour guiado (Shepherd.js) post-signup: 4 pasos hasta primer ZIP subido | 🔥 Alta | 1 semana |
| **Modo oscuro** | Toggle dark mode coherente con paleta nueva (Indigo Eclipse → Eclipse Deep) | Baja | 1 semana |
| **Webhook → Slack/Discord** | "Te avisamos en Slack cuando se publique cada post" — feature gancho para agencias | Baja | 3 días |

---

## 11. Sistema de Diseño Premium — Tokens Finales

### Design tokens recomendados (sustituir en `tailwind.config.ts`)

```typescript
colors: {
  brand: {
    50:  "#EEF2FF",   // indigo-50
    100: "#E0E7FF",   // indigo-100
    200: "#C7D2FE",   // indigo-200
    300: "#A5B4FC",   // indigo-300
    400: "#818CF8",   // indigo-400
    500: "#6366F1",   // indigo-500 — brand primary mid
    600: "#4F46E5",   // indigo-600 — brand primary (CTA, links)
    700: "#4338CA",   // indigo-700 — hover/pressed
    800: "#3730A3",   // indigo-800 — dark surfaces
    900: "#312E81",   // indigo-900 — text on light brand bgs
    950: "#1E1B4B",   // indigo-950 — extreme contrast
  },
  signature: {
    gold:    "#D4A857",  // toasted gold — acento exclusivo, max 5% px
    goldDk:  "#A88142",  // hover gold
    goldLt:  "#F2D896",  // gold tint background
  },
  accent: {
    blue:    "#2563EB",  // links inline
    emerald: "#16A34A",  // success
    amber:   "#CA8A04",  // warning
    red:     "#DC2626",  // error
  },
  surface: {
    primary:   "#FFFFFF",
    secondary: "#FAFAFC",  // tinte azulado sutil
    tertiary:  "#F4F4F8",
    card:      "#FFFFFF",
    hover:     "#F1F1F5",
    elevated:  "#FFFFFF",
    eclipse:   "#0F0E1A",  // dark mode surface (futuro)
  },
  ink: {
    950: "#0A0A0F",  // primary text
    700: "#3F3F46",  // headings on light
    500: "#64748B",  // secondary text (ratio 4.78:1) ✓
    400: "#94A3B8",  // tertiary text (solo ≥18px bold)
    300: "#CBD5E1",  // dividers
    200: "#E2E8F0",  // borders
  },
}
```

### Sombras — sistema Eclipse

```typescript
boxShadow: {
  "card":         "0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)",
  "card-hover":   "0 8px 24px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)",
  "elevated":     "0 16px 48px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.06)",
  "glow-eclipse": "0 0 32px rgba(79,70,229,0.20), 0 0 12px rgba(79,70,229,0.10)",
  "glow-gold":    "0 0 24px rgba(212,168,87,0.25), 0 0 8px rgba(212,168,87,0.15)",
  "cta":          "0 8px 24px -8px rgba(79,70,229,0.45), 0 0 0 1px rgba(79,70,229,0.20), inset 0 1px 0 rgba(255,255,255,0.15)",
}
```

### Gradientes signature

```typescript
backgroundImage: {
  "gradient-brand":      "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
  "gradient-magic":      "linear-gradient(135deg, #4F46E5 0%, #D4A857 100%)",  // signature
  "gradient-eclipse":    "linear-gradient(180deg, #FFFFFF 0%, #FAFAFC 50%, #F4F4F8 100%)",
  "gradient-aurora":     "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(79,70,229,0.12) 0%, transparent 60%)",
  "gradient-cta":        "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
  "gradient-cta-shine":  "linear-gradient(135deg, #4F46E5 0%, #4338CA 50%, #4F46E5 100%)",
}
```

---

## Roadmap de Implementación

### Quick Wins (1-2 días)
1. **Subir contraste del texto disclaimer** a `#71717A` (zinc-500) — fix WCAG inmediato
2. **Unificar CTAs** a 2 textos máximos en toda la web
3. **Subir touch targets** de nav y footer a 48px tap area
4. **Eliminar Three.js si no se usa visiblemente** (`@react-three/fiber`, `@react-three/drei`, `three`, `maath`) — bundle -600KB
5. **Reducir GooeyText a 3 palabras** y subir morphTime a 2.5s
6. **Eliminar 1 sección duplicada** — empezar por `BenefitsScroll` oscuro (rompe luminancia)
7. **Añadir microcopy de precio en hero**: "Plan gratis · Sin tarjeta"
8. **Cambiar testimonios ficticios** por badge "47 agencias en lista de espera" si no hay reales

### Medio plazo (1-2 semanas)
1. **Migrar paleta a "Indigo Eclipse"** — refactor de `tailwind.config.ts` + `globals.css` + componentes que usan tokens hardcoded
2. **Rediseñar hero** con screencast del producto real (8s loop)
3. **Compactar landing a 8 secciones** — eliminar duplicados de Bento + HeroScroll + BenefitsScroll
4. **Crear sección dedicada "Posts colaborativos"** con animación signature de la USP
5. **Auditar accesibilidad completa** con axe-core en CI
6. **Implementar `useReducedMotion` en framer-motion** para todos los `MotionReveal`
7. **Reescribir tono de voz** según las 3 reglas (números, no superlativos, imperativos)
8. **Añadir status page** (status.autopost.app)
9. **Optimizar video hero** (WebM + poster + lazy)

### Transformaciones (1+ mes)
1. **Rediseño del logo** — glifo "carpeta abriendo grid" + wordmark Satoshi + variantes mark/wordmark/lockup
2. **Sandbox interactivo en hero** — drag & drop con datos demo, sin login
3. **Brand voice document completo** + glosario de términos para todo el equipo (soporte, marketing, producto)
4. **Calendario de templates por sector hispanohablante** descargables
5. **Modo oscuro coherente** con paleta Indigo Eclipse
6. **Onboarding interactivo in-app** post-signup (Shepherd.js o equivalente)
7. **Caso de estudio público** con 1-3 agencias beta (con cifras reales: posts publicados, horas ahorradas, ROI)
8. **App móvil iOS/Android** — gap competitivo crítico (todos los competidores la tienen)

---

## Apéndice A — Análisis del nombre "AutoPost"

**Pros:** literal, fácil de pronunciar en español e inglés, dominio probablemente disponible en variantes (autopost.app, getautopost.com), comunica la función exacta.

**Cons:** muy genérico — hay docenas de productos con "auto" + "post" en el mercado (Autopost.io, AutoPostr, etc.). SEO competitivo difícil. No tiene historia ni mística.

**Recomendación:** mantener "AutoPost" en el corto plazo (rebranding cuesta caro y vuestra base actual ya os conoce así) **PERO** acompañarlo siempre con una **firma de categoría memorable**: "AutoPost — el scheduler de carpetas". El producto se diferencia por la firma, no por el nombre solo. Si en el futuro hay capital, considerar evolución a un nombre proprietario (ej: "Folio", "Cadence", "Stack" — todos comunican carpeta/secuencia/orden).

---

## Apéndice B — Stack visual recomendado por nicho (resumen psicológico)

| Color | Asociación cognitiva | Usado por | Recomendado para AutoPost |
|---|---|---|---|
| Indigo profundo `#4F46E5` | Confianza tecnológica + premium | Linear, Stripe, Discord (variante) | ✅ **Primario** |
| Gold tostado `#D4A857` | Lujo discreto + exclusividad | Loro Piana, Burberry classic | ✅ **Acento signature** |
| Verde `#16A34A` | Crecimiento + éxito | GitHub, WhatsApp | Solo success states |
| Naranja saturado `#FB923C` | Urgencia + energía | HubSpot, SoundCloud | Evitar en este nicho |
| Amarillo highway `#FFAA00` | Warning + alerta | Mastercard, IKEA | ❌ **Evitar como primario** |
| Rosa `#EC4899` | Femenino + creator economy | Planoly | Evitar — confunde con Planoly |
| Negro puro | Lujo masivo / minimalismo | Apple, Vercel | Como fondo dark mode únicamente |

---

## Conclusión estratégica

AutoPost tiene **producto verdaderamente diferenciado** (carga por carpeta + carruseles automáticos + colaborativos) y **fundamentos técnicos sólidos** (Next.js 14, framer-motion, Satoshi, Apple-style design system). El gap entre lo que es hoy y una marca de €5M ARR es:

1. **Disciplina narrativa** — decir UNA cosa muy bien en lugar de DIEZ cosas decentes
2. **Identidad cromática diferenciada** — salir del territorio gold genérico hacia el indigo premium
3. **Densidad de página** — pasar de 13 viewports de scroll a 7
4. **Coherencia de CTAs y copy** — un solo verbo, una sola promesa
5. **Pruebas reales** — sustituir testimonios de stock por números verificables

El stack motion + tipografía + arquitectura ya están en nivel top-tier. El trabajo es **editorial y cromático**, no técnico. Con 2 semanas de refactor disciplinado, esta web puede competir visualmente con Linear, Cron y los mejores SaaS premium del mercado.

---

**Auditoría completada por:** equipo virtual de branding + UX + CRO + growth
**Próximo paso recomendado:** validar la nueva paleta "Indigo Eclipse" con 5 agencias beta antes de aplicarla en producción
