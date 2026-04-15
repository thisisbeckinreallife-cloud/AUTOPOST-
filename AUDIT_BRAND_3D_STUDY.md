# Auditoría Web & Plan de Transformación 3D Cinemática: AutoPost

**Fecha:** 2026-04-15  
**URL:** autopost (localhost/producción)  
**Nicho:** SaaS de programación masiva de Instagram (agencias + influencers hispanohablantes)  
**Público objetivo:** Community managers, agencias de social media, content creators hispanohablantes  
**Stack:** Next.js 14 + Tailwind CSS + TypeScript (sin librerías 3D actualmente)

---

## Resumen Ejecutivo

AutoPost tiene una landing page con fundamentos sólidos: tema oscuro cinemático, tipografía fluida, copy directo y una propuesta de valor clara ("Un mes de Instagram en 2 minutos"). Sin embargo, el hero actual es **genérico** — orbs difusos con gradientes, animaciones CSS básicas y cero elementos interactivos. No hay nada que ancle visualmente la marca en la memoria del usuario.

**Las 3 acciones de mayor impacto:**

1. **Reemplazar el hero con una escena 3D interactiva** usando React Three Fiber — un smartphone 3D flotante donde se ve el feed de Instagram llenándose de posts en tiempo real mientras la carpeta "cae" sobre él. Esto convierte la propuesta de valor en una experiencia visual que el usuario recuerda.

2. **Implementar scroll-driven storytelling** — en lugar de secciones estáticas, usar el scroll como línea temporal cinemática: la carpeta se abre → los archivos flotan → se organizan en un calendario → se publican. El usuario "vive" el producto antes de registrarse.

3. **Sistema de microinteracciones con feedback físico** — partículas que siguen al cursor, cards con parallax tilt, transiciones con inercia (spring physics). Cada interacción debe sentirse tangible, no decorativa.

**Inversión técnica necesaria:** React Three Fiber (~50KB gzipped) + @react-three/drei + @react-three/postprocessing. Compatible con el stack actual (Next.js 14 + React 18). No requiere cambiar nada del backend.

---

## 1. Auditoría de Marca

### Estado actual

| Aspecto | Evaluación | Nota |
|---------|-----------|------|
| **Logo** | ❌ Débil | Icono genérico (Lucide `Zap`) dentro de un cuadrado con gradiente. No es memorable ni diferenciable. Un rayo podría ser cualquier SaaS. |
| **Tipografía** | ✅ Bien | Inter + Inter Tight + General Sans es una combinación sólida. Jerarquía clara con `clamp()` responsive. |
| **Tono de voz** | ✅ Bien | Copy directo, orientado a dolor/beneficio. "De 3 horas a 2 minutos" es potente. |
| **Consistencia** | ⚠️ Regular | El sistema amber/orange funciona, pero los orbs del hero y las aurora se sienten desconectados de la identidad del producto. |
| **Confianza** | ⚠️ Regular | Hay trust signals (API oficial, cifrado), pero los testimonios parecen placeholder y no hay logos de clientes reales. |

### Recomendaciones

1. **Logo 3D propio**: Crear un isotipo 3D que represente la marca — una carpeta estilizada que se transforma en un calendario de Instagram. Este mismo elemento sería el centro de la escena hero 3D.

2. **Identidad visual anclada al producto**: En lugar de orbs decorativos genéricos, toda la identidad visual debe girar en torno a la metáfora core: `Carpeta → Posts programados`. Los elementos visuales de fondo deben ser representaciones abstractas de este flujo.

3. **Social proof real**: Reemplazar testimonios genéricos por capturas reales (con permiso), métricas verificables, o al menos avatares reales en lugar de iniciales.

---

## 2. Paleta de Colores

### Paleta actual

