# AUDIT.md — Auditoría frontend Autopost

> Auditoría brutal y orientada a venta. Mayo 2026. Repo: Next.js 14 + Tailwind + Prisma + Stripe (pendiente). Veredicto en cada hallazgo: **archivo:línea → problema → impacto → severidad**.

**TL;DR**: el copy del hero (`Tira la carpeta. El resto va solo.`) es lo único que claramente vende. Por debajo hay 4 sistemas de diseño coexistiendo, stats fabricadas, cero integración de pagos, onboarding sin contrato visual, y 7 rutas de "preview" que el usuario nunca debería ver. Tres bloques de cambios, ~21–31h, y queda vendible.

---

## 1. Inventario factual del repo

### Stack (de [package.json](package.json))
- **Framework**: Next.js 14.2.35 (App Router), React 18, TypeScript 5
- **Estilo**: Tailwind 3.3, postcss, autoprefixer, `class-variance-authority`, `tailwind-merge`, `clsx`
- **Datos**: Prisma 5.11 + Postgres
- **Cola**: BullMQ 5.7 + Redis (`ioredis` 5.3)
- **Auth**: `iron-session` 8 + bcryptjs
- **Storage**: `@aws-sdk/client-s3` (S3 / MinIO)
- **3D**: `@react-three/fiber` 8.15 + `@react-three/drei` 9.99 + `three` 0.162 + `maath`
- **Motion**: `framer-motion` 12.38
- **i18n**: `next-intl` 4.11 (ES + EN)
- **IA**: `@anthropic-ai/sdk` 0.91 + `openai` 6.35 + `together-ai` 0.39
- **Iconos**: `lucide-react` 0.372
- **Pagos**: ❌ (sin Stripe / Lemon / Paddle / Polar)

### Rutas App Router (34 totales)

**Marketing / preview (8)**
| Ruta | Archivo | Render |
|---|---|---|
| `/` | [src/app/page.tsx](src/app/page.tsx) | landing-v2 (productivo) |
| `/demo` | [src/app/demo/page.tsx](src/app/demo/page.tsx) | demo interactivo |
| `/hero-preview` | [src/app/hero-preview/page.tsx](src/app/hero-preview/page.tsx) | lab hero 3D |
| `/hero-preview/static` | [src/app/hero-preview/static/page.tsx](src/app/hero-preview/static/page.tsx) | hero estático |
| `/palette-preview` | [src/app/palette-preview/page.tsx](src/app/palette-preview/page.tsx) | visor paleta |
| `/brand-lab` | [src/app/brand-lab/page.tsx](src/app/brand-lab/page.tsx) | validación marca |
| `/editorial` | [src/app/editorial/page.tsx](src/app/editorial/page.tsx) | print-zine |
| `/comparar/[competidor]` | [src/app/comparar/[competidor]/page.tsx](src/app/comparar/[competidor]/page.tsx) | comparador dinámico |

**Producto (17)** · `(admin)` route group + `/onboarding/1..5`

**Auth (4)** · `(auth)` group: login, signup, forgot-password, reset-password

**Legal (3)** · privacy, terms, cookies

**Especiales (2)** · `/aprobar/[token]`, `/informe/[token]`

### Componentes (~113 TSX)

| Carpeta | N | Notas |
|---|---|---|
| `ui/` | 11 | primitives + animations |
| `landing/` | 16 | **legacy v1** (hatch-hero 300vh) |
| `landing-v2/` | 8 | **productivo** (hero, pricing, faq, footer…) |
| `motion/` | 16 | mayoría sin usar |
| `editorial/` | 6 | print-zine, no productivo |
| `brand/` | 10 | system showcase |
| `hero-3d/` | 6 | Three.js no integrado |
| `onboarding/` | 3 | wizard 5 pasos |
| `upload/` | 8 | drag-drop |
| `admin/` | 13 | dashboard |
| `auth/` | 5 | forms |

