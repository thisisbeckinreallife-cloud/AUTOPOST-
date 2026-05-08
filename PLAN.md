# PLAN.md — Roadmap de implementación Autopost

> Plan ejecutable basado en [AUDIT.md](AUDIT.md). Tres bloques en orden estricto: A bloquea B bloquea C. Confirmar al cerrar cada bloque antes de avanzar al siguiente.

**Esfuerzo total estimado**: 21–31h.
**Dependencia nueva**: `stripe` (única, justificada).
**Decisiones ya tomadas**: pricing semanal €5/€7/€10, sistema de diseño desde cero, /lab/* + noindex, sustituir stats falsas.

---

## Reglas que aplican a todos los bloques

- **Editar lo necesario**, no reescribir archivos completos sin razón.
- **Commits atómicos** por cambio, mensajes claros y específicos.
- **Push tras cerrar cada bloque** (memoria del usuario: commit+push tras cambios).
- **Confirmar con el usuario** al cerrar cada bloque antes de avanzar.
- **Sin dependencias nuevas** salvo `stripe` (justificada en Bloque B).
- **Sin gradientes decorativos**, glassmorphism por defecto, glows, "AI shimmer" salvo función clara.
- **Sin Inter** por defecto — explorar tipografía con criterio.
- **Sin clones SaaS** (Stripe-clone, Linear-clone). Estética propia.
- **Sin testimonios, logos, estadísticas inventadas**. Si no hay datos reales, vacío y marcado.
- **3-4 direcciones** ofrecidas vía `AskUserQuestion` antes de decidir paleta + tipografía (regla del usuario).

---

## Bloque A — Sistema de diseño desde cero + limpieza

**Objetivo**: una sola fuente de verdad visual; eliminar el caos de cuatro sistemas.
**Esfuerzo**: 6–9h. **Bloqueante** para B y C.

### A.1 — Discovery de dirección (antes de tocar código)

- [ ] `AskUserQuestion` con **3-4 direcciones de paleta**:
  - Editorial reposado: paleta cálida tierra + acento único
  - Contraste alto cinemático: dark + acento eléctrico
  - Monocromo cálido + acento sólido (no azul/violeta/morado por defecto)
  - Tonos eléctricos minimalistas
  - Cada opción con preview HTML inline + razón de elección.
- [ ] `AskUserQuestion` con **2-3 stacks tipográficos** (NO Inter):
  - Söhne / GT America + Söhne Mono — geométrico humanista
  - PP Neue Montreal / Mona Sans — neutral modernista
  - Sentinel / Söhne Breit como display + body distinta
  - Cada opción con razón y previews comparativos.

### A.2 — Reescritura de [tailwind.config.ts](tailwind.config.ts)

- [ ] Eliminar `brand-50..950`, `accent-{orange,indigo,coral,...}`, `surface-{primary,secondary,card,...}`
- [ ] Eliminar `ink-0..10`, `pri-*`, `ai-*`, `np-*`
- [ ] Eliminar `success-*`, `warning-*`, `error-*`, `info-*` (Aluminum)
- [ ] Eliminar `hatch-*`
- [ ] Sustituir por sistema nuevo (decidido en A.1):
  - `bg`, `bg-elevated`, `bg-warm`, `bg-code`
  - `fg`, `fg-secondary`, `fg-muted`
  - `accent`, `accent-hover`, `accent-soft`
  - `border`, `border-light`
  - `success`, `warning`, `error`, `info` (semántico, escala simple)
- [ ] Reescribir `fontFamily` con la elegida (sin fallback a Inter en primera posición)
- [ ] Recortar `boxShadow` de 16 → 4 (`sm`, `md`, `lg`, `xl`)
- [ ] Recortar `borderRadius` de 8 → 5 (`sm` 4, `md` 8, `lg` 12, `xl` 16, `full`)
- [ ] Eliminar `gradient-mesh`, `gradient-hero`, `gradient-cta`, `gradient-spotlight`, `gradient-magic` (decorativos)

### A.3 — Reescritura de [src/app/globals.css](src/app/globals.css)

- [ ] Eliminar variables CSS `:root` legacy (ink, pri, ai, np-*)
- [ ] Definir variables CSS nuevas (alineadas con A.2)
- [ ] Eliminar `--np-shadow-*`, `--np-glow-*` (efectos decorativos)
- [ ] Cero `@import` de Google Fonts (migrar a `next/font` en A.4)

### A.4 — Migración a `next/font` en [src/app/layout.tsx](src/app/layout.tsx)

- [ ] Importar fuente elegida desde `next/font/google` o `next/font/local`
- [ ] Aplicar variable CSS al `<html>` o `<body>`
- [ ] Configurar `display: 'swap'` y `preload: true`
- [ ] Eliminar `<link>` Google Fonts si existe en metadata

### A.5 — Tokens de motion (18 → 4-5)

- [ ] Conservar: `fade-in`, `fade-up`, `slide-up`, `subtle-pulse`, `marquee` (si se usa)
- [ ] Eliminar: `glow-pulse`, `shimmer`, `border-flow`, `cta-pulse`, `mockup-blink`, `rotate-border`, `gradient-x`
- [ ] Eliminar `keyframes` correspondientes
- [ ] Verificar que ningún componente importe los eliminados (grep + reemplazo)

### A.6 — Limpieza de rutas (mover a /lab/*)

- [ ] Crear `src/app/lab/` directorio
- [ ] Mover [src/app/demo/](src/app/demo/) → `src/app/lab/demo/`
- [ ] Mover [src/app/editorial/](src/app/editorial/) → `src/app/lab/editorial/`
- [ ] Mover [src/app/hero-preview/](src/app/hero-preview/) → `src/app/lab/hero-preview/`
- [ ] Mover [src/app/palette-preview/](src/app/palette-preview/) → `src/app/lab/palette-preview/`
- [ ] Mover [src/app/brand-lab/](src/app/brand-lab/) → `src/app/lab/brand-lab/`
- [ ] Mover [src/app/comparar/](src/app/comparar/) → `src/app/lab/comparar/`
- [ ] Añadir `metadata: { robots: { index: false, follow: false } }` a cada page.tsx movido
- [ ] Crear [public/robots.txt](public/robots.txt):
  ```
  User-agent: *
  Disallow: /lab/
  Disallow: /aprobar/
  Disallow: /informe/
  Disallow: /(admin)/
  Sitemap: https://autopost.app/sitemap.xml
  ```
- [ ] Configurar redirects en [next.config.mjs](next.config.mjs) de URLs viejas → `/lab/*` (301)

### A.7 — Borrado de legacy (DESTRUCTIVO — confirmar antes)

> ⚠️ Esta tarea borra código. Pediré confirmación explícita al usuario antes de ejecutar.

- [ ] Borrar `src/components/landing/` (16 archivos v1, incluye hatch-hero 300vh)
- [ ] Borrar `src/components/editorial/` (6 archivos)
- [ ] Borrar `src/components/hero-3d/` (6 archivos R3F)
- [ ] Borrar [dashboard-aluminum-breakdown.html](dashboard-aluminum-breakdown.html) (84KB)
- [ ] Borrar [ola3-aluminum-breakdown.html](ola3-aluminum-breakdown.html) (75KB)
- [ ] Crear `docs/archive/` y mover ahí:
  - [AUDITORIA_BRAND_2026.md](AUDITORIA_BRAND_2026.md)
  - [AUDITORIA_WEB_BRAND.md](AUDITORIA_WEB_BRAND.md)
  - [AUDIT_BRAND_3D_STUDY.md](AUDIT_BRAND_3D_STUDY.md)
- [ ] Conservar `branding-redesign/` como referencia (no se borra, no se integra)
- [ ] Si se borra `hero-3d/`, evaluar quitar deps `@react-three/drei`, `@react-three/fiber`, `three`, `maath`, `@types/three` de `package.json` → ahorro ~80KB gzipped

### A.8 — Auditar src/components/motion/

- [ ] Grep por cada uno de los 16 componentes motion en el resto del repo:
  - `motion-magnetic`, `motion-spotlight`, `motion-beam`, `motion-tilt`, `motion-parallax`,
  - `motion-stagger`, `motion-reveal`, `motion-text`, `motion-float`, `motion-fade`,
  - `motion-slide`, `motion-scale`, `motion-rotate`, `motion-blur`, `motion-number`, `motion-scroll`
- [ ] Borrar los que tienen 0 importaciones
- [ ] Conservar los usados por landing-v2 productiva

### A.9 — Reescritura de componentes UI base

- [ ] [src/components/ui/button.tsx](src/components/ui/button.tsx) — variantes `primary`, `secondary`, `ghost`. Estados: hover, focus, active, disabled, loading (spinner inline)
- [ ] [src/components/ui/card.tsx](src/components/ui/card.tsx) — sin glassmorphism. Solo border + padding consistente
- [ ] [src/components/ui/input.tsx](src/components/ui/input.tsx) — focus-visible ring, error state, label asociado
- [ ] [src/components/ui/badge.tsx](src/components/ui/badge.tsx) — variantes mínimas (default, accent, success, error)
- [ ] [src/components/ui/toast.tsx](src/components/ui/toast.tsx) — entrada/salida consistentes, posición fija
- [ ] Eliminar `src/components/ui/hero-scroll-animation.tsx` (icon grid SaaS clónico) si no es usada en landing-v2
- [ ] Eliminar `src/components/ui/rotating-text.tsx`, `gooey-text-morphing.tsx`, `container-scroll-animation.tsx` si no se usan

### Verificación de cierre — Bloque A

```bash
npm run type-check                              # 0 errores
npm run lint                                    # 0 errores nuevos
npm run dev                                     # carga sin error
grep -r "brand-\|surface-\|ink-\|pri-\|ai-\|np-\|hatch-" src/  # → 0 resultados
curl -I https://localhost:3000/lab/demo         # 200
curl -I https://localhost:3000/demo             # 301 → /lab/demo
curl -I https://localhost:3000/robots.txt       # 200
```

**Commit messages sugeridos**:
- `chore(design): remove 4 legacy design systems from tailwind config`
- `feat(design): introduce new design tokens (paleta + tipografía elegidas)`
- `refactor(routes): move preview routes to /lab/* with noindex`
- `chore(repo): archive previous audits + delete legacy components`
- `feat(ui): rewrite Button/Card/Input/Badge/Toast with new system`

---

## Bloque B — Claridad de mensaje + flujo de venta

**Objetivo**: cualquier persona no técnica entiende qué hace, cuánto cuesta y cómo empezar en menos de 30s.
**Esfuerzo**: 10–14h. Depende de Bloque A.

### B.1 — Hero ([src/components/landing-v2/Hero.tsx](src/components/landing-v2/Hero.tsx))

- [ ] Conservar copy: badge, h1 ("Tira la carpeta. / El resto va solo."), sub
- [ ] Eliminar bloque de stats falsas (líneas 151-160)
- [ ] Sustituir por bloque honesto:
  - "7 redes soportadas" (verificar que sea cierto)
  - "Sin permanencia"
  - "7 días gratis · sin tarjeta"
- [ ] Decisión durante implementación: mantener o no el `linear-gradient` 3-color del headline (preguntar al usuario con preview)
- [ ] Quitar gradient mesh blobs si en el sistema nuevo no encajan
- [ ] CTA primario: "Empezar 7 días gratis" (alineado con Stripe trial)
- [ ] CTA secundario: "Ver cómo funciona" (sin cambio)

### B.2 — HowItWorks ([src/components/landing-v2/HowItWorks.tsx](src/components/landing-v2/HowItWorks.tsx))

- [ ] Eliminar `animate-pulse` verde sobre "Esta semana" (línea 173)
- [ ] Sustituir mockup falso por captura estática real del calendario (o mockup honestamente etiquetado)
- [ ] Conservar 3-step flow (carpeta → IA → calendario)

### B.3 — InsideTour ([src/components/landing-v2/InsideTour.tsx](src/components/landing-v2/InsideTour.tsx))

- [ ] Reescribir con foco en producto real
- [ ] Sustituir cards conceptuales por capturas reales del dashboard (o mockups honestos)
- [ ] Reducir de 4 cards a 3 si el contenido no justifica las 4

### B.4 — Pricing ([src/components/landing-v2/Pricing.tsx](src/components/landing-v2/Pricing.tsx)) — reescritura completa

- [ ] **Cambiar a semanal**:
  - Básico: €5/sem (ex €19/mes)
  - Pro: €7/sem (ex €49/mes)
  - Agency: €10/sem (ex €149/mes)
- [ ] Decidir con usuario: ¿toggle semanal/mensual/anual? ¿solo semanal con descuento yearly?
- [ ] Sustituir features con jerga:
  - "API + webhooks" → "Conexión con Zapier / Make" (o eliminar si no es MVP)
  - "SSO + auditoría" → "Inicio con Google / Microsoft" + "Historial de cambios"
- [ ] Añadir badge sobre los 3 tiers: "7 días gratis · sin tarjeta"
- [ ] CTA "Empezar" → POST a `/api/stripe/checkout` (no a `/signup`)

### B.5 — Integración Stripe (NUEVO)

#### B.5.1 — Configuración

- [ ] Crear cuenta Stripe (responsabilidad del usuario, no de Claude)
- [ ] Crear 3 productos en Stripe Dashboard:
  - Básico semanal · €5 · `interval: week`
  - Pro semanal · €7 · `interval: week`
  - Agency semanal · €10 · `interval: week`
- [ ] Obtener Price IDs y guardar en `.env`
- [ ] Añadir variables a [.env.example](.env.example):
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PRICE_BASIC_WEEKLY=price_...
  STRIPE_PRICE_PRO_WEEKLY=price_...
  STRIPE_PRICE_AGENCY_WEEKLY=price_...
  ```
- [ ] `npm install stripe`

#### B.5.2 — Schema Prisma

- [ ] Añadir tabla a [prisma/schema.prisma](prisma/schema.prisma):
  ```prisma
  model Subscription {
    id                   String   @id @default(cuid())
    userId               String   @unique
    user                 User     @relation(fields: [userId], references: [id])
    stripeCustomerId     String   @unique
    stripeSubscriptionId String   @unique
    tier                 String   // "basic" | "pro" | "agency"
    status               String   // "trialing" | "active" | "past_due" | "canceled" | "incomplete"
    trialEnd             DateTime?
    currentPeriodEnd     DateTime
    createdAt            DateTime @default(now())
    updatedAt            DateTime @updatedAt
  }
  ```
- [ ] `npx prisma migrate dev --name add_subscription`
- [ ] `npx prisma generate`

#### B.5.3 — Helper [src/lib/stripe.ts](src/lib/stripe.ts) (NUEVO)

- [ ] Cliente Stripe inicializado
- [ ] Función `getPriceIdByTier(tier)`
- [ ] Función `getTierByPriceId(priceId)`

#### B.5.4 — Endpoint checkout (NUEVO)

- [ ] [src/app/api/stripe/checkout/route.ts](src/app/api/stripe/checkout/route.ts):
  ```ts
  POST { tier: "basic" | "pro" | "agency" }
  → crea Stripe Checkout Session con:
    - mode: "subscription"
    - line_items: [{ price: getPriceIdByTier(tier), quantity: 1 }]
    - subscription_data: { trial_period_days: 7 }
    - success_url: /billing/success?session_id={CHECKOUT_SESSION_ID}
    - cancel_url: /billing/cancel
    - customer_email: session user email
  → return { url: session.url }
  ```

#### B.5.5 — Webhook (NUEVO)

- [ ] [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts):
  - Verificar firma con `STRIPE_WEBHOOK_SECRET`
  - Manejar eventos:
    - `checkout.session.completed` → crear `Subscription` en BD
    - `customer.subscription.updated` → actualizar status, tier, currentPeriodEnd
    - `customer.subscription.deleted` → status = "canceled"
    - `invoice.payment_failed` → status = "past_due"
  - Idempotencia: usar `event.id` como key
  - Retornar 200 rápido

#### B.5.6 — Páginas billing

- [ ] [src/app/billing/success/page.tsx](src/app/billing/success/page.tsx) — confirmación + redirect a /onboarding/1 si es nuevo
- [ ] [src/app/billing/cancel/page.tsx](src/app/billing/cancel/page.tsx) — mensaje + CTA volver a pricing

### B.6 — CTA cohesión

- [ ] Hero · Footer · Pricing · sticky-cta · onboarding completion: unificar a "Empezar 7 días gratis"
- [ ] Eliminar "Comenzar gratis" suelto en Footer y demás
- [ ] Si hay sticky-cta, alinear copy

### B.7 — FAQ ([src/components/landing-v2/Faq.tsx](src/components/landing-v2/Faq.tsx))

- [ ] Conservar las 5 preguntas existentes
- [ ] Reescribir respuesta a "¿Mis publicaciones se hacen desde mi cuenta real?":
  - Antes: "Autopost se conecta vía OAuth oficial…"
  - Después: "Sí. Autopost se conecta a tus redes de forma segura, igual que cuando entras con Google. Las contraseñas no se guardan en ningún momento."
- [ ] Añadir pregunta nueva: "¿Cómo organizo mi carpeta antes de subirla?"
  - Respuesta: visual + "No hace falta una estructura concreta. Sube cualquier carpeta con imágenes, vídeos o textos y la IA detecta el formato. Si quieres, puedes descargar una carpeta de ejemplo."
- [ ] Añadir pregunta nueva: "¿Cómo cancelo?"
  - Respuesta: "Desde tu panel, sección Facturación. Sin permanencia, ni mes mínimo, ni llamadas para cancelar."

### B.8 — Onboarding paso 3 ([src/app/onboarding/3/page.tsx](src/app/onboarding/3/page.tsx))

- [ ] Añadir bloque visual "Qué puede haber en la carpeta" (antes del drop zone):
  - 4 ejemplos en mini-grid:
    - 📷 Imagen suelta → la IA la detecta como post
    - 🎬 Vídeo → reel
    - 🖼️ 5 imágenes → carrusel
    - 📝 Texto suelto → leyenda sugerida
- [ ] Añadir botón secundario "Descargar carpeta de ejemplo" → `/api/onboarding/sample-folder` (si no existe, crear endpoint que devuelva un .zip de ejemplo)
- [ ] Si "Cualquier estructura vale" no es 100% cierto, reformular con honestidad (preguntar al usuario)
- [ ] Eliminar `accept=".zip,.txt,.pdf"` de `<input>` si confunde — preguntar al usuario qué tipos acepta el AI parser real

### B.9 — Mensajes de error globales

- [ ] Pasada por `src/app/(admin)` y `src/app/onboarding/`:
  - Grep `error`, `fallo`, `failed` en componentes
  - Verificar tono humano (no técnico)
  - Auth ya está bien (validado en auditoría)

### B.10 — Eliminar "ZIP" de superficie pública

- [ ] [src/app/demo/page.tsx:108](src/app/demo/page.tsx) → "Arrastra tu carpeta" (si /demo se mantiene público; ya se movió a /lab en A.6 → no es problema)
- [ ] [src/app/legal/privacy/page.tsx:59](src/app/legal/privacy/page.tsx) → reformular `meta.json` en lenguaje legal accesible

### Verificación de cierre — Bloque B

```bash
# Flujo manual completo:
# 1. Abrir /
# 2. Ver pricing semanal correcto (€5 / €7 / €10)
# 3. Click "Empezar 7 días gratis" en cualquier tier
# 4. Stripe Checkout aparece (modo test)
# 5. Tarjeta 4242 4242 4242 4242 + cualquier fecha futura + CVV cualquiera
# 6. Trial activa (sin cobrar)
# 7. Webhook recibe checkout.session.completed
# 8. Tabla Subscription tiene fila con status="trialing"
# 9. Redirect a /billing/success
# 10. Acceso a /onboarding/1 (o /dashboard si ya estaba)
# 11. Onboarding paso 3 muestra visual de carpeta + botón ejemplo
# 12. FAQ tiene 7 preguntas (5 originales + 2 nuevas)
# 13. CTAs uniformes "Empezar 7 días gratis"

# Testing:
npm run type-check                                              # 0 errores
npm run dev                                                     # ok
curl -X POST /api/stripe/checkout -d '{"tier":"basic"}'         # 200 + url
stripe listen --forward-to localhost:3000/api/stripe/webhook    # ok (CLI)
```

**Commit messages sugeridos**:
- `feat(pricing): switch to weekly billing (€5/€7/€10) + remove tech jargon`
- `feat(billing): integrate Stripe Checkout with 7-day trial`
- `feat(billing): Stripe webhook + Subscription model`
- `feat(landing): remove fake stats from hero, replace with real capabilities`
- `feat(landing): remove fake live indicator + uptime badge`
- `feat(faq): rewrite OAuth in human terms + add 2 new questions`
- `feat(onboarding): visual contract for folder upload + sample download`

---

## Bloque C — Pulido + accesibilidad + responsive

**Objetivo**: cero detalles que delaten falta de oficio.
**Esfuerzo**: 5–8h. Depende de Bloques A y B.

### C.1 — Accesibilidad WCAG AA

- [ ] Auditoría con `npx @axe-core/cli http://localhost:3000` → 0 violaciones críticas
- [ ] Lighthouse a11y ≥ 95 en `/`, `/signup`, `/login`, `/onboarding/3`, `/dashboard`
- [ ] Contraste: revisar todos `text-fg-muted` sobre `bg`, `bg-warm`, `bg-elevated`
- [ ] Focus visible en todos los `<button>`, `<a>`, `<Link>` con ring de 2px del accent
- [ ] Labels asociados a todos los inputs (`<label htmlFor>` o `aria-label`)
- [ ] `aria-label` en botones icon-only (sidebar, header, toolbar)
- [ ] Skip-to-content link en [src/app/layout.tsx](src/app/layout.tsx):
  ```tsx
  <a href="#main" className="skip-link">Saltar al contenido</a>
  ```
- [ ] `prefers-reduced-motion` en globals.css desactiva animaciones decorativas

### C.2 — Estados de componentes

Para cada componente UI base, definir y testear visualmente:

| Componente | hover | focus | active | disabled | loading |
|---|---|---|---|---|---|
| Button | ✓ | ✓ | ✓ | ✓ | ✓ (spinner) |
| Input | ✓ | ✓ | — | ✓ | — |
| Card | ✓ | — | — | — | — |
| Badge | — | — | — | — | — |
| Toast | ✓ entrada/salida | — | — | — | — |

### C.3 — Responsive real

- [ ] DevTools 375px (iPhone SE), 768px (iPad), 1440px (MacBook 14")
- [ ] Verificar:
  - Cero scroll horizontal en cualquier viewport
  - Hero h1 con `clamp()` legible en 375px
  - Pricing grid colapsa a stack vertical en mobile, plan featured destacado
  - Footer 5-cols colapsan a 2-cols → 1-col
  - Onboarding steps en 375px sin overflow
  - Nav superior con menú hamburguesa en mobile (si existe)
- [ ] Lighthouse mobile perf ≥ 80

### C.4 — Microinteracciones funcionales

- [ ] Drag & drop en onboarding/3: feedback visual claro al hover (cambio de borde/fondo)
- [ ] Spinner inline en botones submit cuando carga (no toast separado)
- [ ] Toast tras: eliminar, guardar, conectar red, suscripción exitosa
- [ ] Cero animaciones decorativas sin función (ya limpiadas en Bloque A)

### C.5 — Performance percibida

- [ ] Skeletons en:
  - [src/app/(admin)/dashboard/page.tsx](src/app/(admin)/dashboard/page.tsx) (cargas iniciales)
  - [src/app/(admin)/businesses/[slug]/posts/page.tsx](src/app/(admin)/businesses/[slug]/posts/page.tsx)
  - [src/app/(admin)/businesses/[slug]/batches/page.tsx](src/app/(admin)/businesses/[slug]/batches/page.tsx)
- [ ] `<Suspense>` con loading state donde Next 14 lo permita (Server Components)
- [ ] Imágenes con `next/image` y `priority` en hero
- [ ] Verificar bundle size: `npm run build` y revisar el output (si Three.js sigue, ahorrar ~80KB eliminándolo)

### C.6 — SEO básico

- [ ] `<title>` + `<meta description>` por página relevante (algunos ya tienen)
- [ ] Open Graph + Twitter Card en landing:
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type=website`
  - `twitter:card=summary_large_image`
  - Generar imagen OG (1200x630) — si no existe, placeholder
- [ ] [src/app/sitemap.ts](src/app/sitemap.ts) (NUEVO):
  ```ts
  import type { MetadataRoute } from 'next';
  export default function sitemap(): MetadataRoute.Sitemap {
    return [
      { url: 'https://autopost.app/', priority: 1 },
      { url: 'https://autopost.app/signup', priority: 0.8 },
      { url: 'https://autopost.app/login', priority: 0.5 },
      { url: 'https://autopost.app/legal/privacy', priority: 0.3 },
      { url: 'https://autopost.app/legal/terms', priority: 0.3 },
    ];
  }
  ```
- [ ] [public/robots.txt](public/robots.txt) ya creado en Bloque A

### C.7 — Consistencia final

- [ ] Auditoría visual de spacing en landing: solo valores `4 8 12 16 24 32 48 64 96px`
- [ ] Auditoría de border-radius: solo `4 8 12 16 full`
- [ ] Cualquier valor ad-hoc fuera de la escala se reescribe
- [ ] Sombras: solo `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

### Verificación de cierre — Bloque C

```bash
# Accesibilidad
npx @axe-core/cli http://localhost:3000                           # 0 críticos
npx @axe-core/cli http://localhost:3000/signup                    # 0 críticos
npx @axe-core/cli http://localhost:3000/onboarding/3              # 0 críticos

# Responsive
# Manual: DevTools 375 / 768 / 1440 sin scroll horizontal

# Performance
npm run build                                                     # ok
# Manual: Lighthouse perf ≥ 80, a11y ≥ 95, SEO ≥ 90

# SEO
curl https://autopost.app/sitemap.xml                             # 200 con URLs
curl https://autopost.app/robots.txt                              # 200

# Keyboard nav
# Manual: Tab a través de toda la landing, verificar focus visible y orden lógico
```

**Commit messages sugeridos**:
- `feat(a11y): WCAG AA compliance + skip-to-content + focus visible`
- `feat(ui): consistent component states (hover/focus/active/disabled/loading)`
- `feat(perf): skeletons + Suspense + next/image priority on hero`
- `feat(seo): sitemap + Open Graph + Twitter Card metadata`
- `chore(design): normalize spacing/radii/shadow scales`

---

## Decisiones que se piden durante ejecución

> Por la regla del usuario: "ofrece 3-4 direcciones antes de decidir".

| # | Bloque | Pregunta | Cuándo |
|---|---|---|---|
| 1 | A.1 | Paleta — 3-4 direcciones con preview | Antes de tocar tailwind.config.ts |
| 2 | A.1 | Tipografía — 2-3 stacks NO Inter | Antes de tocar globals.css |
| 3 | A.7 | Confirmar borrado de legacy (destructivo) | Antes de `rm` |
| 4 | B.1 | Reemplazo de stats hero — 3 alternativas | Al editar Hero.tsx |
| 5 | B.4 | Studio/Agency tier features — qué dejar vs quitar | Al reescribir Pricing.tsx |
| 6 | B.4 | Toggle semanal/mensual/anual o solo semanal | Al reescribir Pricing.tsx |
| 7 | B.8 | "Cualquier estructura vale" en onboarding — ¿es cierto? | Al editar onboarding/3 |

---

## Delegación a agentes especializados (optativo)

Pediré permiso explícito antes de invocar cada uno.

| Bloque | Agente | Para qué |
|---|---|---|
| A.1 | `design-brand-guardian` | Validar identidad coherente entre paleta, tipografía y tono |
| A.1 / A.9 | `design-ui-designer` | Definir tokens y reescribir UI base con criterio visual |
| B.4 / B.7 / B.8 | `marketing-content-creator` | Copy más vendedor sin clichés SaaS |
| B.5 | `engineering-backend-architect` | Stripe webhook robusto, idempotencia, manejo de errores |
| C.1 | `testing-accessibility-auditor` | WCAG AA + screen reader test (VoiceOver / NVDA) |

---

## Fuera de alcance (declarado)

- Logo / glifo proprietario (auditoría previa lo proponía, no es prioridad para vender)
- Hero 3D con Three.js / R3F
- Tema light (mantener dark-only en v1)
- Integración real con Meta Graph API en demo público (mantener mock)
- Paridad i18n EN nueva (ES sigue como primario)
- App Review de Meta (proceso externo, depende del usuario)

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Cliente Stripe no configurado | El usuario debe crear cuenta + productos antes de B.5 |
| Borrado de legacy elimina algo aún usado | Confirmar con grep antes de rm; conservar en branch separada por si hay que recuperar |
| Cambios de paleta rompen visualmente componentes admin | Pasada manual por todas las rutas admin tras Bloque A |
| Stripe webhook no llega (firewall/redirección) | Usar `stripe listen --forward-to` en dev; en prod, configurar endpoint público |
| Trial 7 días con tarjeta vs sin tarjeta | Decisión del usuario: con tarjeta = más conversión a pago, sin tarjeta = más signups |

---

## Próximos pasos al aprobar este PLAN.md

1. Esperar confirmación del usuario.
2. Empezar **Bloque A** con `AskUserQuestion` para paleta + tipografía (A.1).
3. Implementar A.2 → A.9 con commits atómicos.
4. Verificar cierre de Bloque A con checklist arriba.
5. Confirmar con el usuario antes de avanzar a Bloque B.
6. Repetir patrón para B y C.