| Rol | Hex | Evaluación |
|-----|-----|-----------|
| Primario (amber) | `#F59E0B` | ⚠️ Funcional pero demasiado "utility". Amber es color de warning en la mayoría de design systems |
| Acento (orange) | `#FB923C` | ⚠️ Demasiado cercano al primario. Poco contraste entre ambos |
| Background | `#0B1120` | ✅ Excelente navy profundo para tema cinemático |
| Surface card | `#162032` | ✅ Buena elevación sobre el background |
| Text primary | `#F1F5F9` | ✅ Alto contraste, legible |
| Text muted | `#64748B` | ⚠️ Ratio 4.2:1 sobre `#0B1120` — justo al límite WCAG AA |

### Paleta propuesta

La paleta actual amber/orange tiene un problema fundamental: en el espacio dark UI, amber es universalmente asociado con **warnings/caution**. Para un SaaS que quiere transmitir **velocidad, automatización y magia**, necesitamos un cambio sutil pero significativo.

**Propuesta: Amber → Electric Gold + Cyan accent**

| Rol | Hex | Justificación |
|-----|-----|---------------|
| **Primario: Electric Gold** | `#FFB800` | Más saturado y luminoso que el amber actual. Transmite energía y velocidad. Recuerda al "instante" — todo pasa rápido |
| **Secundario: Deep Violet** | `#7C3AED` | Contraste fuerte con gold. Violet = innovación, tecnología, magia. El "auto" en AutoPost es magia |
| **Acento: Cyan Spark** | `#06D6A0` | Verde-cyan que aporta frescura. Diferenciador vs. la competencia que usa blues puros |
| **Success** | `#22C55E` | Verde estándar para confirmaciones |
| **Warning** | `#F59E0B` | El amber actual baja a warning (su rol natural) |
| **Error** | `#EF4444` | Rojo estándar |
| **Info** | `#3B82F6` | Azul estándar |
| **Neutro oscuro** | `#0B1120` | Mantener — funciona perfecto |
| **Neutro claro** | `#F8FAFC` | Para textos principales |
| **Surface card** | `#121A2E` | Ligeramente más azul para mayor profundidad |

**Ejemplo de aplicación en hero:**
- Headline "Instagram" → gradiente Electric Gold → Deep Violet
- CTA principal → fondo Electric Gold con glow Gold
- Elementos 3D → iluminación Gold principal + rim light Cyan
- Partículas → mezcla Gold/Violet/Cyan

> **Nota de implementación**: Si el cambio de paleta completo es demasiado ambicioso, la versión mínima es: mantener amber como primario pero añadir el Violet como secundario para crear dualidad visual (gold = velocidad, violet = automatización mágica).

---

## 3. Microinteracciones y Motion Design

### Sistema de animación actual

El proyecto usa **exclusivamente animaciones CSS** (Tailwind keyframes). Hay 16+ animaciones definidas, pero todas son decorativas (drift, float, glow-pulse). Ninguna comunica funcionalidad ni refuerza la narrativa del producto.

### Sistema de movimiento propuesto: "Flow Physics"

**Filosofía**: Cada animación debe sentirse como un flujo físico — las cosas tienen peso, inercia y responden al usuario. El concepto es "contenido digital que fluye como líquido desde tu carpeta hacia Instagram".

#### Animaciones del Hero 3D

| Elemento | Animación | Duración | Easing | Trigger |
|----------|-----------|----------|--------|---------|
| Smartphone 3D | Float suave con rotación Y | 6s loop | `ease-in-out` | Automático, idle |
| Smartphone 3D | Tilt hacia cursor | 150ms | `spring(1, 80, 10)` | Mouse move |
| Posts del feed | Slide-in desde arriba, staggered | 800ms c/u | `cubic-bezier(0.16, 1, 0.3, 1)` | Scroll into view |
| Carpeta 3D | Apertura + archivos flotando | 1200ms | `spring(1, 60, 12)` | Scroll trigger (30% viewport) |
| Partículas gold | Drift orbital alrededor del phone | 12s loop | `linear` | Automático |
| Glow volumétrico | Pulse de intensidad | 4s | `ease-in-out` | Automático |

#### Microinteracciones UI