### Artefactos sueltos (eliminar)
- [dashboard-aluminum-breakdown.html](dashboard-aluminum-breakdown.html) — 84KB
- [ola3-aluminum-breakdown.html](ola3-aluminum-breakdown.html) — 75KB
- [AUDITORIA_BRAND_2026.md](AUDITORIA_BRAND_2026.md) — 41KB (decisiones contradictorias con las otras 2)
- [AUDITORIA_WEB_BRAND.md](AUDITORIA_WEB_BRAND.md) — 28KB
- [AUDIT_BRAND_3D_STUDY.md](AUDIT_BRAND_3D_STUDY.md) — 29KB
- [branding-redesign/](branding-redesign/) — propuesta HTML standalone, no integrada

### Sistema de diseño (definido en [tailwind.config.ts](tailwind.config.ts))

**Cuatro paletas coexistiendo**:

1. **Editorial** (líneas 75-130): `brand-50..950`, `accent-{orange,indigo,coral}`, `surface-{primary,secondary,card}`. Off-bone paper `#F1ECE2` + tomato `#E54B26`. Print-zine.
2. **Rebrand Phase 1** (líneas 45-75 + globals.css): `ink-0..10`, `pri` (`#4F7CFF`), `ai` (`#A855F7`), `np-*`. Dark-first.
3. **Aluminum Studio** (líneas 121-160): `success-*`, `warning-*`, `error-*`, `info-*` con escala 50-900. Sin uso real en componentes.
4. **Hatch Apple** (líneas 105-114): `hatch-{graphite,athens,cobalt,silver,glow}`. Sin uso.

**Tipografía** declarada (líneas 12-21):
- `font-sans`: Inter
- `font-display` / `font-headline`: Instrument Serif
- `font-mono`: JetBrains Mono
- `font-np-sans`: Geist + Inter fallback
- `font-np-mono`: Geist Mono

**Real**: ~70% de archivos no especifica fuente → cae a Inter por defecto. Cero `@font-face` en globals.css. Geist está declarada pero infrautilizada.

**Animaciones** (18 definidas, ~5 usadas): `fade-in`, `fade-up`, `slide-up`, `scale-in`, `marquee` se usan. `glow-pulse`, `shimmer`, `border-flow`, `cta-pulse`, `mockup-blink`, `rotate-border` son decorativas y no aportan.

---

## 2. Diagnóstico "olor a IA" (categoría A-G con archivo:línea)

### A · Gradientes y efectos genéricos

| Hallazgo | Archivo:línea | Severidad |
|---|---|---|
| Gradient 3-color en h1 hero (`var(--ink-9) → var(--pri) → var(--ai)`) | [src/components/landing-v2/Hero.tsx:96](src/components/landing-v2/Hero.tsx) | **BAJO** (intencional, diferenciador) |
| Stats con gradient violet/cyan decorativo | [src/components/landing/stats-strip.tsx:8-9](src/components/landing/stats-strip.tsx) | **MEDIO** (legacy v1, desaparece con cleanup) |
| Backdrop-blur en badge hero | [src/components/landing-v2/Hero.tsx:68](src/components/landing-v2/Hero.tsx) | **BAJO** (funcional para legibilidad) |
| Gradient radial blur 140px en hero (pri+ai blobs) | [src/components/landing-v2/Hero.tsx:29-47](src/components/landing-v2/Hero.tsx) | **BAJO** (sutil 0.18 / 0.12 opacidad) |
| Grid glow 64px con mask radial | [src/components/landing-v2/Hero.tsx:51-61](src/components/landing-v2/Hero.tsx) | **BAJO** (decorativo, evaluar mantener) |
| Pricing tier featured con `from-pri-soft to-transparent` | [src/components/landing-v2/Pricing.tsx:106](src/components/landing-v2/Pricing.tsx) | **BAJO** (función: diferenciar plan) |

### B · Copy genérico SaaS-IA

Búsquedas negativas confirmadas:
- ❌ Sin "Transform your", "Powered by AI", "10x faster", "Supercharge", "Unleash"
- ❌ Sin "Empieza ahora" vacío
- ✅ Copy específico: "Tira la carpeta. El resto va solo." es marca propia

**Excepciones**:
- "Programación de redes con IA" en hero badge — aceptable (descriptivo, no slogan vacío)