| Elemento | Animación | Duración | Easing | Trigger |
|----------|-----------|----------|--------|---------|
| **Botón CTA** | Scale 1→1.04 + glow intensify + gradient shift | 200ms | `ease-out` | Hover |
| **Botón CTA click** | Scale 1→0.97→1 + ripple gold | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Click |
| **Cards** | 3D tilt parallax (max ±5°) + shadow depth | 100ms | `spring` | Mouse move over card |
| **Cards reveal** | Fade-in + slide-up 30px + blur 4px→0 | 600ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Scroll reveal (staggered 80ms) |
| **Step numbers** | Counter 00→01 animado | 400ms | `ease-out` | Scroll into view |
| **Nav links** | Underline slide-in from left | 200ms | `ease-out` | Hover |
| **Pricing cards** | Lift-up 4px + border glow | 250ms | `ease-out` | Hover |
| **Pricing popular** | Subtle float bob | 3s loop | `ease-in-out` | Automático |
| **Testimonial avatars** | Scale 0.9→1 + ring pulse | 500ms | `spring` | Scroll reveal |
| **Stats counter** | Odómetro numérico (roll up) | 1200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Scroll into view |
| **FAQ accordion** | Height auto + rotate chevron | 300ms | `ease-out` | Click |
| **Page transitions** | Crossfade con slight zoom | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Route change |
| **Cursor** | Custom cursor con trail de partículas gold | N/A | `lerp 0.15` | Mouse move (solo desktop) |

#### Scroll-Driven Storytelling Sequence (Hero → Cómo funciona)

```
Scroll 0% - 15%:    Hero 3D visible, smartphone idle flotando
Scroll 15% - 25%:   Carpeta 3D aparece desde abajo, se abre
Scroll 25% - 40%:   Archivos (imágenes) flotan desde la carpeta → entran al smartphone
Scroll 40% - 55%:   Feed de Instagram se llena progresivamente
Scroll 55% - 70%:   Calendario aparece, fechas se iluminan staggered
Scroll 70% - 85%:   Transición → sección "Cómo funciona" con las cards
Scroll 85% - 100%:  Smartphone se aleja, queda como background sutil
```

---

## 4. Análisis UX y Puntos Débiles

### Flujo principal
```
Landing → Hero (entender propuesta) → Scroll (cómo funciona) → Features → Pricing → Signup → Upload ZIP → Review → Schedule → Publicar
```

### Puntos de fricción

| # | Punto | Severidad | Impacto en conversión | Solución |
|---|-------|-----------|----------------------|----------|
| 1 | **Hero no demuestra el producto** — el usuario lee qué hace pero no lo ve | Alta | -30% potencial | Hero 3D interactivo que muestre el flujo visualmente |
| 2 | **No hay demo visible sin registrarse** — `/demo` existe pero no se promueve en hero | Alta | -20% potencial | Añadir video/demo interactiva inline en el hero o justo debajo |
| 3 | **CTA "Subir mi primera carpeta" asume conocimiento** — el usuario no sabe qué carpeta | Media | -10% | Cambiar a "Probar con contenido de ejemplo" como opción secundaria |
| 4 | **Sección before/after es texto puro** — no hay impacto visual | Media | -5% | Animar la comparación: cronómetro acelerando de 3h a 2min |
| 5 | **Pricing sin toggle mensual/anual** | Baja | -3% | Añadir toggle con descuento anual visible |
| 6 | **Footer minimalista** — sin links a recursos, blog, soporte | Baja | -2% | Expandir footer con columnas de links |

### Primera impresión (test de 3 segundos)

**Actual:** ✅ Se entiende qué hace (scheduling de Instagram). ❌ No se siente diferente a Later/Buffer/Hootsuite. ❌ Los orbs animados no comunican nada sobre el producto.

**Con 3D:** ✅ Se entiende qué hace. ✅ La animación del smartphone+carpeta es memorable. ✅ Se diferencia inmediatamente de toda la competencia (ninguno usa 3D).

---

## 5. Análisis de Competencia

### Competidores identificados

| Competidor | Fortalezas | Debilidades | Design |
|-----------|-----------|-------------|--------|
| **Later** | Grid visual preview, UX pulida, marca establecida | Pricing complejo, curva de aprendizaje | Clean, light theme, fotos grandes. Sin WOW factor visual |
| **Buffer** | Simpleza extrema, free tier generoso | Funcionalidad limitada, diseño aburrido | Minimalista funcional. Cero personalidad |
| **Hootsuite** | Enterprise features, multi-red | Caro, complejo, legacy UX | Corporate, dark theme genérico |
| **SocialBee** | AI copywriting, categorías de contenido | UI cluttered, demasiadas opciones | Intenta ser moderno pero es confuso |
| **Pallyy** | Todo-en-uno, pricing simple | Menos conocido, diseño genérico | Clean pero forgettable |

### Oportunidades de diferenciación

**Ningún competidor tiene:**
- ❌ Experiencia 3D o WebGL en su landing
- ❌ Scroll-driven storytelling
- ❌ Demo interactiva sin registro
- ❌ Upload de carpeta/ZIP como flujo principal (todos son post-by-post)
- ❌ Foco exclusivo en mercado hispanohablante

**AutoPost puede ser el primero en:**
1. **3D immersive landing** — memorable, shareable, diferenciador absoluto
2. **"Try before signup"** — demo con carpeta de ejemplo que el usuario puede tocar
3. **Narrativa visual** — mostrar el flujo completo (carpeta→posts) como experiencia cinematográfica

---

## 6. Optimización de Conversión (CRO)

### Análisis above the fold

**Actual:** Badge + Headline + Subtitle + 2 CTAs + Trust bar. Es correcto pero estándar.

**Problema:** El 100% de la persuasión recae en el copy. No hay elemento visual que demuestre el producto. Los orbs decorativos consumen espacio visual sin aportar conversión.

**Propuesto:** Dividir el hero en dos mitades (desktop):
- **Izquierda (55%):** Copy + CTAs (mantener lo actual, funciona)
- **Derecha (45%):** Escena 3D interactiva del smartphone con el feed llenándose

### CTAs

| CTA actual | Problema | CTA propuesto |
|-----------|----------|---------------|
| "Subir mi primera carpeta — Gratis" | Asume que el usuario ya tiene contenido listo | "Ver cómo funciona en 30 segundos" (con demo inline) |
| "Ver cómo funciona" | Genérico, scroll anchor | "Probar con contenido de ejemplo" (demo interactiva) |
| "Empezar gratis" (navbar) | ✅ Bien | Mantener |
| "Empezar gratis" (CTA final) | ✅ Bien pero sin urgencia | "Empezar gratis — primera carpeta incluida" |

### Quick wins de conversión

1. **Añadir video/gif del producto en acción** en el hero (antes de implementar 3D)
2. **Social proof numérico** visible en el hero: "327 agencias ya programan con AutoPost"
3. **Indicador de ahorro** dinámico: "Hoy los usuarios de AutoPost han ahorrado 1,247 horas"
4. **Sticky CTA** en scroll mobile: botón flotante que aparece al pasar el hero
5. **Exit intent popup** con oferta: "¿Ya te vas? Prueba gratis con nuestra carpeta de ejemplo"

---

## 7. Copywriting UX

### Antes / Después

| Ubicación | Texto actual | Texto propuesto | Por qué |
|-----------|-------------|-----------------|---------|
| Badge hero | "Despliegue masivo de Instagram" | "Automatización de Instagram para agencias" | "Despliegue masivo" suena militar/técnico, no beneficio |
| Subtitle | "Sube una carpeta con todo tu contenido" | "Arrastra tu carpeta. AutoPost hace el resto" | Más directo, implica facilidad extrema |
| Speed proof | "De 3 horas por cliente a 2 minutos" | "90x más rápido que hacerlo a mano" | El multiplicador es más impactante que horas→minutos |
| CTA primario | "Subir mi primera carpeta — Gratis" | "Programar mi primer mes — Gratis" | El beneficio es "un mes programado", no "subir una carpeta" |
| Before header | "Con herramientas tradicionales" | "Cómo lo haces hoy" | Más personal, involucra al lector |
| After header | "Con AutoPost" | "Cómo será con AutoPost" | Proyección al futuro, aspiration |
| Features title | "Todo lo que necesitas. Nada que no." | "Diseñado para hacer mucho en poco tiempo" | El original es genérico, el nuevo conecta con la propuesta core |
| CTA final | "Deja de publicar a mano" | "Tu próximo mes de contenido, listo en 2 minutos" | Beneficio concreto > imperativo negativo |