### C · Patrones de layout repetitivos

| Hallazgo | Archivo:línea | Severidad |
|---|---|---|
| Grid 3-col con step cards idénticas | [src/components/landing-v2/HowItWorks.tsx:30-53](src/components/landing-v2/HowItWorks.tsx) | **MEDIO** (estructura SaaS estándar pero contenido específico) |
| Grid 2x2 InsideTour con tour cards uniformes | [src/components/landing-v2/InsideTour.tsx:30-65](src/components/landing-v2/InsideTour.tsx) | **MEDIO** (estructura repetitiva) |
| **Grid 6 feature-cards con icon + título + 1 línea** | [src/components/ui/hero-scroll-animation.tsx:138-162](src/components/ui/hero-scroll-animation.tsx) | **ALTO** (patrón SaaS clónico) |

### D · Iconografía decorativa

| Hallazgo | Archivo:línea | Severidad |
|---|---|---|
| Emojis 📁 ✦ 📅 como iconos de pasos | [src/components/landing-v2/HowItWorks.tsx:36,43,51](src/components/landing-v2/HowItWorks.tsx) | **BAJO** (acompañan texto, no decoración pura) |
| 6 lucide icons en feature grid sin función | [src/components/ui/hero-scroll-animation.tsx:69-103](src/components/ui/hero-scroll-animation.tsx) | **MEDIO-ALTO** (decoración pura) |
| 28 SVG inline en showcase | [src/components/brand/BrandSystemGuide.tsx](src/components/brand/BrandSystemGuide.tsx) | **BAJO** (es página de showcase, esperado) |

### E · Tipografía plana y default

| Hallazgo | Archivo:línea | Severidad |
|---|---|---|
| Inter por defecto en ~70% de componentes | (transversal) | **CRÍTICO** (sin personalidad, sin oficio) |
| Geist declarada pero solo en np-* (login, signup, dashboard, landing-v2) | [tailwind.config.ts:19-20](tailwind.config.ts) | **ALTO** (transición incompleta) |
| Sin `@font-face` real ni `next/font` | [src/app/globals.css](src/app/globals.css) | **ALTO** (rendimiento + FOUC) |

### F · Badges, estrellas, pseudo-credibilidad

| Hallazgo | Archivo:línea | Severidad |
|---|---|---|
| **Stats infladas: "12.4M+ posts", "47 redes", "8.7s"** | [src/components/landing-v2/Hero.tsx:155-159](src/components/landing-v2/Hero.tsx) | **CRÍTICO** |
| **Fake uptime "99.98%" con `animate-pulse` verde** | [src/components/landing-v2/Footer.tsx:45](src/components/landing-v2/Footer.tsx) | **CRÍTICO** |
| **Indicador "live" falso sobre "Esta semana"** | [src/components/landing-v2/HowItWorks.tsx:173](src/components/landing-v2/HowItWorks.tsx) | **ALTO** |
| Badge "Programación de redes con IA" + ✦ | [src/components/landing-v2/Hero.tsx:64-77](src/components/landing-v2/Hero.tsx) | **BAJO** (descriptivo real) |
| Badge "Recomendado" en tier Pro | [src/components/landing-v2/Pricing.tsx:111-113](src/components/landing-v2/Pricing.tsx) | **BAJO** (estándar UX) |
| ❌ Sin testimonios/logos/estrellas falsos | — | **OK** |

### G · Animaciones decorativas excesivas

| Hallazgo | Archivo:línea | Severidad |
|---|---|---|
| **Pinned scroll 300vh (legacy v1)** | [src/components/landing/hatch-hero.tsx](src/components/landing/hatch-hero.tsx) | **ALTO** (desaparece con cleanup) |
| Meteors decorativos con triple box-shadow | [src/components/motion/Meteors.tsx](src/components/motion/Meteors.tsx) | **MEDIO** (sin función UX) |
| BorderBeam rotante alrededor de cards | [src/components/motion/BorderBeam.tsx](src/components/motion/BorderBeam.tsx) | **BAJO** (uso limitado) |
| 18 animaciones Tailwind, ~5 usadas | [tailwind.config.ts:193-213](tailwind.config.ts) | **MEDIO** (recortar a 4-5) |