---

## 8. Accesibilidad

| Criterio | Estado | Problema | Solución |
|----------|--------|----------|----------|
| Contraste texto muted | ⚠️ Límite | `#64748B` sobre `#0B1120` = 4.2:1 (AA mínimo es 4.5:1) | Subir a `#7C8DB5` (4.8:1) |
| Contraste text-zinc-500 | ❌ Fallo | `#71717A` sobre `#0B1120` = 3.8:1 | Subir a `#8B8B93` (4.5:1) o usar solo para texto decorativo large |
| Contraste text-zinc-600 | ❌ Fallo | `#52525B` sobre `#0B1120` = 2.6:1 | Elevar a `#717180` mínimo o eliminar para texto readable |
| Touch targets | ✅ OK | Botones principales son 48px+ | Mantener |
| Alt text | ❌ Fallo | No hay imágenes, pero los iconos decorativos no tienen aria-hidden | Añadir `aria-hidden="true"` a iconos decorativos |
| Keyboard nav | ⚠️ Parcial | Los anchor links funcionan, pero no hay focus styles visibles | Añadir `focus-visible:ring-2 ring-brand-400` global |
| Heading structure | ✅ OK | H1→H2 secuencial, correcto | Mantener |
| Motion | ⚠️ Falta | No hay `prefers-reduced-motion` para las animaciones | **Crítico para 3D:** respetar `prefers-reduced-motion: reduce` desactivando 3D y usando fallback estático |
| ARIA landmarks | ⚠️ Parcial | `<nav>` existe pero `<main>`, `<section>` no tienen aria-labels | Añadir roles y labels a secciones principales |

### Nota importante para la implementación 3D

Toda escena 3D **debe** tener:
- Fallback estático (imagen o CSS) para `prefers-reduced-motion: reduce`
- Fallback para dispositivos sin WebGL (mobile antiguo)
- `aria-hidden="true"` en el canvas 3D (es decorativo)
- No depender del 3D para comunicar información esencial

---

## 9. Performance Percibida

| Área | Estado actual | Mejora propuesta | Impacto |
|------|-------------|-----------------|---------|
| **Imágenes** | No hay imágenes en landing (solo iconos) | Al añadir 3D: preload del modelo GLB, mostrar placeholder gold shimmer mientras carga | Evitar layout shift |
| **Fonts** | 3 familias de Google Fonts + Fontshare | Añadir `font-display: swap` + preload de Inter (400,600,700) | Eliminar FOIT, -200ms percibido |
| **3D loading** | N/A (no existe aún) | Progressive loading: 1) Background gradient estático → 2) Texto hero → 3) Modelo 3D fade-in → 4) Animaciones arrancan | El usuario ve contenido en <1s, 3D es bonus |
| **Lazy loading** | No implementado | Lazy load de secciones below fold con `IntersectionObserver` | Reducir bundle inicial ~30% |
| **Three.js bundle** | N/A | Dynamic import: `next/dynamic` con `ssr: false` para la escena 3D | Zero impact en SSR, solo carga en client |
| **GLTF models** | N/A | Comprimir con Draco/meshopt, target <500KB total | Carga en <2s en 3G |
| **Skeleton screens** | Solo en upload wizard | Añadir skeleton para stats, testimonials, pricing al hacer scroll-reveal | Sensación de velocidad |

### Estrategia de carga 3D (critical path)

```
T+0ms:    HTML + CSS crítico (hero background color + texto)
T+100ms:  Fonts empiezan a cargar (font-display: swap)
T+200ms:  Hero text visible con fallback font
T+300ms:  Fonts cargadas, text re-render
T+500ms:  Three.js bundle cargado (dynamic import)
T+800ms:  Modelo GLTF descargado y parseado
T+1000ms: Escena 3D fade-in (opacity 0→1, 800ms)
T+1200ms: Animaciones del modelo arrancan
```

El usuario nunca espera. Siempre hay algo visible.

---

## 10. Funcionalidades y Experiencias Interactivas

### Propuesta: El Hero 3D Inmersivo

**Concepto: "The Folder Drop"**

Una escena 3D que cuenta la historia del producto visualmente:

```
┌─────────────────────────────────────────────┐
│                                             │
│   Un mes de        ┌──────────────┐         │
│   Instagram        │  📱 iPhone   │         │
│   en 2 minutos     │  ┌────────┐  │         │
│                    │  │IG Feed │  │         │
│   [CTA Button]     │  │ ████   │  │         │
│                    │  │ ████   │  │         │
│   📁 ← carpeta    │  │ ████   │  │         │
│   flotando         │  └────────┘  │         │
│                    └──────────────┘         │
│          ✨ partículas gold ✨              │
└─────────────────────────────────────────────┘
```

**Elementos 3D:**

1. **iPhone/Smartphone 3D** (centro-derecha)
   - Modelo GLTF low-poly estilizado (no fotorrealista — brand-consistent)
   - Pantalla con textura dinámica que muestra un feed de Instagram
   - Float idle: rotación Y suave (-5° a 5°), bob vertical (±3px)
   - Reacciona al cursor: tilt sutil (parallax)
   - Material: glass/metal con rim light gold

2. **Carpeta 3D** (izquierda-abajo)
   - Carpeta estilizada que se abre al hacer scroll
   - Al abrirse, salen "archivos" (rectángulos con thumbnails)
   - Los archivos flotan en arco hacia el smartphone
   - Material: semi-translúcido con borde gold

3. **Partículas ambientales**
   - 200-300 partículas gold/cyan muy pequeñas
   - Movimiento orbital lento alrededor del smartphone
   - Reaccionan al cursor (repulsión suave)
   - Efecto: hacen que la escena se sienta "viva"

4. **Iluminación**
   - Key light: Gold cálido desde arriba-izquierda
   - Rim light: Cyan/violet desde atrás-derecha
   - Ambient: Muy baja, navy
   - Point light animado: pulsa sutilmente con el glow del brand

5. **Post-processing**
   - Bloom suave en los highlights gold
   - Vignette sutil (complementa el CSS existente)
   - Chromatic aberration mínima (1-2px) para efecto cinematográfico
   - Noise/grain para consistencia con el estilo actual

### Implementación técnica recomendada

```
Dependencias nuevas:
├── @react-three/fiber    (React Three Fiber - core)
├── @react-three/drei     (helpers: Environment, Float, Text3D, etc.)
├── @react-three/postprocessing (bloom, vignette, chromatic aberration)
├── three                 (Three.js core)
├── @types/three          (TypeScript types)
├── leva                  (debug panel, solo dev)
└── maath                 (math utilities para easing)

Estructura de archivos propuesta:
src/
├── components/
│   ├── hero-3d/
│   │   ├── HeroScene.tsx        ← Canvas + Suspense + fallback
│   │   ├── PhoneModel.tsx       ← Smartphone 3D component
│   │   ├── FolderModel.tsx      ← Carpeta 3D component
│   │   ├── FloatingFiles.tsx    ← Archivos animados
│   │   ├── Particles.tsx        ← Sistema de partículas gold
│   │   ├── Lighting.tsx         ← Setup de luces
│   │   ├── Effects.tsx          ← Post-processing
│   │   └── scroll-rig.tsx       ← Scroll-driven animation controller
│   └── ...
├── models/
│   ├── phone.glb               ← Modelo smartphone (~200KB Draco)
│   └── folder.glb              ← Modelo carpeta (~50KB Draco)
└── ...
```