### Top 10 archivos con más olor a IA

1. [src/components/landing-v2/Hero.tsx](src/components/landing-v2/Hero.tsx) — stats falsas + gradient hero
2. [src/components/landing-v2/Footer.tsx](src/components/landing-v2/Footer.tsx) — uptime + pseudo-live
3. [src/components/ui/hero-scroll-animation.tsx](src/components/ui/hero-scroll-animation.tsx) — icon grid SaaS clónico
4. [src/components/landing/hatch-hero.tsx](src/components/landing/hatch-hero.tsx) — 300vh cinemático legacy
5. [src/components/landing-v2/HowItWorks.tsx](src/components/landing-v2/HowItWorks.tsx) — fake live indicator
6. [src/components/landing-v2/InsideTour.tsx](src/components/landing-v2/InsideTour.tsx) — grid 2x2 idéntico
7. [src/components/landing/stats-strip.tsx](src/components/landing/stats-strip.tsx) — gradients decorativos
8. [src/components/motion/Meteors.tsx](src/components/motion/Meteors.tsx) — efecto sin función
9. [src/components/landing-v2/Pricing.tsx](src/components/landing-v2/Pricing.tsx) — jerga "API + webhooks", "SSO + auditoría"
10. [src/components/landing/hatch-how-it-works.tsx](src/components/landing/hatch-how-it-works.tsx) — magazine layout legacy

### Lo que está bien (conservar)

1. **Copy del hero** ("Tira la carpeta. El resto va solo." + sub) — diferenciador, no genérico.
2. **Mensajes de error en auth** — humanizados en español ("Email o contraseña incorrectos", "Demasiados intentos…").
3. **Onboarding 5 pasos progresivo** — estructura correcta, copy claro ("Cualquier cosa vale").

---

## 3. Auditoría de claridad para no técnicos

### ¿Qué hace la herramienta queda claro en 5 segundos?

✅ **Sí.** Hero textualmente:
- Badge: *"Programación de redes con IA"*
- H1: *"Tira la carpeta. El resto va solo."*
- Sub: *"Sube una carpeta de posts. La IA detecta formato, sugiere hora y te monta el calendario. Tú apruebas."*
- CTA primario: *"Comenzar gratis →"*

Cualquier persona no técnica entiende: subo carpeta → IA organiza → se publica.

### Jerga técnica innecesaria — listado completo

| Término | Ubicación | Visible al usuario | Acción |
|---|---|---|---|
| `API + webhooks` | [Pricing.tsx:37](src/components/landing-v2/Pricing.tsx) (tier Studio) | ✅ Público | Reescribir: "Conexión con Zapier / Make" |
| `SSO + auditoría` | [Pricing.tsx:37](src/components/landing-v2/Pricing.tsx) | ✅ Público | "Inicio con Google + Historial de cambios" |
| `OAuth` | [Faq.tsx:11](src/components/landing-v2/Faq.tsx) | ✅ Público | "Como cuando entras con Google" |
| `ZIP` | [src/app/demo/page.tsx:108](src/app/demo/page.tsx) | ✅ Público | "Carpeta" (o /demo se mueve a /lab) |
| `meta.json` | [src/app/legal/privacy/page.tsx:59](src/app/legal/privacy/page.tsx) | ✅ Público | Reformular en términos no técnicos |
| `batch` / `batches` | rutas `(admin)` | ⚠️ Solo logueados | Aceptable (post-auth) |
| `publishJobs` | dashboard interno | ⚠️ Solo logueados | Aceptable |
| `kitchen-ticket queue` | [editorial/page.tsx:30](src/app/editorial/page.tsx) | ⚠️ Si /editorial es público | Se mueve a /lab |

### Flujo de compra: paso a paso

```
1. Landing /                     → ver pricing y "Comenzar gratis"
2. Click "Empezar"               → /signup (gratis)
3. Crear cuenta email + password → /onboarding/1
4. Wizard 5 pasos                → /dashboard
5. ❌ NO hay paso de pago        → ❌ NO hay billing
```

**Veredicto**: ❌ **Sin flujo de compra real**. Pricing visible (€19/49/149) pero todos los CTAs llevan al signup gratuito. Inconsistencia: copy dice "gratis" pero precios no son gratis. Ningún integrador de pagos en `package.json`.

### ¿Hay onboarding real?

✅ **Sí, wizard de 5 pasos** ([src/app/onboarding/1..5/page.tsx](src/app/onboarding/)):

1. **Paso 1**: Cuéntanos de ti (nombre, marca, sector). Skip disponible.
2. **Paso 2**: Conecta primera red social. Carousel Instagram/Facebook/TikTok/LinkedIn. "Recomendado" en Instagram.
3. **Paso 3**: Sube tu primera carpeta. Drop zone + processing animation con 5 pasos.
4. **Paso 4-5**: (no leídos en detalle, inferible: revisión + confirmación)

**❌ Problema crítico — Paso 3 NO explica qué debe contener la carpeta**:
- Acepta `image/*,video/*,.zip,.txt,.pdf` ([page.tsx:103](src/app/onboarding/3/page.tsx))
- Copy: *"Cualquier cosa vale: vídeos, imágenes, textos"*
- README real exige `/YYYY-MM/YYYY-MM-DD_post-name/caption.txt + meta.json + media-*` — el usuario NO lo sabe
- Riesgo: usuario sube carpeta desorganizada → IA falla → error técnico → abandono

### ¿Errores son humanos?

✅ **Sí, todos los de auth**:
- "Introduce un email válido"
- "La contraseña necesita al menos 8 caracteres"
- "Demasiados intentos. Espera unos minutos antes de probar otra vez."
- "Sin conexión. Revisa internet y vuelve a probar."
- "Email o contraseña incorrectos."
- "Este enlace ya no vale o expiró. Pide uno nuevo desde la pantalla anterior."

Cero errores tipo "HTTP 500" en superficie. Buen trabajo.

### FAQ: ¿pregunta cosas reales?

✅ **Sí, las 5 preguntas son útiles** ([Faq.tsx:11-32](src/components/landing-v2/Faq.tsx)):
1. ¿Mis publicaciones se hacen desde mi cuenta real? — menciona "OAuth" sin contexto
2. ¿Puedo aprobar antes de que se publique? — claro
3. ¿Qué redes están soportadas? — claro
4. ¿Mis datos se usan para entrenar modelos? — directa, tranquilizadora
5. ¿Cuánto tarda en procesar? — expectativas claras

**Faltan**: "¿Cómo organizo mi carpeta antes de subirla?" y "¿Cómo cancelo?"

---

## 4. Heurísticas de Nielsen + WCAG AA — violaciones concretas

### Visibility of system status (Nielsen 1)
- ✅ Onboarding paso 3 muestra progreso paso a paso
- ✅ Auth feedback correcto
- ❌ Mock processing en onboarding ([page.tsx:42-52](src/app/onboarding/3/page.tsx)) — no hace upload real ("Mock: no upload real")
- ❌ Footer "99.98% uptime" simula sistema en vivo sin tenerlo

### Match between system and real world (Nielsen 2)
- ❌ Términos `batch`, `OAuth`, `webhook`, `API`, `ZIP` en superficies públicas
- ✅ Hero usa lenguaje natural ("carpeta", "calendario", "publica")

### User control & freedom (Nielsen 3)
- ✅ Skip en pasos de onboarding
- ✅ Cancelar/back en formularios
- ❌ No hay forma de "deshacer" subida de carpeta (paso 3 procesa sin retorno)

### Consistency & standards (Nielsen 4)
- ❌ 4 sistemas de diseño coexistiendo → inconsistencia visual entre rutas
- ❌ 8 archivos mezclan editorial + rebrand
- ❌ "Comenzar gratis" en hero vs precios en pricing — copy contradictorio

### Error prevention (Nielsen 5)
- ✅ Validación de email + password antes de submit
- ❌ Onboarding paso 3 acepta cualquier carpeta sin previa validación de estructura