### Experiencias adicionales por sección

| Sección | Experiencia interactiva | Prioridad | Esfuerzo |
|---------|------------------------|-----------|----------|
| **Hero** | Escena 3D "The Folder Drop" completa | 🔴 Alta | 2-3 semanas |
| **Cómo funciona** | Cards con 3D tilt parallax + iconos que "flotan" | 🟡 Media | 3-4 días |
| **Before/After** | Cronómetro animado: 3h acelerando a 2min con partículas | 🟡 Media | 2-3 días |
| **Features** | Hover sobre cada feature revela mini-animación SVG del concepto | 🟢 Quick win | 1-2 días |
| **ROI Calculator** | Slider con feedback háptico visual + número animated (odómetro) | 🟢 Quick win | 1 día |
| **Testimonials** | Carousel con depth-of-field effect (card activa nítida, laterales blur) | 🟡 Media | 3-4 días |
| **Pricing** | Card popular con glow animado + float. Hover levanta la card en 3D | 🟢 Quick win | 1 día |
| **CTA final** | Background con partículas gold que convergen hacia el botón | 🟡 Media | 2 días |
| **Cursor personalizado** | Cursor con trail de partículas gold (solo desktop) | 🟢 Quick win | 1 día |
| **Page load** | Logo animación: rayo se dibuja → "AutoPost" aparece letra por letra | 🟢 Quick win | 1 día |

### Otras funcionalidades propuestas

| Funcionalidad | Descripción | Prioridad | Justificación |
|--------------|-------------|-----------|---------------|
| **Demo interactiva sin registro** | Carpeta de ejemplo que el usuario puede "subir" en el hero para ver el flujo | Alta | Reduce fricción de signup enormemente |
| **Modo oscuro/claro toggle** | Ya es dark, pero toggle visible muestra polish | Baja | El público actual (agencias tech) aprecia esto |
| **Chatbot contextual** | Widget de ayuda con FAQ rápidas sobre el producto | Media | Reduce bounce de usuarios con dudas |
| **Estimador de ahorro personalizado** | "¿Cuántos clientes gestionas?" → calcula ahorro mensual | Media | Ya existe ROI Calculator, evolucionar a algo más personal |
| **Easter egg 3D** | Konami code o clic en el logo → la escena 3D hace algo especial (fuegos artificiales de partículas) | Baja | Shareability, "oye mira qué hace esta web" |

---

## Roadmap de Implementación

### Fase 0: Quick Wins (1-3 días) — Sin 3D, mejoras inmediatas

1. **Mejorar contraste de texto** (zinc-500, zinc-600) — 30 min
2. **Añadir `prefers-reduced-motion`** para todas las animaciones CSS existentes — 1h
3. **Focus styles** visibles para navegación por teclado — 30 min
4. **Copy updates** del hero (badge, subtitle, CTA) según tabla de copywriting — 1h
5. **Sticky CTA mobile** que aparece al pasar el hero — 2h
6. **Animación de números en StatsStrip** con odómetro roll-up — 3h
7. **Cards con 3D tilt** CSS (transform: perspective + rotateX/Y) — 3h

### Fase 1: Fundación 3D (1 semana) — El Hero

1. Instalar React Three Fiber + drei + postprocessing
2. Crear `<HeroScene>` con Canvas + Suspense + fallback estático
3. Modelar/conseguir smartphone 3D low-poly (o usar primitives)
4. Implementar float idle + cursor parallax del smartphone
5. Añadir partículas gold con shader básico
6. Post-processing: bloom + vignette
7. Dynamic import con `next/dynamic({ ssr: false })`
8. Progressive loading: shimmer → 3D fade-in
9. `prefers-reduced-motion` fallback

### Fase 2: Scroll Storytelling (1-2 semanas) — La Experiencia

1. Implementar scroll-rig con useScroll de drei
2. Crear modelo de carpeta 3D
3. Animar apertura de carpeta en scroll
4. Archivos flotando: instanced meshes con trayectorias bezier
5. Feed del smartphone se llena progresivamente
6. Transición orgánica hero → "Cómo funciona"
7. Testing en dispositivos móviles (desactivar 3D en <768px o simplificar)

### Fase 3: Microinteracciones UI (1 semana) — El Polish

1. 3D tilt parallax en todas las cards (CSS transform, no Three.js)
2. Hover states mejorados en botones (ripple, scale, glow)
3. Scroll-reveal con blur-to-clear para secciones
4. Animación del cronómetro en before/after
5. Cursor personalizado con trail (solo desktop)
6. Logo animation en page load

### Fase 4: Experiencias Avanzadas (2+ semanas) — El WOW

1. Demo interactiva sin registro (mini upload experience)
2. Partículas que convergen al CTA final
3. Easter egg 3D
4. Transiciones de página con Three.js (si hay múltiples páginas públicas)
5. Optimización de performance: LOD, texture compression, instancing

---

## Especificaciones técnicas 3D detalladas

### Performance Targets

| Métrica | Target | Fallback |
|---------|--------|----------|
| FPS | 60fps en desktop, 30fps en mobile | Desactivar post-processing en <30fps |
| Bundle size (3D) | <80KB gzipped (Three.js tree-shaken) | Lazy load, solo en landing |
| Modelo GLTF total | <500KB (Draco compressed) | Placeholder primitives si falla la carga |
| Time to interactive | <3s en 4G | Texto visible en <1s, 3D es progressive enhancement |
| GPU memory | <100MB VRAM | Reducir resolución de post-processing en low-end |
| Mobile | Escena simplificada (sin post-processing, menos partículas) | Solo CSS fallback en <768px si es necesario |

### Device Detection Strategy

```typescript
// Simplified device capability detection
const useDeviceCapability = () => {
  // Tier 1: Full 3D + post-processing + particles (desktop, good GPU)
  // Tier 2: 3D without post-processing (mobile high-end, old desktop)  
  // Tier 3: CSS-only animations (low-end mobile, no WebGL)
  // Tier 4: Static (prefers-reduced-motion)
}
```

### Palette de materiales 3D

| Material | Aplicación | Propiedades |
|----------|-----------|-------------|
| **Phone body** | Carcasa smartphone | MeshPhysicalMaterial: metalness 0.9, roughness 0.15, color #1A1A2E, envMapIntensity 1.5 |
| **Phone screen** | Pantalla activa | MeshBasicMaterial con texture dinámica (CanvasTexture del feed) |
| **Folder** | Carpeta del usuario | MeshPhysicalMaterial: metalness 0.1, roughness 0.4, color #FFB800 (gold), transmission 0.3 |
| **Files** | Archivos que flotan | MeshStandardMaterial: con thumbnails como texture, emissive brand-400 sutil |
| **Particles** | Partículas ambientales | PointsMaterial: custom shader con size attenuation, color mix gold/cyan |

---

## Conclusión

AutoPost tiene una base técnica sólida y un copy que funciona. Lo que le falta es **impacto visual memorable**. En un mercado donde Later, Buffer y Hootsuite tienen landings genéricas y funcionales, AutoPost tiene la oportunidad de ser **la primera herramienta de Instagram scheduling con una experiencia web de nivel Awwwards**.

La implementación 3D no es un capricho estético — es un **diferenciador estratégico**:
- **Memorabilidad**: El usuario recuerda "la web donde el teléfono se llenaba de posts" mucho más que "la web con texto blanco sobre fondo oscuro"
- **Shareability**: Una experiencia 3D inmersiva genera menciones orgánicas en redes
- **Trust signal implícito**: "Si su web es así de pulida, su producto debe ser bueno"
- **Storytelling del producto**: Mostrar el flujo carpeta→posts visualmente cierra la venta mejor que cualquier bullet point

**El riesgo principal** es el performance en mobile. La estrategia de progressive enhancement (3D es bonus, no requisito) y device tiering mitigan este riesgo completamente.