### Recognition rather than recall (Nielsen 6)
- ✅ Iconografía consistente para estados (✓ success, ⏳ loading)
- ❌ Términos como `meta.json` sin glosario

### Flexibility & efficiency (Nielsen 7)
- ✅ Toggle mensual/anual en pricing
- ❌ No hay buscador en dashboard admin

### Aesthetic & minimalist design (Nielsen 8)
- ❌ 18 animaciones Tailwind, mayoría no usadas
- ❌ Hero v1 con 300vh de scroll cinemático
- ❌ Multiples grids decorativos en hero-scroll-animation

### Help users recognize, diagnose, recover (Nielsen 9)
- ✅ Mensajes de error de auth bien hechos
- ❌ Sin error visible para "carpeta mal estructurada" en onboarding

### Help and documentation (Nielsen 10)
- ✅ FAQ existe
- ❌ Sin guía de "cómo preparar tu carpeta"
- ❌ Sin video walkthrough ni tooltips

### WCAG AA — violaciones concretas

| Violación | Archivo / contexto |
|---|---|
| Contraste `text-zinc-400` sobre `bg-ink-2` ratio 2.74:1 (auditoría previa flagged) | disclaimers en pricing/footer |
| `text-ink-6` sobre `bg-ink-0` cerca del límite | múltiples (medir uno a uno con axe) |
| Focus visible inconsistente | algunos botones tienen `focus-visible:ring-pri/40`, otros no |
| `aria-label` ausente en botones icon-only | header de admin, sidebar |
| Sin skip-to-content link | [src/app/layout.tsx](src/app/layout.tsx) |
| Animación de mock processing sin `prefers-reduced-motion` | [onboarding/3/page.tsx](src/app/onboarding/3/page.tsx) |

---

## 5. Auditoría de jerarquía visual

### `/` (Landing principal)

**Lo primero que el ojo ve**:
1. Headline gigante con gradient (correcto)
2. Stats falsas (12.4M+, 47, 8.7s) — ❌ desvían atención del CTA
3. CTA "Comenzar gratis →"

**Lo que queremos que vea**: H1 → sub → CTA → prueba real (no stats inventadas).

### Hero v2 vs v1

- **v2 (productivo)**: copy fuerte + stats falsas + 2 CTAs claros. Acertado en 80%.
- **v1 (legacy)**: 300vh pinned scroll cinemático. No vende, abruma. Eliminar.

### Pricing

**Jerarquía visible**:
1. Toggle mensual/anual
2. 3 tarjetas con precio gigante
3. Lista de features
4. CTA "Empezar"

**Problemas**:
- "API + webhooks", "SSO + auditoría" en Studio rompen la jerarquía no técnica
- Sin badge "7 días gratis · sin tarjeta" → genera dudas de compromiso

### Onboarding paso 3

**Jerarquía visible**:
1. Título "Sube tu primera carpeta"
2. Drop zone gigante
3. Sub: "Cualquier cosa vale"
4. Tip: "Suele tardar 8 segundos"

**Problemas**:
- Sin visual del contrato de carpeta (qué archivos)
- Sin botón "Descargar plantilla" → reduce fricción

---

## 6. Consistencia: spacing, radii, sombras, estados

### Spacing scale

`tailwind.config.ts` añade `18` (4.5rem), `88` (22rem), `np-touch` (48px), `np-touch-lg` (56px). El resto se hereda de Tailwind default. **Usos ad-hoc** (medir): valores como `mb-8`, `mb-10`, `mb-16` aparecen mezclados sin patrón.

### Border radii

- `lg`: 4px, `xl`: 4px, `2xl`: 6px, `3xl`: 6px, `4xl`: 8px (override editorial print-zine)
- En componentes np-* se usan `rounded-2xl`, `rounded-full` — coherente
- En componentes legacy/editorial se mezclan radios → inconsistencia

### Sombras

`tailwind.config.ts:165-184` define 16 box-shadows distintos. La mayoría son hairlines `0 1px 0 rgba(20,17,13,0.06)` (editorial). Solo 1-2 se usan en np-*. **Cleanup esperado: reducir a 4 sombras (sm/md/lg/xl)**.

### Estados de componentes

| Componente | hover | focus | active | disabled | loading |
|---|---|---|---|---|---|
| Button | ✅ | ⚠️ inconsistente | ⚠️ | ⚠️ | ❌ |
| Input | ✅ | ✅ con `focus-visible:ring` | — | ⚠️ | — |
| Card | ⚠️ algunos | — | — | — | — |
| Toast | ✅ | — | — | — | — |

---

## 7. Performance percibida

- ❌ **Sin skeletons** en dashboard, posts, batches → flash de loading
- ❌ **Sin `<Suspense>`** estructurado en App Router
- ❌ Mock processing animation en onboarding paso 3 (mentira pedagógica) → cuando el real fallé, el contraste será doloroso
- ⚠️ Hero usa `<img>` o no usa `next/image` priority — verificar
- ⚠️ Bundle: 113 componentes, varios sin uso real (motion/ legacy/, editorial/) → tree-shaking insuficiente
- ⚠️ Three.js + R3F = ~50KB gzipped solo si se usa hero-3d. Si se elimina /hero-preview, eliminar deps.

---

## 8. Conflictos entre auditorías previas + reconciliación

| Decisión | AUDITORIA_BRAND_2026 | AUDITORIA_WEB_BRAND | AUDIT_BRAND_3D_STUDY | branding-redesign/ | **Decisión actual** |
|---|---|---|---|---|---|
| Color primario | Indigo `#4F46E5` | Mantener Gold | Electric Gold `#FFB800` | Azul `#4F7CFF` | **Empezar de cero** |
| Logo | Glifo carpeta→grid | Sin cambio | Logo 3D | Wordmark con punto | **Fuera de alcance v1** |
| Hero 3D | Sí (R3F) | No | Sí (escena interactiva) | Sí (CSS 3D) | **Fuera de alcance v1** |
| Tagline | Programar mi primer mes | — | — | Tira la carpeta | **Tira la carpeta (memoria del usuario)** |
| Tipografía | — | — | — | Geist | **Empezar de cero — explorar opciones** |

**Conclusión**: las 3 auditorías previas se contradicen entre ellas y con el `branding-redesign/`. Decidido: **archivar las 3 en `docs/archive/` y consolidar en este `AUDIT.md`**. El `branding-redesign/` se conserva como referencia pero no es la verdad.

---

## 9. Veredicto + severidades

### Por categoría

| Categoría | Severidad media |
|---|---|
| Sistema de diseño (4 paletas) | **CRÍTICO** |
| Datos falsos (stats, uptime, live) | **CRÍTICO** |
| Sin flujo de compra | **CRÍTICO** |
| Onboarding sin contrato visual | **ALTO** |
| Tipografía Inter por defecto | **ALTO** |
| Jerga técnica en Pricing/FAQ | **ALTO** |
| Componentes legacy en repo | **MEDIO** |
| 18 animaciones, mayoría sin uso | **MEDIO** |
| Auditorías previas contradictorias | **MEDIO** |
| WCAG AA contraste | **MEDIO** |
| Spacing/radii inconsistentes | **BAJO** |
| Performance percibida (skeletons) | **BAJO** |

### Veredicto general

**El producto se puede vender** después de 3 bloques de cambios (~21–31h):
- **Bloque A** (6–9h): sistema de diseño desde cero + limpieza de rutas/legacy
- **Bloque B** (10–14h): claridad de mensaje + Stripe semanal + onboarding visual
- **Bloque C** (5–8h): pulido + accesibilidad + responsive

**Lo que NO hay que tocar**: el copy del hero, el wizard de 5 pasos, los mensajes de error de auth, la estructura básica de la landing-v2. **Lo que SÍ hay que tocar**: todo lo demás del Bloque A + B + C.

**Riesgo más alto**: si se hace un rediseño cosmético sin Stripe, no monetiza. Si se hace Stripe sin limpiar la marca, el frontend sigue oliendo a IA. Los 3 bloques son interdependientes — A bloquea B y C.
